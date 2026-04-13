#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${OPENCLAW_WORKSPACE:-/root/.openclaw/workspace}"
FOLDER="${1:-inbox}"
SOURCE="${2:-openclaw-vps}"
TITLE="${3:-}"
BODY="${4:-}"
COMMIT_PREFIX="${COMMIT_PREFIX:-Stage shared memory artifact}"

if [[ -z "$TITLE" || -z "$BODY" ]]; then
  echo "Usage: capture-and-sync-memory.sh [folder] [source] <title> <body>" >&2
  echo "Example: capture-and-sync-memory.sh inbox openclaw-vps \"bridge note\" \"- bullet 1\n- bullet 2\"" >&2
  exit 1
fi

cd "$WORKSPACE"

FILE="$($WORKSPACE/scripts/write-sync-artifact-vps.sh "$FOLDER" "$SOURCE" "$TITLE" "$BODY")"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Failed to stage memory artifact" >&2
  exit 1
fi

REL_FILE="${FILE#$WORKSPACE/}"

git add "$REL_FILE" shared-memory-sync/_meta/staged-manifest.json

if git diff --cached --quiet; then
  echo "No staged changes after artifact write" >&2
  exit 1
fi

SHORT_TITLE="$(printf '%s' "$TITLE" | cut -c1-60)"
git commit -m "$COMMIT_PREFIX: $SHORT_TITLE"
git push origin HEAD

echo "$FILE"
