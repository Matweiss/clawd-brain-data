#!/bin/bash
# Deal Velocity Follow-Up Engine — Cron Runner
# Runs daily Mon-Fri at 8 AM PT (15:00 UTC)
# Checks for stale Lucra deals and alerts Mat via Telegram

LOG="/tmp/deal-velocity.log"
SCRIPT="/root/.openclaw/workspace/scripts/deal-velocity-followup.py"

echo "──────────────────────────────────────" >> "$LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deal velocity check starting..." >> "$LOG"

# Run the deal velocity script, capture output
OUTPUT=$(python3 "$SCRIPT" 2>> "$LOG")
EXIT_CODE=$?

echo "$OUTPUT" >> "$LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Exit code: $EXIT_CODE" >> "$LOG"

# Exit code 1 = stale deals found → send to Mat via Telegram
if [ "$EXIT_CODE" -eq 1 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stale deals found — sending Telegram alert..." >> "$LOG"
    
    # Send via openclaw CLI
    echo "$OUTPUT" | openclaw message send --channel telegram --user mat 2>> "$LOG"
    
    SEND_EXIT=$?
    if [ "$SEND_EXIT" -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Telegram alert sent successfully." >> "$LOG"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Telegram send failed (exit $SEND_EXIT)." >> "$LOG"
    fi
elif [ "$EXIT_CODE" -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ No stale deals. Pipeline healthy, no alert sent." >> "$LOG"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Script error (exit $EXIT_CODE). Check log." >> "$LOG"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done." >> "$LOG"
