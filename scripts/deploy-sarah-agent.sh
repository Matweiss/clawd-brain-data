#!/bin/bash
# Sarah's Art Assistant - Deployment Script
# Run this after setting up environment variables

set -e

echo "🎨 Deploying Sarah's Art Assistant..."
echo ""

# Check required env vars
check_env() {
    local var=$1
    if [ -z "${!var}" ] || [ "${!var}" = "..." ]; then
        echo "⚠️  Missing or incomplete: $var"
        return 1
    fi
    echo "✅ $var is set"
    return 0
}

MISSING=0

echo "Checking environment variables..."
check_env SARAH_SHOPIFY_STORE || MISSING=1
check_env SARAH_SHOPIFY_ACCESS_TOKEN || MISSING=1
check_env SARAH_GITHUB_TOKEN || MISSING=1
check_env SARAH_TELEGRAM_BOT_TOKEN || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo "❌ Please add missing variables to ~/.openclaw/.env"
    echo "Then run: source ~/.openclaw/.env && bash deploy-sarah-agent.sh"
    exit 1
fi

echo ""
echo "Testing connections..."

# Test Shopify
echo "🛒 Testing Shopify connection..."
SHOPIFY_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://${SARAH_SHOPIFY_STORE}/admin/api/2024-01/shop.json" \
    -H "X-Shopify-Access-Token: ${SARAH_SHOPIFY_ACCESS_TOKEN}")

if [ "$SHOPIFY_TEST" = "200" ]; then
    echo "✅ Shopify connected"
else
    echo "❌ Shopify connection failed (HTTP $SHOPIFY_TEST)"
    exit 1
fi

# Test GitHub
echo "📁 Testing GitHub connection..."
GITHUB_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${SARAH_GITHUB_TOKEN}" \
    "https://api.github.com/repos/${SARAH_GITHUB_REPO}")

if [ "$GITHUB_TEST" = "200" ]; then
    echo "✅ GitHub connected"
else
    echo "❌ GitHub connection failed (HTTP $GITHUB_TEST)"
    exit 1
fi

# Test Telegram
echo "💬 Testing Telegram bot..."
TELEGRAM_TEST=$(curl -s -X POST \
    "https://api.telegram.org/bot${SARAH_TELEGRAM_BOT_TOKEN}/getMe" \
    | grep -o '"ok":true' || echo "")

if [ -n "$TELEGRAM_TEST" ]; then
    BOT_NAME=$(curl -s -X POST \
        "https://api.telegram.org/bot${SARAH_TELEGRAM_BOT_TOKEN}/getMe" \
        | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Telegram bot connected: @$BOT_NAME"
else
    echo "❌ Telegram bot connection failed"
    exit 1
fi

echo ""
echo "🚀 All connections verified!"
echo ""
echo "Next steps:"
echo "1. Sarah can start messaging @$BOT_NAME"
echo "2. Check logs: tail -f /root/.openclaw/logs/sarah-agent.log"
echo "3. Monitor sessions: openclaw sessions list"
echo ""
echo "🎨 Sarah's Art Assistant is ready!"
