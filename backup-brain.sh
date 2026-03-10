#!/bin/bash
# CLAWD Brain Backup Script
# Usage: ./backup-brain.sh [commit_message]

set -e

cd /root/.openclaw/workspace

echo "🧠 Backing up CLAWD Brain Data..."

# Add all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to backup"
    exit 0
fi

# Commit with timestamp or provided message
COMMIT_MSG="${1:-Brain backup: $(date '+%Y-%m-%d %H:%M')}"
git commit -m "$COMMIT_MSG"

# Push to GitHub
git push origin main

echo "✅ Backup complete!"
echo "📊 Last 3 commits:"
git log --oneline -3
