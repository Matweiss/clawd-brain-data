#!/usr/bin/env python3
"""
_schedule-jobs.py — called by granola-schedule-today.sh
Reads today's calendar, writes a pending-syncs.json with fire times.
A separate 5-min dispatcher (granola-dispatch-due.sh) reads the file and runs syncs when due.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path


def log(msg):
    print(f"[granola-scheduler] {msg}", file=sys.stderr)


def normalize(s):
    return re.sub(r'[^a-z0-9 ]', '', (s or '').lower()).strip()


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--events-file', required=True)
    p.add_argument('--schedule-log', required=True)
    p.add_argument('--sync-script', required=True)
    p.add_argument('--delay-minutes', type=int, default=10)
    args = p.parse_args()

    events = json.loads(Path(args.events_file).read_text())
    if not isinstance(events, list):
        log("No events list returned from calendar.")
        sys.exit(0)

    log(f"Found {len(events)} events today")

    schedule_log = Path(args.schedule_log)
    # pending-syncs lives alongside the schedule log
    pending_file = schedule_log.parent / 'pending-syncs.json'

    # Load existing entries
    existing = []
    if schedule_log.exists():
        try:
            existing = json.loads(schedule_log.read_text())
        except Exception:
            existing = []

    pending = []
    if pending_file.exists():
        try:
            pending = json.loads(pending_file.read_text())
        except Exception:
            pending = []

    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    existing_today = [e for e in existing if e.get('scheduled_date') == today_str]
    already_ids = {e['event_id'] for e in existing_today}
    pending_ids = {p['event_id'] for p in pending}

    now_utc = datetime.now(timezone.utc)
    new_entries = []
    new_pending = []

    for event in events:
        cal_title = event.get('summary') or '(untitled)'
        event_id = event.get('id') or event.get('iCalUID') or normalize(cal_title)

        if event_id in already_ids:
            log(f"SKIP (already scheduled): {cal_title}")
            continue

        end_raw = (event.get('end') or {}).get('dateTime') or (event.get('end') or {}).get('date') or ''
        if not end_raw:
            log(f"SKIP (no end time): {cal_title}")
            continue

        try:
            end_dt = datetime.fromisoformat(end_raw.replace('Z', '+00:00'))
            fire_dt = end_dt + timedelta(minutes=args.delay_minutes)
        except Exception as e:
            log(f"SKIP (bad end time): {cal_title}: {e}")
            continue

        fire_epoch = fire_dt.timestamp()
        now_epoch = now_utc.timestamp()

        # Skip meetings that ended >2h ago (missed window)
        if fire_epoch < now_epoch - 7200:
            log(f"SKIP (too old): {cal_title}")
            continue

        fire_iso = fire_dt.strftime('%Y-%m-%dT%H:%M:%S+00:00')
        fire_display = fire_dt.strftime('%H:%M UTC')
        log(f"QUEUE: {cal_title} → sync due at {fire_display}")

        entry = {
            'event_id': event_id,
            'cal_title': cal_title,
            'end_time': end_raw,
            'fire_at': fire_iso,
            'fire_epoch': int(fire_epoch),
            'scheduled_date': today_str,
            'sync_script': args.sync_script,
            'status': 'pending',
        }
        new_entries.append({**entry, 'status': 'scheduled'})
        if event_id not in pending_ids:
            new_pending.append(entry)

    # Save schedule log
    merged_log = existing_today + new_entries
    schedule_log.write_text(json.dumps(merged_log, indent=2))

    # Save pending-syncs (only future/not-yet-run entries + new ones)
    # Keep entries that haven't fired yet
    still_pending = [p for p in pending if p.get('status') == 'pending' and p.get('event_id') not in {e['event_id'] for e in new_pending}]
    all_pending = still_pending + new_pending
    pending_file.write_text(json.dumps(all_pending, indent=2))

    log(f"Done: {len(new_pending)} new jobs queued, {len(all_pending)} total pending")


if __name__ == '__main__':
    main()
