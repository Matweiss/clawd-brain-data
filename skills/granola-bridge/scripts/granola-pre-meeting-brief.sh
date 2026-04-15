#!/usr/bin/env bash
# granola-pre-meeting-brief.sh
#
# Called by granola-dispatch-due.sh before a meeting starts.
# No Mac sync needed — just reads existing cache + calendar event data.
#
# Env vars (set by dispatcher from pending-syncs.json):
#   CAL_TITLE    Calendar event title
#   EVENT_ID     Calendar event ID
#   START_TIME   ISO start time
#   END_TIME     ISO end time
#   ATTENDEES    JSON array of attendee emails/names

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/root/.openclaw/workspace"
FOLLOWUP_DIR="$WORKSPACE/memory/granola-followups"
QUERY="$SCRIPT_DIR/granola-query.py"
BRIEF_PY="$SCRIPT_DIR/_pre-meeting-brief.py"

CAL_TITLE="${CAL_TITLE:-}"
EVENT_ID="${EVENT_ID:-}"
START_TIME="${START_TIME:-}"
END_TIME="${END_TIME:-}"
ATTENDEES="${ATTENDEES:-[]}"

mkdir -p "$FOLLOWUP_DIR"

python3 "$BRIEF_PY" \
  --followup-dir "$FOLLOWUP_DIR" \
  --query-script "$QUERY" \
  --cal-title "$CAL_TITLE" \
  --event-id "$EVENT_ID" \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --attendees "$ATTENDEES"
