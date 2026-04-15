#!/usr/bin/env python3
"""
_pre-meeting-brief.py — called by granola-pre-meeting-brief.sh
Generates a pre-meeting brief: who's coming, context from Granola history.

Args: --followup-dir --query-script --cal-title --event-id --start-time
      --end-time --attendees (JSON array of email strings)
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def log(msg):
    print(f"[granola-pre] {msg}", file=sys.stderr)


def normalize(s):
    return re.sub(r'[^a-z0-9 ]', '', (s or '').lower()).strip()


def run_query(query_script, *args):
    r = subprocess.run(['python3', query_script] + list(args), capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 else None


def fmt_time(iso_str):
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        # Convert to PT display
        return dt.strftime('%I:%M %p').lstrip('0') + ' PT'
    except Exception:
        return iso_str


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--followup-dir', required=True)
    p.add_argument('--query-script', required=True)
    p.add_argument('--cal-title', default='')
    p.add_argument('--event-id', default='')
    p.add_argument('--start-time', default='')
    p.add_argument('--end-time', default='')
    p.add_argument('--attendees', default='[]')  # JSON array of emails/names
    args = p.parse_args()

    followup_dir = Path(args.followup_dir)
    followup_dir.mkdir(parents=True, exist_ok=True)

    now_utc = datetime.now(timezone.utc)

    safe_id = re.sub(r'[^a-zA-Z0-9_-]', '_', args.event_id or normalize(args.cal_title).replace(' ', '_'))
    brief_path = followup_dir / f"{safe_id}_pre.md"

    # Idempotency: skip if already written
    if brief_path.exists():
        log(f"Pre-brief already exists: {brief_path.name}")
        sys.exit(0)

    # Parse attendees
    try:
        raw_attendees = json.loads(args.attendees)
    except Exception:
        raw_attendees = []

    # Pull recent Granola meetings for history context
    granola_result = run_query(args.query_script, 'recent', '--limit', '30')
    granola_meetings = granola_result.get('meetings', []) if granola_result else []

    # Find Granola meetings with overlapping attendees (by name fragment match)
    attendee_names = []
    for a in raw_attendees:
        # Extract name portion from email or use directly if it's a name
        if '@' in a:
            local = a.split('@')[0].replace('.', ' ').replace('_', ' ')
            attendee_names.append(local)
        else:
            attendee_names.append(a)

    # Filter out the calendar owner's own email
    attendee_names_filtered = [n for n in attendee_names
                                if 'mat' not in n.lower() and 'weiss' not in n.lower()]

    def attendee_overlap(meeting):
        """Return list of attendees this meeting has in common with our event."""
        participants = [p.lower() for p in (meeting.get('participants') or [])]
        matched = []
        for name in attendee_names_filtered:
            name_l = name.lower()
            for part in participants:
                if any(word in part for word in name_l.split() if len(word) > 2):
                    matched.append(name.title())
                    break
        return matched

    related_meetings = []
    for m in granola_meetings:
        overlap = attendee_overlap(m)
        if overlap:
            related_meetings.append((m, overlap))

    # Build brief
    lines = [f"# Pre-Meeting Brief: {args.cal_title}", ""]
    lines.append(f"**When:** {fmt_time(args.start_time)} – {fmt_time(args.end_time)}" if args.start_time else "")
    lines.append(f"**Prepared:** {now_utc.strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("")

    if attendee_names_filtered:
        lines.append("## Who's In This Meeting")
        for name in attendee_names_filtered:
            lines.append(f"- {name.title()}")
        lines.append("")

    if related_meetings:
        lines.append("## Recent Meetings With These People")
        for m, overlap in related_meetings[:5]:
            mid = m['id']
            started = m.get('started_at', '')
            date_str = ''
            if started:
                try:
                    dt = datetime.fromisoformat(started.replace('Z', '+00:00'))
                    date_str = dt.strftime('%b %d')
                except Exception:
                    pass
            date_label = f" ({date_str})" if date_str else ""
            overlap_label = ', '.join(overlap)
            lines.append(f"### {m['title']}{date_label} — *{overlap_label}*")

            # Pull notes for context
            notes_r = run_query(args.query_script, 'notes', mid)
            if notes_r and notes_r.get('notes'):
                # Truncate long notes
                note_text = notes_r['notes']
                if len(note_text) > 400:
                    note_text = note_text[:400] + '…'
                lines.append(note_text)
            if notes_r and notes_r.get('action_items'):
                lines.append("**Open action items:**")
                for item in notes_r['action_items'][:3]:
                    text = item if isinstance(item, str) else (item.get('text') or item.get('title') or '')
                    if text:
                        lines.append(f"- {text}")
            lines.append("")
    else:
        lines.append("## Granola History")
        lines.append("*No recent Granola meetings found with these attendees.*")
        lines.append("")

    lines.append(f"---\n*Auto-generated by granola-bridge at {now_utc.strftime('%Y-%m-%dT%H:%M:%SZ')}*")

    brief_path.write_text('\n'.join(lines))
    log(f"Wrote: {brief_path}")
    print(f"BRIEF: {brief_path}")


if __name__ == '__main__':
    main()
