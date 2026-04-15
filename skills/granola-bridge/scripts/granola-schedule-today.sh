#!/usr/bin/env bash
# granola-schedule-today.sh
#
# Run at 7am daily (and noon as catch-up for ad-hoc meetings).
# Reads today's calendar, creates one openclaw cron one-shot per meeting
# that fires 10 min after end time. Zero polling during the day.

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
ACCOUNT="mat.weiss@lucrasports.com"
SYNC_SCRIPT="$WORKSPACE/skills/granola-bridge/scripts/granola-post-meeting-sync.sh"
PRE_SCRIPT="$WORKSPACE/skills/granola-bridge/scripts/granola-pre-meeting-brief.sh"
SCHEDULE_LOG="$WORKSPACE/memory/granola-followups/.schedule-log.json"
DELAY_MINUTES=10
PRE_LEAD_MINUTES=15

log() { echo "[granola-scheduler] $*" >&2; }

mkdir -p "$WORKSPACE/memory/granola-followups"

TODAY_START=$(date -u +%Y-%m-%dT00:00:00Z)
TODAY_END=$(date -u +%Y-%m-%dT23:59:59Z)

log "Fetching calendar for $ACCOUNT ($(date +%Y-%m-%d))"

EVENTS_FILE=$(mktemp)
gog calendar events -a "$ACCOUNT" \
  --from "$TODAY_START" --to "$TODAY_END" \
  -j --results-only 2>/dev/null > "$EVENTS_FILE" || { log "gog calendar failed"; rm -f "$EVENTS_FILE"; exit 1; }

python3 "$WORKSPACE/skills/granola-bridge/scripts/_schedule-jobs.py" \
  --events-file "$EVENTS_FILE" \
  --schedule-log "$SCHEDULE_LOG" \
  --sync-script "$SYNC_SCRIPT" \
  --pre-script "$PRE_SCRIPT" \
  --delay-minutes "$DELAY_MINUTES" \
  --pre-lead-minutes "$PRE_LEAD_MINUTES"

rm -f "$EVENTS_FILE"
