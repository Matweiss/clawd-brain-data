#!/usr/bin/env bash
set -euo pipefail

BRIEF_PATH="${1:-}"
AGENT="${2:-}"

if [[ -z "$BRIEF_PATH" || -z "$AGENT" ]]; then
  echo "Usage: dispatch-brief.sh <brief-path> <agent>" >&2
  exit 1
fi

echo "Dispatch stub: $AGENT <- $BRIEF_PATH"
echo "TODO: wire this into the real OpenClaw/Paperclip execution path"
