#!/bin/bash
# Blocks dangerous shell commands.
# Exit 0 = allow, Exit 2 = block (reason via stderr)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# --- Block: npm publish ---
if echo "$COMMAND" | grep -qE '(^|\s|&&|\|)npm\s+publish(\s|$)'; then
  echo "Blocked: 'npm publish' is not allowed. Publishing must be done through CI/CD." >&2
  exit 2
fi

# --- Block: git push --force (any variant) ---
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*(\s-f\b|\s--force\b|\s--force-with-lease\b)'; then
  echo "Blocked: force-push is not allowed. Use regular 'git push' instead." >&2
  exit 2
fi

# --- Block: git reset --hard ---
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo "Blocked: 'git reset --hard' can destroy work. Use 'git stash' or 'git checkout' for specific files." >&2
  exit 2
fi

# --- Block: git clean -f ---
if echo "$COMMAND" | grep -qE 'git\s+clean\s+.*-f'; then
  echo "Blocked: 'git clean -f' removes untracked files permanently. Remove files individually if needed." >&2
  exit 2
fi

# --- Block: DROP TABLE / DROP DATABASE (case-insensitive) ---
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE)'; then
  echo "Blocked: DROP TABLE/DATABASE not allowed. Use Sequelize migrations for schema changes." >&2
  exit 2
fi

# --- Block: direct psql schema-altering commands ---
if echo "$COMMAND" | grep -qE 'psql.*(-c|--command)' && echo "$COMMAND" | grep -qiE '(ALTER|DROP|TRUNCATE)\s+(TABLE|DATABASE|INDEX)'; then
  echo "Blocked: direct psql schema changes not allowed. Use Sequelize migrations instead." >&2
  exit 2
fi

# --- Block: git add -A / git add . (risks staging .env files) ---
if echo "$COMMAND" | grep -qE 'git\s+add\s+(-A\b|--all\b|\.\s*$|\.\s+)'; then
  echo "Blocked: 'git add -A / git add .' risks staging .env files. Add files explicitly (e.g. git add src/)." >&2
  exit 2
fi

# --- Block: rm -rf on project root or broad paths ---
if echo "$COMMAND" | grep -qE 'rm\s+(-rf|-fr)\s+(/|\.\.|\.\s|"\."|'"'"'\.'"'"'|\$)'; then
  echo "Blocked: broad 'rm -rf' is dangerous. Remove specific files/directories instead." >&2
  exit 2
fi

exit 0
