#!/usr/bin/env python3
"""
_schedule-jobs.py — called by granola-schedule-today.sh
Reads today's calendar, writes pending-syncs.json with two entries per meeting:
  - _pre: fires 15 min before start → granola-pre-meeting-brief.sh
  - _post: fires 10 min after end  → granola-post-meeting-sync.sh
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
    p.add_argument('--sync-script', required=True)   # post-meeting sync
    p.add_argument('--pre-script', default='')        # pre-meeting brief
    p.add_argument('--delay-minutes', type=int, default=10)
    p.add_argument('--pre-lead-minutes', type=int, default=15)
    args = p.parse_args()

    events = json.loads(Path(args.events_file).read_text())
    if not isinstance(events, list):
        log("No events list returned from calendar.")
        sys.exit(0)

    log(f"Found {len(events)} events today")

    schedule_log = Path(args.schedule_log)
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

        start_raw = (event.get('start') or {}).get('dateTime') or ''
        end_raw = (event.get('end') or {}).get('dateTime') or (event.get('end') or {}).get('date') or ''

        # Extract attendee emails/names
        attendees_raw = event.get('attendees') or []
        attendees = []
        for a in attendees_raw:
            email = a.get('email', '')
            name = a.get('displayName', '') or email
            attendees.append(name or email)

        if not end_raw:
            log(f"SKIP (no end time): {cal_title}")
            continue

        try:
            end_dt = datetime.fromisoformat(end_raw.replace('Z', '+00:00'))
            post_fire_dt = end_dt + timedelta(minutes=args.delay_minutes)
        except Exception as e:
            log(f"SKIP (bad end time): {cal_title}: {e}")
            continue

        # --- POST entry ---
        post_id = f"{event_id}_post"
        if post_id in already_ids:
            log(f"SKIP (already scheduled): {cal_title} [post]")
        else:
            post_epoch = int(post_fire_dt.timestamp())
            # Skip if missed window (>2h past end)
            if post_epoch < now_utc.timestamp() - 7200:
                log(f"SKIP (too old): {cal_title} [post]")
            else:
                fire_display = post_fire_dt.strftime('%H:%M UTC')
                log(f"QUEUE: {cal_title} → post-brief at {fire_display}")
                post_entry = {
                    'event_id': post_id,
                    'cal_title': cal_title,
                    'brief_type': 'post',
                    'start_time': start_raw,
                    'end_time': end_raw,
                    'attendees': json.dumps(attendees),
                    'fire_at': post_fire_dt.strftime('%Y-%m-%dT%H:%M:%S+00:00'),
                    'fire_epoch': post_epoch,
                    'scheduled_date': today_str,
                    'sync_script': args.sync_script,
                    'status': 'pending',
                }
                new_entries.append({**post_entry, 'status': 'scheduled'})
                if post_id not in pending_ids:
                    new_pending.append(post_entry)

        # --- PRE entry (only if pre-script provided and start time known) ---
        if args.pre_script and start_raw:
            pre_id = f"{event_id}_pre"
            if pre_id in already_ids:
                log(f"SKIP (already scheduled): {cal_title} [pre]")
            else:
                try:
                    start_dt = datetime.fromisoformat(start_raw.replace('Z', '+00:00'))
                    pre_fire_dt = start_dt - timedelta(minutes=args.pre_lead_minutes)
                except Exception:
                    pre_fire_dt = None

                if pre_fire_dt:
                    pre_epoch = int(pre_fire_dt.timestamp())
                    # Skip if already past
                    if pre_epoch < now_utc.timestamp():
                        log(f"SKIP (already past): {cal_title} [pre]")
                    else:
                        fire_display = pre_fire_dt.strftime('%H:%M UTC')
                        log(f"QUEUE: {cal_title} → pre-brief at {fire_display}")
                        pre_entry = {
                            'event_id': pre_id,
                            'cal_title': cal_title,
                            'brief_type': 'pre',
                            'start_time': start_raw,
                            'end_time': end_raw,
                            'attendees': json.dumps(attendees),
                            'fire_at': pre_fire_dt.strftime('%Y-%m-%dT%H:%M:%S+00:00'),
                            'fire_epoch': pre_epoch,
                            'scheduled_date': today_str,
                            'sync_script': args.pre_script,
                            'status': 'pending',
                        }
                        new_entries.append({**pre_entry, 'status': 'scheduled'})
                        if pre_id not in pending_ids:
                            new_pending.append(pre_entry)

    # Save schedule log
    merged_log = existing_today + new_entries
    schedule_log.write_text(json.dumps(merged_log, indent=2))

    # Save pending-syncs (keep unfired + add new)
    still_pending = [p for p in pending if p.get('status') == 'pending'
                     and p.get('event_id') not in {e['event_id'] for e in new_pending}]
    all_pending = still_pending + new_pending
    pending_file.write_text(json.dumps(all_pending, indent=2))

    log(f"Done: {len(new_pending)} new jobs queued, {len(all_pending)} total pending")


if __name__ == '__main__':
    main()
