#!/bin/bash
# Google OAuth Token Refresher
# Refreshes the access token using the stored refresh token

set -euo pipefail

CLIENT_ID="391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com"
CLIENT_SECRET="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"
REFRESH_TOKEN="1//058W-PH7CIRTaCgYIARAAGAUSNwF-L9Ir16ZDRL2fXvDuIOcpr7FbSuCLKK-i1sJYVIsvvARXaODT6AZ_W1jid1Dv_mnE4ipcxGA"

# Refresh the token
RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "refresh_token=${REFRESH_TOKEN}" \
  -d "grant_type=refresh_token")

# Extract new access token
NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')

if [ "$NEW_ACCESS_TOKEN" == "null" ] || [ -z "$NEW_ACCESS_TOKEN" ]; then
    echo "Error: Failed to refresh token" >&2
    echo "$RESPONSE" >&2
    exit 1
fi

# Update the token file
jq --arg token "$NEW_ACCESS_TOKEN" \
   '.access_token = $token' \
   /data/.openclaw/google-token.json > /tmp/google-token-new.json

mv /tmp/google-token-new.json /data/.openclaw/google-token.json

# Output the new token
echo "$NEW_ACCESS_TOKEN"
