#!/usr/bin/env bash
# granola-health-check.sh — Check Granola cache health and print JSON status.
# Exit 0: healthy or stale (cache exists). Exit 1: missing or degraded.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

python3 "$SCRIPT_DIR/granola-query.py" health
STATUS=$(python3 "$SCRIPT_DIR/granola-query.py" health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "error")

case "$STATUS" in
  healthy|stale) exit 0 ;;
  *) exit 1 ;;
esac
