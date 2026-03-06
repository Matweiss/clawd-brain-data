#!/bin/bash
# Setup cron job for daily brain data sync
# Run this once to schedule the sync

CRON_ENTRY="0 23 * * * /bin/bash /root/.openclaw/workspace/clawd-brain-data/scripts/daily-sync.sh >> /var/log/clawd-brain-sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "daily-sync.sh"; then
    echo "Cron job already exists"
    exit 0
fi

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "Cron job installed: Daily sync at 11:00 PM PT"
echo "Log file: /var/log/clawd-brain-sync.log"

# Create log file if it doesn't exist
touch /var/log/clawd-brain-sync.log 2>/dev/null || echo "Note: May need sudo for log file"
