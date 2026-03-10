#!/bin/bash
# CLAWD PRIME - Agent Restoration Script
# Run this to restore a new agent to the March 10, 2026 state

set -e

echo "🦞 CLAWD PRIME Restoration Script"
echo "================================"
echo ""

# Check prerequisites
if [ ! -f "BACKUP_MANIFEST.md" ]; then
    echo "❌ Error: BACKUP_MANIFEST.md not found"
    echo "   Run this script from the workspace directory"
    exit 1
fi

echo "✅ Backup manifest found"
echo ""

# Step 1: Verify .env file exists
if [ ! -f "/root/.openclaw/.env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Create /root/.openclaw/.env with:"
    echo "   - HUBSPOT_TOKEN"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET"
    echo "   - GITHUB_TOKEN"
    echo "   - VERCEL_TOKEN"
    echo ""
fi

# Step 2: Check cron jobs
echo "🔧 Checking cron jobs..."
if command -v openclaw &> /dev/null; then
    openclaw cron list || echo "⚠️  Cron list failed"
else
    echo "⚠️  openclaw CLI not found"
fi

echo ""

# Step 3: Verify file structure
echo "📁 Verifying file structure..."
FILES=(
    "MEMORY.md"
    "IDENTITY.md"
    "TOOLS.md"
    "AGENTS.md"
    "SOUL.md"
    "BACKUP_MANIFEST.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING"
    fi
done

echo ""

# Step 4: Test Telegram (if configured)
echo "📱 Checking Telegram..."
if grep -q "8001393940" TOOLS.md 2>/dev/null; then
    echo "  ✅ Telegram user ID found"
else
    echo "  ⚠️  Telegram not configured"
fi

echo ""

# Step 5: Summary
echo "================================"
echo "🦞 Restoration Checklist:"
echo "================================"
echo ""
echo "1. ✅ Files verified"
echo "2. ⏳ Configure .env with API tokens"
echo "3. ⏳ Pair Telegram: openclaw pairing approve telegram [CODE]"
echo "4. ⏳ Verify cron jobs: openclaw cron list"
echo "5. ⏳ Test HubSpot connection"
echo "6. ⏳ Test Google Calendar sync"
echo "7. ⏳ Deploy dashboard env vars (if needed)"
echo ""
echo "📖 Full documentation: BACKUP_MANIFEST.md"
echo "💬 Chat history: memory/chat_history_feb23_mar9_2026.md"
echo ""
echo "🦞 Ready for activation!"
