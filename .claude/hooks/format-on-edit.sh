#!/bin/bash
# Auto-formats files after Edit/Write using Prettier.
# Runs only on file types that Prettier handles.
# Non-blocking: exits 0 regardless of Prettier result.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Normalize to relative path for pattern matching
REL_PATH="${FILE_PATH#"$CLAUDE_PROJECT_DIR"/}"

# Skip files outside the project source (e.g. .claude/ config files)
case "$REL_PATH" in
  .claude/*) exit 0 ;;
esac

# Only format file types that Prettier handles in this project
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.yml|*.yaml)
    "${CLAUDE_PROJECT_DIR}/node_modules/.bin/prettier" --write "$FILE_PATH" > /dev/null 2>&1
    ;;
esac

exit 0
