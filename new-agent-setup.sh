#!/bin/bash
# New Agent Quick Setup Script
# Run this after getting credentials from Mat

set -e

echo "🦞 CLAWD PRIME - New Agent Setup"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (sudo)${NC}"
  exit 1
fi

# Step 1: Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo -e "${RED}Git not found. Installing...${NC}"
    apt-get update && apt-get install -y git
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq not found. Installing...${NC}"
    apt-get install -y jq
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Get GitHub Token
echo "🔑 GitHub Configuration"
echo "-----------------------"
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}Enter your GitHub Personal Access Token:${NC}"
    echo "   (Mat should have given you this - starts with ghp_)"
    read -s GITHUB_TOKEN
    echo ""
fi

# Test GitHub access
echo "Testing GitHub access..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  https://api.github.com/repos/Matweiss/clawd-brain-data)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ GitHub access verified${NC}"
else
    echo -e "${RED}❌ GitHub access failed (HTTP $HTTP_STATUS)${NC}"
    echo "   Check your token has 'repo' scope"
    exit 1
fi

# Step 3: Clone repositories
echo ""
echo "📁 Cloning repositories..."
echo "--------------------------"

mkdir -p /root/.openclaw
cd /root/.openclaw

# Clone brain-data repo
echo "Cloning clawd-brain-data..."
git clone "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git" brain-data

# Clone dashboard repo
echo "Cloning clawd-dashboard..."
git clone "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-dashboard.git" dashboard

# Clone command-center repo
echo "Cloning clawd-command-center..."
git clone "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-command-center.git" command-center 2>/dev/null || echo "   (optional repo not found)"

echo -e "${GREEN}✅ Repositories cloned${NC}"

# Step 4: Setup workspace
echo ""
echo "🗂️  Setting up workspace..."
echo "---------------------------"

# Create workspace directory
mkdir -p workspace
cp -r brain-data/* workspace/ 2>/dev/null || true

echo -e "${GREEN}✅ Workspace ready${NC}"

# Step 5: Configure environment
echo ""
echo "⚙️  Environment Configuration"
echo "-----------------------------"

ENV_FILE="/root/.openclaw/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}.env file exists. Updating...${NC}"
else
    echo "Creating .env file..."
fi

# Write GitHub token
cat > "$ENV_FILE" << EOF
# GitHub (from handoff)
GITHUB_TOKEN="${GITHUB_TOKEN}"
GITHUB_USER="Matweiss"
GITHUB_EMAIL="mat@craftable.com"

# Google OAuth (already configured via .gog-credentials.json)
# Tokens auto-refresh - should work immediately

# Telegram
TELEGRAM_USER_ID="8001393940"

# Add other tokens as you get them:
# VERCEL_TOKEN=""
# HASS_URL="http://homeassistant.local:8123"
# HASS_TOKEN=""
# ELEVENLABS_API_KEY=""
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo "   Location: $ENV_FILE"

# Step 6: Verify Google credentials exist
echo ""
echo "🔍 Checking Google OAuth..."
echo "---------------------------"

if [ -f "/root/.openclaw/.gog-credentials.json" ]; then
    echo -e "${GREEN}✅ Google credentials found${NC}"
    echo "   Refresh token active - auto-refresh enabled"
else
    echo -e "${YELLOW}⚠️  Google credentials not found${NC}"
    echo "   Mat needs to run: openclaw google-auth login"
fi

# Step 7: Summary
echo ""
echo "================================="
echo "🦞 SETUP COMPLETE!"
echo "================================="
echo ""
echo "Next steps:"
echo ""
echo "1. 📖 READ THE HANDOFF:"
echo "   less /root/.openclaw/workspace/AGENT_HANDOFF.md"
echo ""
echo "2. 📖 READ CHAT HISTORY:"
echo "   less /root/.openclaw/workspace/memory/chat_history_feb23_mar9_2026.md"
echo ""
echo "3. 🔑 GET REMAINING TOKENS:"
echo "   - Vercel token (for deployments)"
echo "   - Home Assistant token (for location tracking)"
echo "   - ElevenLabs API key (for voice)"
echo ""
echo "4. 🤖 PAIR TELEGRAM:"
echo "   - Mat runs: openclaw pairing approve telegram [CODE]"
echo "   - You send /start to the bot"
echo ""
echo "5. ✅ VERIFY SETUP:"
echo "   cd /root/.openclaw/workspace"
echo "   ./restore-agent.sh"
echo ""
echo "🦞 You're on your way, new agent!"
echo ""
