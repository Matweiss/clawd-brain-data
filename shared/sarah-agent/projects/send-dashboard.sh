#!/bin/bash
# Daily Morning Dashboard - Runs at 8am PST

# Generate dashboard
DASHBOARD=$(cd /root/.openclaw/workspace/shared/sarah-agent/projects && node daily-dashboard.mjs 2>&1)

# Send to Telegram via OpenClaw message tool
# Using the telegram channel for Sarah (8638454950)
echo "$DASHBOARD" | /usr/local/bin/openclaw message send --channel telegram --target 8638454950 --text "$(cat -)"
