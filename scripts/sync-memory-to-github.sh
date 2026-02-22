#!/bin/bash
# Daily sync of workspace to GitHub (complete backup)
# Runs at 2 AM Pacific (scheduled via OpenClaw cron)

set -e

WORKSPACE="/data/.openclaw/workspace"
cd "$WORKSPACE"

# Add all workspace files EXCEPT node_modules, .git, and build artifacts
# This creates a complete backup that can be restored to a new Clawd instance
git add \
  memory/*.md \
  projects/ \
  configs/ \
  scripts/ \
  MEMORY.md \
  USER.md \
  AGENTS.md \
  SOUL.md \
  TOOLS.md \
  HEARTBEAT.md \
  BOOTSTRAP.md \
  IDENTITY.md \
  *.md \
  2>/dev/null || true

# Check if there are changes
if git diff --staged --quiet; then
  echo "No changes to sync"
  exit 0
fi

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
git commit -m "🔄 Workspace backup sync: $TIMESTAMP"

# Push to remote
git push origin master

echo "✅ Complete backup synced to GitHub at $TIMESTAMP"
