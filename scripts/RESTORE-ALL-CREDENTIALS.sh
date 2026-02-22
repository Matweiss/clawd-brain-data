#!/bin/bash
# 🔐 RESTORE-ALL-CREDENTIALS.sh
# Restore all API credentials to new Clawd instance
# Run this AFTER extracting the backup
#
# Usage: bash /data/.openclaw/workspace/scripts/RESTORE-ALL-CREDENTIALS.sh
#
# This script will prompt for each credential and install it in the gateway config

set -e

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  🔐 Clawd Credential Restoration                  ║"
echo "║  This will restore all API keys to your new Clawd ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Follow the prompts below. Leave blank to skip (NOT recommended)."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

WORKSPACE="/data/.openclaw/workspace"
CREDS_FILE="${WORKSPACE}/.restore-credentials.txt"
FAILED=0

# Helper function to save credentials
save_credential() {
  local name=$1
  local value=$2
  echo "${name}=${value}" >> "$CREDS_FILE"
}

# Overwrite credentials file
> "$CREDS_FILE"

# 1️⃣ GitHub Token
echo "1️⃣ GITHUB TOKEN (for workspace sync)"
echo "   How to generate: https://github.com/settings/tokens?type=beta"
echo "   Repo: Matweiss/clawd-brain-data"
echo "   Scopes needed:"
echo "     • Contents (read & write)"
echo "     • Metadata (read-only)"
echo ""
read -p "Enter GitHub token (or press Enter to skip): " GITHUB_TOKEN
echo ""

if [ -n "$GITHUB_TOKEN" ]; then
  echo "   ⏳ Installing GitHub token..."
  if openclaw gateway secrets add GITHUB_TOKEN "$GITHUB_TOKEN" 2>/dev/null; then
    echo "   ✅ GitHub token installed"
    save_credential "GITHUB_TOKEN" "$GITHUB_TOKEN"
    
    # Update git remote
    cd "$WORKSPACE"
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git"
    
    if git fetch origin master 2>/dev/null; then
      echo "   ✅ Git remote connected and verified"
    else
      echo "   ⚠️  Git fetch failed — token may be invalid"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "   ❌ Failed to install GitHub token"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ⏭️  Skipped GitHub token"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 2️⃣ HubSpot API Key
echo "2️⃣ HUBSPOT API KEY (CRM & pipeline)"
echo "   How to generate: https://app.hubspot.com/l/settings/integrations/private-apps"
echo "   Owner ID: 728033696"
echo ""
read -p "Enter HubSpot API key (or press Enter to skip): " HUBSPOT_API_KEY
echo ""

if [ -n "$HUBSPOT_API_KEY" ]; then
  echo "   ⏳ Installing HubSpot API key..."
  if openclaw gateway secrets add HUBSPOT_API_KEY "$HUBSPOT_API_KEY" 2>/dev/null; then
    echo "   ✅ HubSpot API key installed"
    save_credential "HUBSPOT_API_KEY" "$HUBSPOT_API_KEY"
  else
    echo "   ❌ Failed to install HubSpot API key"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ⏭️  Skipped HubSpot API key"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3️⃣ Avoma API Key
echo "3️⃣ AVOMA API KEY (meeting notes & call recording)"
echo "   How to generate: https://app.avoma.com/settings/api-keys"
echo ""
read -p "Enter Avoma API key (or press Enter to skip): " AVOMA_API_KEY
echo ""

if [ -n "$AVOMA_API_KEY" ]; then
  echo "   ⏳ Installing Avoma API key..."
  if openclaw gateway secrets add AVOMA_API_KEY "$AVOMA_API_KEY" 2>/dev/null; then
    echo "   ✅ Avoma API key installed"
    save_credential "AVOMA_API_KEY" "$AVOMA_API_KEY"
  else
    echo "   ❌ Failed to install Avoma API key"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ⏭️  Skipped Avoma API key"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4️⃣ Groq Whisper API Key
