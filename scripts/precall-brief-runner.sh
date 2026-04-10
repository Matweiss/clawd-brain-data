#!/usr/bin/env bash
# Pre-Call Brief Runner — Luke (Lucra Sales Agent)
# Runs every 15 min on weekdays 7am-7pm PT (14:00-02:00 UTC next day)
# Cron: */15 14-23,0-2 * * 1-5

LOG="/tmp/precall-brief.log"
SCRIPT="/root/.openclaw/workspace/scripts/precall-brief-generator.py"

echo "──────────────────────────────────────" >> "$LOG"
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Pre-Call Brief Runner starting" >> "$LOG"

# Run the generator, capturing both stdout and stderr to log
python3 "$SCRIPT" >> "$LOG" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Runner completed OK (exit 0)" >> "$LOG"
else
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Runner exited with code $EXIT_CODE" >> "$LOG"
fi

# Trim log to last 500 lines to prevent unbounded growth
tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
