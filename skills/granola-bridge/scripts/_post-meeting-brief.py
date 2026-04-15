#!/usr/bin/env python3
"""
_post-meeting-brief.py — called by granola-post-meeting-sync.sh
Finds a matching Granola meeting and writes a post-meeting brief markdown file.

Args: --followup-dir --query-script --cal-title --event-id --lookback-hours
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path


def log(msg):
    print(f"[granola-sync] {msg}", file=sys.stderr)


def normalize(s):
    return re.sub(r'[^a-z0-9 ]', '', (s or '').lower()).strip()


def sim(a, b):
    na, nb = normalize(a), normalize(b)
    if na == nb:
        return 1.0
    wa, wb = set(na.split()), set(nb.split())
    return len(wa & wb) / max(len(wa), len(wb)) if wa and wb else 0.0


def run_query(query_script, *args):
    r = subprocess.run(['python3', query_script] + list(args), capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 else None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--followup-dir', required=True)
    p.add_argument('--query-script', required=True)
    p.add_argument('--cal-title', default='')
    p.add_argument('--event-id', default='')
    p.add_argument('--lookback-hours', type=int, default=3)
    args = p.parse_args()

    followup_dir = Path(args.followup_dir)
    followup_dir.mkdir(parents=True, exist_ok=True)

    now_utc = datetime.now(timezone.utc)
    cutoff = now_utc - timedelta(hours=args.lookback_hours)

    # Idempotency check
    if args.event_id:
        safe_id = re.sub(r'[^a-zA-Z0-9_-]', '_', args.event_id)
        brief_path = followup_dir / f"{safe_id}.md"
        if brief_path.exists():
            log(f"Brief already exists: {brief_path.name}")
            sys.exit(0)

    # Get recent Granola meetings
    granola_result = run_query(args.query_script, 'recent', '--limit', '50')
    granola_meetings = granola_result.get('meetings', []) if granola_result else []

    def is_recent(m):
        s = m.get('started_at') or ''
        if not s:
            return True
        try:
            dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
            return dt >= cutoff
        except Exception:
            return True

    recent_meetings = [m for m in granola_meetings if is_recent(m)]

    if args.cal_title:
        # Find best match for this specific calendar event
        best, best_score = None, 0.0
        for m in granola_meetings:
            s = sim(args.cal_title, m.get('title', ''))
            if s > best_score:
                best_score, best = s, m
        targets = [(args.cal_title, args.event_id, best if best_score >= 0.3 else None, best_score)]
    else:
        # No title given — write briefs for all recent Granola meetings
        targets = [(m['title'], m['id'], m, 1.0) for m in recent_meetings]

    for (cal_t, ev_id, granola_m, score) in targets:
        safe_id = re.sub(r'[^a-zA-Z0-9_-]', '_', ev_id or normalize(cal_t).replace(' ', '_'))
        brief_path = followup_dir / f"{safe_id}.md"
        if brief_path.exists():
            log(f"Brief exists: {brief_path.name}")
            continue

        lines = [f"# Post-Meeting Brief: {cal_t}", ""]
        lines.append(f"**Synced:** {now_utc.strftime('%Y-%m-%d %H:%M UTC')}")

        if granola_m:
            mid = granola_m['id']
            lines.append(f"**Granola ID:** `{mid}`")
            if score < 1.0:
                lines.append(f"**Granola title:** {granola_m['title']} *(match score: {score:.2f})*")
            participants = granola_m.get('participants') or []
            if participants:
                lines.append(f"**Participants:** {', '.join(participants)}")
            lines.append("")

            notes_r = run_query(args.query_script, 'notes', mid)
            if notes_r and notes_r.get('notes'):
                lines.append("## Notes")
                lines.append(notes_r['notes'])
                lines.append("")
            if notes_r and notes_r.get('action_items'):
                lines.append("## Action Items")
                for item in notes_r['action_items']:
                    text = item if isinstance(item, str) else (item.get('text') or item.get('title') or json.dumps(item))
                    lines.append(f"- {text}")
                lines.append("")

            tx_r = run_query(args.query_script, 'transcript', mid)
            if tx_r and tx_r.get('available'):
                segs = tx_r.get('transcript') or []
                lines.append(f"## Transcript ({len(segs)} segments)")
                for seg in segs[:30]:
                    lines.append(f"**{seg.get('speaker', '?')}:** {seg.get('text', '')}")
                if len(segs) > 30:
                    lines.append(f"*…{len(segs) - 30} more segments — open Granola for full transcript*")
                lines.append("")
        else:
            lines.append("")
            lines.append("## Notes")
            lines.append("*No matching Granola meeting found — was Granola recording active?*")

        lines.append(f"---\n*Auto-generated by granola-bridge at {now_utc.strftime('%Y-%m-%dT%H:%M:%SZ')}*")
        brief_path.write_text('\n'.join(lines))
        log(f"Wrote: {brief_path}")
        print(f"BRIEF: {brief_path}")


if __name__ == '__main__':
    main()
