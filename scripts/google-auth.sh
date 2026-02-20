#!/bin/bash
# Refreshes Google OAuth token and outputs a fresh access_token
TOKEN_FILE="/data/.openclaw/google-token.json"
CLIENT_ID=$(jq -r '.client_id' "$TOKEN_FILE")
CLIENT_SECRET=$(jq -r '.client_secret' "$TOKEN_FILE")
REFRESH_TOKEN=$(jq -r '.refresh_token' "$TOKEN_FILE")

RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "grant_type=refresh_token")

NEW_ACCESS=$(echo "$RESPONSE" | jq -r '.access_token')
if [ "$NEW_ACCESS" != "null" ] && [ -n "$NEW_ACCESS" ]; then
  jq --arg at "$NEW_ACCESS" '.access_token = $at' "$TOKEN_FILE" > /tmp/gtoken.tmp && mv /tmp/gtoken.tmp "$TOKEN_FILE"
  echo "$NEW_ACCESS"
else
  echo "ERROR: $RESPONSE" >&2
  exit 1
fi
