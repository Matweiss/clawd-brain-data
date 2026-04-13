#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${OPENCLAW_WORKSPACE:-/root/.openclaw/workspace}"
SYNC_ROOT="${SYNC_ROOT:-$WORKSPACE/shared-memory-sync}"
FOLDER="${1:-}"
SOURCE="${2:-openclaw-vps}"
TITLE="${3:-}"
BODY="${4:-}"

if [[ -z "$FOLDER" || -z "$SOURCE" || -z "$TITLE" || -z "$BODY" ]]; then
  echo "Usage: write-sync-artifact-vps.sh <folder> <source> <title> <body>" >&2
  exit 1
fi

case "$FOLDER" in
  inbox|projects|decisions|system) ;;
  *)
    echo "Invalid folder: $FOLDER" >&2
    exit 1
    ;;
esac

slug() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

DATE="$(date +%F)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SLUG="$(slug "$TITLE")"
FILE="${SYNC_ROOT}/${FOLDER}/${DATE}-${SLUG}-${STAMP}.md"

mkdir -p "${SYNC_ROOT}/${FOLDER}" "${SYNC_ROOT}/_meta"

cat > "$FILE" <<ARTIFACT
---
type: ${FOLDER}
title: ${TITLE}
status: draft
created: ${DATE}
updated: ${DATE}
tags: [sync, staged, vps]
source: ${SOURCE}
visibility: shared
---

${BODY}
ARTIFACT

python3 - <<'PY' "$SYNC_ROOT" "$FILE"
import json, sys
from pathlib import Path
sync_root = Path(sys.argv[1])
file_path = Path(sys.argv[2])
manifest = sync_root / '_meta' / 'staged-manifest.json'
if manifest.exists():
    data = json.loads(manifest.read_text())
else:
    data = {'items': []}
data['items'].append({
    'path': str(file_path),
    'filename': file_path.name,
    'stagedAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
})
manifest.write_text(json.dumps(data, indent=2))
PY

echo "$FILE"
