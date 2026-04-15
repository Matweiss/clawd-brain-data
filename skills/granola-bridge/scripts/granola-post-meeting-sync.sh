#!/usr/bin/env bash
# granola-post-meeting-sync.sh
#
# Called by granola-dispatch-due.sh after a meeting ends.
# 1. Syncs Granola cache from Mac via SSH.
# 2. Calls _post-meeting-brief.py to match and write the brief.
#
# Env vars:
#   CAL_TITLE   (optional) Calendar event title to match
#   EVENT_ID    (optional) Calendar event ID for idempotency
#   LOOKBACK_H  (optional) Hours to look back for Granola meetings (default: 3)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/root/.openclaw/workspace"
FOLLOWUP_DIR="$WORKSPACE/memory/granola-followups"
QUERY="$SCRIPT_DIR/granola-query.py"
BRIEF_PY="$SCRIPT_DIR/_post-meeting-brief.py"
MAC_HOST="mat@100.94.231.120"
SSH_KEY="$HOME/.ssh/mac-bridge"
CACHE_DEST="$WORKSPACE/skills/granola-bridge/data/granola-cache.json"
META_DEST="$WORKSPACE/skills/granola-bridge/data/.cache-meta.json"
GRANOLA_CACHE_SRC="/Users/mat/Library/Application Support/Granola/cache-v6.json"
CAL_TITLE="${CAL_TITLE:-}"
EVENT_ID="${EVENT_ID:-}"
END_TIME="${END_TIME:-}"
LOOKBACK_H="${LOOKBACK_H:-3}"

mkdir -p "$FOLLOWUP_DIR"
log() { echo "[granola-sync] $*" >&2; }

# Step 1: Sync Granola cache from Mac
log "Syncing Granola cache from Mac..."
if ssh -o ConnectTimeout=8 -o StrictHostKeyChecking=no -o IdentitiesOnly=yes \
    -i "$SSH_KEY" "$MAC_HOST" "test -f '$GRANOLA_CACHE_SRC'" 2>/dev/null; then
  scp -q -o StrictHostKeyChecking=no -o IdentitiesOnly=yes -i "$SSH_KEY" \
    "${MAC_HOST}:${GRANOLA_CACHE_SRC}" "$CACHE_DEST"
  MEETING_COUNT=$(python3 -c "
import json
data = json.load(open('$CACHE_DEST'))
print(len(data.get('cache',{}).get('state',{}).get('documents',{})))
" 2>/dev/null || echo "?")
  SYNCED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{"synced_at":"%s","meeting_count":%s,"source_host":"macbook-pro-10"}\n' \
    "$SYNCED_AT" "$MEETING_COUNT" > "$META_DEST"
  log "Cache synced: $MEETING_COUNT meetings"
else
  log "WARNING: Mac unreachable. Using cached data."
  if [[ ! -f "$CACHE_DEST" ]]; then
    log "ERROR: No cached data available. Exiting."
    exit 1
  fi
fi

# Step 2: Write post-meeting brief
python3 "$BRIEF_PY" \
  --followup-dir "$FOLLOWUP_DIR" \
  --query-script "$QUERY" \
  --cal-title "$CAL_TITLE" \
  --event-id "$EVENT_ID" \
  --end-time "$END_TIME" \
  --lookback-hours "$LOOKBACK_H"
