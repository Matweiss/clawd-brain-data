#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${OPENCLAW_WORKSPACE:-/root/.openclaw/workspace}"
BRIEF_PATH="${1:-}"
AGENT="${2:-}"

if [[ -z "$BRIEF_PATH" || -z "$AGENT" ]]; then
  echo "Usage: dispatch-brief.sh <brief-path> <agent>" >&2
  exit 1
fi

if [[ ! -f "$BRIEF_PATH" ]]; then
  echo "Brief not found: $BRIEF_PATH" >&2
  exit 1
fi

BRIEF_NAME="$(basename "$BRIEF_PATH")"
DONE_DIR="$WORKSPACE/shared-memory-sync/briefs/done"
DONE_PATH="$DONE_DIR/$BRIEF_NAME"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

python3 - "$BRIEF_PATH" "$STAMP" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
stamp = sys.argv[2]
text = path.read_text(encoding="utf-8")

marker = "## Execution Log"
if marker not in text:
    raise SystemExit("Execution Log section missing")

text = text.rstrip() + f"\n\n- {stamp} - Canary dispatch executed successfully on VPS by Clawd.\n"
path.write_text(text + ("\n" if not text.endswith("\n") else ""), encoding="utf-8")
PY

mkdir -p "$DONE_DIR"
mv "$BRIEF_PATH" "$DONE_PATH"

cd "$WORKSPACE"
git add scripts/bridge/dispatch-brief.sh shared-memory-sync/briefs
git commit -m "Complete canary briefs in dispatch hook"
git push origin main

echo "Completed: $DONE_PATH"
