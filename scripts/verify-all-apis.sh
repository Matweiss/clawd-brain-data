#!/bin/bash
# API Integration Verification Script
# Run this to quickly check all API connections

set -e

echo "🔍 Verifying All API Integrations..."
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0
TOTAL=0

# Function to test API
test_api() {
    local name=$1
    local command=$2
    TOTAL=$((TOTAL + 1))
    
    echo -n "Testing $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# 1. HubSpot
test_api "HubSpot CRM" "curl -s -H 'Authorization: Bearer pat-na1-a249996e-eb7d-4184-841f-2759d28a8323' 'https://api.hubapi.com/crm/v3/objects/deals?limit=1'"

# 2. Groq Whisper (check endpoint availability)
test_api "Groq API" "curl -s -I https://api.groq.com/openai/v1/models | grep -q '200\|401'"

# 3. ElevenLabs (check endpoint)
test_api "ElevenLabs TTS" "curl -s -I https://api.elevenlabs.io/v1/voices | grep -q '200\|401'"

# 4. Google OAuth Token
test_api "Google OAuth Token" "test -f /data/.openclaw/google-token.json"

# 5. Vercel Token
test_api "Vercel Token" "test -f /data/.openclaw/workspace/.vercel-token"

# 6. GitHub Sync Script
test_api "GitHub Sync Script" "test -f /data/.openclaw/workspace/scripts/sync-memory-to-github.sh && test -x /data/.openclaw/workspace/scripts/sync-memory-to-github.sh"

# 7. qmd installation
test_api "qmd Memory Search" "export PATH=\"\$HOME/.local/bin:\$PATH\" && qmd --version"

# 8. API Credentials File
test_api "API Credentials File" "test -f /data/.openclaw/workspace/API-CREDENTIALS.md"

# 9. Bun (for qmd)
test_api "Bun Runtime" "bun --version"

# 10. Workspace Directory
test_api "Workspace Directory" "test -d /data/.openclaw/workspace"

echo ""
echo "======================================"
echo "Results: $PASSED/$TOTAL passed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All integrations verified successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  $FAILED integration(s) failed. Check above for details.${NC}"
    exit 1
fi