echo "4️⃣ GROQ WHISPER API KEY (voice transcription)"
echo "   How to generate: https://console.groq.com/keys"
echo "   Free tier available (may have rate limits)"
echo ""
read -p "Enter Groq API key (or press Enter to skip): " GROQ_API_KEY
echo ""

if [ -n "$GROQ_API_KEY" ]; then
  echo "   ⏳ Installing Groq API key..."
  if openclaw gateway secrets add GROQ_API_KEY "$GROQ_API_KEY" 2>/dev/null; then
    echo "   ✅ Groq API key installed"
    save_credential "GROQ_API_KEY" "$GROQ_API_KEY"
  else
    echo "   ❌ Failed to install Groq API key"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ⏭️  Skipped Groq API key"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 5️⃣ ElevenLabs API Key
echo "5️⃣ ELEVENLABS API KEY (voice synthesis)"
echo "   How to generate: https://elevenlabs.io/app/subscription"
echo "   Voice: Charlie (ID: IKne3meq5aSn9XLyUdCD)"
echo ""
read -p "Enter ElevenLabs API key (or press Enter to skip): " ELEVENLABS_API_KEY
echo ""

if [ -n "$ELEVENLABS_API_KEY" ]; then
  echo "   ⏳ Installing ElevenLabs API key..."
  if openclaw gateway secrets add ELEVENLABS_API_KEY "$ELEVENLABS_API_KEY" 2>/dev/null; then
    echo "   ✅ ElevenLabs API key installed"
    save_credential "ELEVENLABS_API_KEY" "$ELEVENLABS_API_KEY"
  else
    echo "   ❌ Failed to install ElevenLabs API key"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ⏭️  Skipped ElevenLabs API key"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 6️⃣ Kimi API Key
echo "6️⃣ KIMI API KEY (primary LLM)"
echo "   How to generate: https://platform.moonshot.cn/console/api-keys"
echo "   This is your main model for all responses"
echo ""
read -p "Enter Kimi API key (or press Enter to skip): " KIMI_API_KEY
echo ""

if [ -n "$KIMI_API_KEY" ]; then
  echo "   ⏳ Installing Kimi API key..."
  if openclaw gateway secrets add KIMI_API_KEY "$KIMI_API_KEY" 2>/dev/null; then
    echo "   ✅ Kimi API key installed"
    save_credential "KIMI_API_KEY" "$KIMI_API_KEY"
  else
    echo "   ❌ Failed to install Kimi API key"
    FAILED=$((FAILED + 1))
  fi
else
  echo "   ⏭️  Skipped Kimi API key"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final steps
echo "✅ CREDENTIAL INSTALLATION COMPLETE"
echo ""
echo "📋 CREDENTIALS SAVED TO: $CREDS_FILE"
echo "   (For your reference — keep this safe)"
echo ""
echo "🔄 NEXT STEPS:"
echo ""
echo "1️⃣ UPDATE VERCEL (these 3 variables):"
echo "   Go to: https://vercel.com/clawd-command/settings/environment-variables"
echo ""
echo "   Update:"
echo "   • GITHUB_TOKEN = $GITHUB_TOKEN"
echo "   • HUBSPOT_API_KEY = $HUBSPOT_API_KEY"
echo "   • KIMI_API_KEY = $KIMI_API_KEY"
echo ""
echo "   Then redeploy: vercel deploy --prod"
echo ""
echo "2️⃣ RESTART GATEWAY:"
echo "   openclaw gateway restart"
echo ""
echo "3️⃣ VERIFY EVERYTHING:"
echo "   openclaw status"
echo "   cd /data/.openclaw/workspace && git fetch origin"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 ALL CREDENTIALS RESTORED SUCCESSFULLY!"
  echo ""
  echo "Your Clawd is ready to work!"
  exit 0
else
  echo "⚠️  $FAILED credential(s) failed to install"
  echo ""
  echo "Check the errors above and try again if needed."
  exit 1
fi
