#!/bin/bash
# Daily Brain Data Sync Script
# Commits memories, handoffs, and docs to git
# Runs via cron at 11:00 PM PT

set -e

REPO_DIR="/root/.openclaw/workspace/clawd-brain-data"
cd "$REPO_DIR"

# Git config (ensure commits are attributed)
git config user.email "clawd@mission-control.ai" || true
git config user.name "CLAWD Sync" || true

# Check if there are changes to commit
if git diff --quiet && git diff --staged --quiet; then
    echo "[$(date)] No changes to commit"
    exit 0
fi

# Count what changed
MEMORIES_COUNT=$(git status --short memories/ 2>/dev/null | wc -l)
HANDOFFS_COUNT=$(git status --short handoffs/ 2>/dev/null | wc -l)
DOCS_COUNT=$(git status --short docs/ 2>/dev/null | wc -l)
DAILY_COUNT=$(git status --short daily/ 2>/dev/null | wc -l)

# Build commit message
COMMIT_MSG="[sync] $(date +%Y-%m-%d)"
DETAILS=""

if [ "$MEMORIES_COUNT" -gt 0 ]; then
    DETAILS="$DETAILS, ${MEMORIES_COUNT} memories"
fi
if [ "$HANDOFFS_COUNT" -gt 0 ]; then
    DETAILS="$DETAILS, ${HANDOFFS_COUNT} handoffs"
fi
if [ "$DOCS_COUNT" -gt 0 ]; then
    DETAILS="$DETAILS, ${DOCS_COUNT} docs"
fi
if [ "$DAILY_COUNT" -gt 0 ]; then
    DETAILS="$DETAILS, ${DAILY_COUNT} daily"
fi

# Remove leading comma and space
DETAILS=$(echo "$DETAILS" | sed 's/^, //')

if [ -n "$DETAILS" ]; then
    COMMIT_MSG="$COMMIT_MSG: $DETAILS"
fi

# Add all changes
git add -A

# Commit with message
git commit -m "$COMMIT_MSG" || true

# Push to origin
git push origin main || echo "Push failed - may need manual intervention"

echo "[$(date)] Sync complete: $COMMIT_MSG"
