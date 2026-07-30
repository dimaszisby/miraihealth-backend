#!/usr/bin/env bash
# bootstrap-fork.sh — rename this repo for a new project.
#
# Usage:
#   ./scripts/bootstrap-fork.sh --name my-app
#
# What it does:
#   1. Replaces "lakira-backend" with <new-name> in package.json,
#      package-lock.json, docker-compose.test.yml, CI workflows, and scripts.
#   2. Replaces "lakira" with the derived short name (strip -backend suffix)
#      in queue-topology references, DB names, and CI DB refs.
#   3. Rotates JWT_SECRET in .env.development.
#   4. Sets APP_NAME=<new-name> in .env.development.
#   5. Drops FORKED-FROM.md with the upstream commit SHA.
#
# The script is idempotent: running it twice with the same name is a no-op.

set -euo pipefail

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
NEW_NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      NEW_NAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --name <new-app-name>" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$NEW_NAME" ]]; then
  echo "Error: --name is required." >&2
  echo "Usage: $0 --name <new-app-name>" >&2
  exit 1
fi

# Reject anything that isn't a safe slug. Prevents sed-delimiter injection
# (e.g. names containing '/' or '|') and downstream shell-quoting hazards.
if ! [[ "$NEW_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Error: --name must match ^[a-z][a-z0-9-]*$ (lowercase letters, digits, hyphens; must start with a letter)." >&2
  echo "Got: '$NEW_NAME'" >&2
  exit 1
fi

# Derive short name (strip trailing -backend, -api, etc.)
SHORT_NAME="${NEW_NAME%%-backend}"
SHORT_NAME="${SHORT_NAME%%-api}"

# Derive Title-Cased display name from short name (matches src/config/app-name.ts toTitleCase).
# e.g. "my-app" → "My App", "lakira" → "Lakira"
DISPLAY_NAME=""
IFS='-' read -ra _PARTS <<< "$SHORT_NAME"
for _p in "${_PARTS[@]}"; do
  [[ -z "$_p" ]] && continue
  _head="$(printf '%s' "${_p:0:1}" | tr '[:lower:]' '[:upper:]')"
  DISPLAY_NAME+="${_head}${_p:1} "
done
DISPLAY_NAME="${DISPLAY_NAME% }"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Detect sed flavour (BSD vs GNU) and build an argument array.
# Using an array (not eval) so patterns containing spaces work correctly.
# ---------------------------------------------------------------------------
if sed --version 2>/dev/null | grep -q GNU; then
  SED_INPLACE=(sed -i)
else
  # macOS / BSD sed requires an empty extension argument
  SED_INPLACE=(sed -i '')
fi

do_sed() {
  local pattern="$1"
  local file="$2"
  if [[ -f "$file" ]]; then
    "${SED_INPLACE[@]}" "$pattern" "$file"
  fi
}

# ---------------------------------------------------------------------------
# Guard: skip if already renamed
# ---------------------------------------------------------------------------
CURRENT_NAME=$(node -e "process.stdout.write(require('./package.json').name)" 2>/dev/null || echo "")
if [[ "$CURRENT_NAME" == "$NEW_NAME" ]]; then
  echo "Already renamed to '$NEW_NAME'. Nothing to do."
  exit 0
fi

echo "Renaming '$CURRENT_NAME' → '$NEW_NAME' (short: lakira → $SHORT_NAME)"

# ---------------------------------------------------------------------------
# 1. Replace "lakira-backend" → NEW_NAME in key files
# ---------------------------------------------------------------------------
FILES_FULL=(
  "$REPO_ROOT/package.json"
  "$REPO_ROOT/package-lock.json"
  "$REPO_ROOT/docker-compose.test.yml"
  "$REPO_ROOT/.env.example"
  "$REPO_ROOT/.github/workflows/backend-ci.yml"
  "$REPO_ROOT/.github/workflows/backend-prd-drift-warning.yml"
  "$REPO_ROOT/.github/workflows/promote-dev-to-staging.yml"
  "$REPO_ROOT/scripts/test-ci.sh"
)

for f in "${FILES_FULL[@]}"; do
  do_sed "s/lakira-backend/$NEW_NAME/g" "$f"
done

# ---------------------------------------------------------------------------
# 2. Replace "lakira" → SHORT_NAME in DB names, CI refs, queue topology refs,
#    and Title-cased "Lakira" → DISPLAY_NAME in human-readable workflow strings.
#    (Only in config/CI files — runtime src/ uses app-name.ts)
# ---------------------------------------------------------------------------
FILES_SHORT=(
  "$REPO_ROOT/docker-compose.test.yml"
  "$REPO_ROOT/.github/workflows/backend-ci.yml"
  "$REPO_ROOT/.github/workflows/backend-prd-drift-warning.yml"
  "$REPO_ROOT/.github/workflows/promote-dev-to-staging.yml"
  "$REPO_ROOT/scripts/test-ci.sh"
  "$REPO_ROOT/.env.example"
)

for f in "${FILES_SHORT[@]}"; do
  # DB/queue/identifier slots (case-insensitive prefix match)
  do_sed "s/[Ll]akira_/${SHORT_NAME}_/g" "$f"
  do_sed "s/[Ll]akira\./${SHORT_NAME}./g" "$f"
  # Human-readable Title Case in workflow names, badge text, etc.
  do_sed "s/Lakira Backend/${DISPLAY_NAME} Backend/g" "$f"
  do_sed "s/Lakira/${DISPLAY_NAME}/g" "$f"
done

# ---------------------------------------------------------------------------
# 3. Rotate JWT_SECRET in .env.development (if it exists)
# ---------------------------------------------------------------------------
ENV_DEV="$REPO_ROOT/.env.development"
if [[ -f "$ENV_DEV" ]]; then
  NEW_SECRET=$(openssl rand -hex 32)
  do_sed "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" "$ENV_DEV"
  echo "JWT_SECRET rotated in .env.development"
fi

# ---------------------------------------------------------------------------
# 4. Set APP_NAME in .env.development
# ---------------------------------------------------------------------------
if [[ -f "$ENV_DEV" ]]; then
  if grep -q "^APP_NAME=" "$ENV_DEV"; then
    do_sed "s|^APP_NAME=.*|APP_NAME=$NEW_NAME|" "$ENV_DEV"
  else
    echo "APP_NAME=$NEW_NAME" >> "$ENV_DEV"
  fi
  echo "APP_NAME set to '$NEW_NAME' in .env.development"
fi

# ---------------------------------------------------------------------------
# 5. Drop FORKED-FROM.md
# ---------------------------------------------------------------------------
UPSTREAM_SHA=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
cat > "$REPO_ROOT/FORKED-FROM.md" <<EOF
# Forked From

This project was forked from the Lakira Backend template.

- **Upstream commit**: $UPSTREAM_SHA
- **Fork date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- **New name**: $NEW_NAME
EOF

echo "FORKED-FROM.md created."
echo ""
echo "Done! Next steps:"
echo "  1. Run: npm install"
echo "  2. Copy .env.example to .env and fill in secrets"
echo "  3. Run: npm run migrate:dev"
echo "  4. Run: npm test"
