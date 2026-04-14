#!/usr/bin/env bash
# granola-sync-push.sh — Run THIS on the Mac to push Granola cache to VPS.
#
# Prerequisites (Mac-side):
#   - Tailscale running (VPS reachable at 100.91.33.9)
#   - SSH key auth to VPS: ssh mat@100.91.33.9 echo ok
#
# Usage:
#   bash ~/path/to/granola-sync-push.sh
#
# Add to Mac crontab for automatic syncing:
#   */30 * * * * bash ~/openclaw-workspace/skills/granola-bridge/scripts/granola-sync-push.sh >> ~/Library/Logs/granola-sync.log 2>&1

set -euo pipefail

GRANOLA_CACHE="$HOME/Library/Application Support/Granola/cache-v6.json"
VPS_HOST="100.91.33.9"
VPS_USER="${VPS_USER:-mat}"
VPS_DEST="$VPS_USER@$VPS_HOST:/root/.openclaw/workspace/skills/granola-bridge/data/granola-cache.json"
META_DEST="$VPS_USER@$VPS_HOST:/root/.openclaw/workspace/skills/granola-bridge/data/.cache-meta.json"

if [[ ! -f "$GRANOLA_CACHE" ]]; then
  echo "ERROR: Granola cache not found at $GRANOLA_CACHE" >&2
  echo "Is Granola installed and have you opened any meetings?" >&2
  exit 1
fi

CACHE_SIZE=$(wc -c < "$GRANOLA_CACHE" | tr -d ' ')
MEETING_COUNT=$(python3 -c "
import json, sys
try:
    data = json.load(open('$GRANOLA_CACHE'))
    if isinstance(data, list): print(len(data))
    elif isinstance(data, dict):
        for k in ('meetings','panels','documents','items','data'):
            if k in data and isinstance(data[k], list):
                print(len(data[k])); sys.exit(0)
        print(len([v for v in data.values() if isinstance(v, dict)]))
    else: print(0)
except Exception as e:
    print(0)
" 2>/dev/null || echo "0")

echo "Granola cache: $CACHE_SIZE bytes, ~$MEETING_COUNT meetings"
echo "Pushing to VPS ($VPS_HOST)..."

# Push the cache file
scp -q "$GRANOLA_CACHE" "$VPS_DEST"

# Write metadata
SYNCED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
META_JSON="{\"synced_at\":\"$SYNCED_AT\",\"meeting_count\":$MEETING_COUNT,\"cache_size_bytes\":$CACHE_SIZE,\"source_host\":\"$(hostname)\"}"
echo "$META_JSON" | ssh "$VPS_USER@$VPS_HOST" "cat > /root/.openclaw/workspace/skills/granola-bridge/data/.cache-meta.json"

echo "Done. Synced at $SYNCED_AT ($MEETING_COUNT meetings)"
