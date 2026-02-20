#!/bin/bash
# Daily sync of workspace memory to GitHub
# Runs at 2 AM Pacific (scheduled via OpenClaw cron)

set -e

WORKSPACE="/data/.openclaw/workspace"
cd "$WORKSPACE"

# Add all changes
git add memory/*.md MEMORY.md USER.md AGENTS.md SOUL.md TOOLS.md HEARTBEAT.md 2>/dev/null || true

# Check if there are changes
if git diff --staged --quiet; then
  echo "No changes to sync"
  exit 0
fi

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
git commit -m "Daily memory sync: $TIMESTAMP"

# Push to remote
git push origin master

echo "✅ Synced to GitHub at $TIMESTAMP"
