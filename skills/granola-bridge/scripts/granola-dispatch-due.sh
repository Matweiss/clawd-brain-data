#!/usr/bin/env bash
# granola-dispatch-due.sh
#
# Runs every 5 min via crontab. Checks pending-syncs.json for meetings
# whose fire_epoch has passed, runs the sync, marks them done.
# Zero agent overhead — pure bash execution.

set -euo pipefail

FOLLOWUP_DIR="/root/.openclaw/workspace/memory/granola-followups"
PENDING_FILE="$FOLLOWUP_DIR/pending-syncs.json"
LOG="$FOLLOWUP_DIR/.dispatcher.log"

[[ ! -f "$PENDING_FILE" ]] && exit 0

NOW_EPOCH=$(date +%s)

python3 - <<PYEOF >> "$LOG" 2>&1
import json, os, subprocess
from pathlib import Path

pending_file = Path("$PENDING_FILE")
now_epoch = $NOW_EPOCH

try:
    jobs = json.loads(pending_file.read_text())
except Exception:
    jobs = []

remaining = []
for job in jobs:
    if job.get('status') != 'pending':
        continue
    fire_epoch = job.get('fire_epoch', 0)
    if fire_epoch <= now_epoch:
        cal_title = job.get('cal_title', '')
        event_id = job.get('event_id', '')
        sync_script = job.get('sync_script', '')
        print(f"[dispatcher] FIRE: {cal_title}")
        env = {**os.environ, 'CAL_TITLE': cal_title, 'EVENT_ID': event_id}
        subprocess.Popen(['bash', sync_script], env=env,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        job['status'] = 'fired'
    remaining.append(job)

# Keep only unfired jobs (fired ones fall off next schedule run)
still_pending = [j for j in remaining if j.get('status') == 'pending']
pending_file.write_text(json.dumps(still_pending, indent=2))
PYEOF
