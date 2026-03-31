#!/bin/bash
set -euo pipefail

# Daily Morning Dashboard - Runs at 8am PST
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/dashboard-cron.log"
OPENCLAW_BIN="$(which openclaw 2>/dev/null || echo '/usr/bin/openclaw')"

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" >> "$LOG_FILE"
}

log "Dashboard run starting"

# Generate dashboard — capture separately so errors don't reach Sarah
DASHBOARD_OUTPUT=""
DASHBOARD_EXIT=0
DASHBOARD_OUTPUT=$(cd "$SCRIPT_DIR" && node daily-dashboard.mjs 2>>"$LOG_FILE") || DASHBOARD_EXIT=$?

if [ $DASHBOARD_EXIT -ne 0 ]; then
  log "ERROR: dashboard generation failed with exit code $DASHBOARD_EXIT"
  exit $DASHBOARD_EXIT
fi

if [ -z "$DASHBOARD_OUTPUT" ]; then
  log "ERROR: dashboard output was empty"
  exit 1
fi

# Send to Sarah via Telegram
if "$OPENCLAW_BIN" message send --channel telegram --account sarah --target 8638454950 --message "$DASHBOARD_OUTPUT"; then
  log "SUCCESS: dashboard sent to Sarah"
else
  log "ERROR: failed to send dashboard to Sarah"
  exit 1
fi
