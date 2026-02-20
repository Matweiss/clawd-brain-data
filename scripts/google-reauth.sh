#!/bin/bash
# Google OAuth Re-Authorization with Full Workspace Scopes
# Generates authorization URL for Mat to approve

CLIENT_ID="391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com"
REDIRECT_URI="http://localhost"

# Define scopes
SCOPES=(
  "https://www.googleapis.com/auth/calendar"
  "https://www.googleapis.com/auth/calendar.events"
  "https://www.googleapis.com/auth/gmail.modify"
  "https://www.googleapis.com/auth/gmail.readonly"
  "https://www.googleapis.com/auth/gmail.compose"
  "https://www.googleapis.com/auth/spreadsheets"
  "https://www.googleapis.com/auth/documents"
  "https://www.googleapis.com/auth/presentations"
  "https://www.googleapis.com/auth/drive.file"
  "https://www.googleapis.com/auth/forms"
  "https://www.googleapis.com/auth/keep"
)

# Join scopes with space-encoding
SCOPE_STRING=$(IFS=%20; echo "${SCOPES[*]}")

# Generate authorization URL
AUTH_URL="https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE_STRING}&response_type=code&access_type=offline&prompt=consent"

echo ""
echo "============================================"
echo "Google Workspace Re-Authorization"
echo "============================================"
echo ""
echo "1. Open this URL in your browser:"
echo ""
echo "$AUTH_URL"
echo ""
echo "2. Approve all permissions"
echo "3. Copy the 'code' parameter from the redirect URL"
echo "4. Paste it back here"
echo ""
echo "============================================"
echo ""
read -p "Enter the authorization code: " AUTH_CODE

# Exchange code for tokens
echo ""
echo "Exchanging code for tokens..."

RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=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" \
  -d "code=${AUTH_CODE}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code")

# Extract tokens
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Error: Failed to get tokens"
    echo "$RESPONSE" | jq
    exit 1
fi

# Update token file
cat > /data/.openclaw/google-token.json <<EOF
{
  "access_token": "$ACCESS_TOKEN",
  "refresh_token": "$REFRESH_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3599,
  "client_id": "${CLIENT_ID}",
  "client_secret": "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"
}
EOF

echo ""
echo "✅ Tokens saved to /data/.openclaw/google-token.json"
echo ""
echo "Testing access..."
echo ""

# Test Calendar
echo -n "Calendar: "
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://www.googleapis.com/calendar/v3/users/me/calendarList" | jq -r '.items[0].summary' 2>/dev/null && echo "✅" || echo "❌"

# Test Gmail
echo -n "Gmail: "
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://gmail.googleapis.com/gmail/v1/users/me/profile" | jq -r '.emailAddress' 2>/dev/null && echo "✅" || echo "❌"

# Test Sheets
echo -n "Sheets: "
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets" | jq -r '.error.message // "✅ Access confirmed"'

echo ""
echo "✅ Re-authorization complete!"
echo ""
