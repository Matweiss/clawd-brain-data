#!/usr/bin/env python3
"""
granola-query.py — Read-only Granola cache query interface for VPS agents.

Usage:
  granola-query.py recent [--limit N]
  granola-query.py search <query>
  granola-query.py get <meeting-id>
  granola-query.py notes <meeting-id>
  granola-query.py transcript <meeting-id>
  granola-query.py health

Output: JSON to stdout. Exit 0 on success, 1 on error.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
CACHE_PATH = SKILL_DIR / "data" / "granola-cache.json"
META_PATH = SKILL_DIR / "data" / ".cache-meta.json"
STALE_HOURS = 24


def err(msg, code=1):
    print(json.dumps({"error": msg}), file=sys.stderr)
    sys.exit(code)


def load_cache():
    if not CACHE_PATH.exists():
        err(f"Cache not found at {CACHE_PATH}. Run granola-sync-push.sh on the Mac first.")
    try:
        raw = json.loads(CACHE_PATH.read_text())
    except json.JSONDecodeError as e:
        err(f"Cache JSON is corrupt: {e}")
    return raw


def extract_meetings(raw):
    """Extract meetings from cache-v6 format: data['cache']['state']['documents']."""
    # Real cache-v6 structure: {"cache": {"state": {"documents": {id: doc, ...}, "transcripts": {id: [...], ...}}}}
    if isinstance(raw, dict) and "cache" in raw:
        state = raw["cache"].get("state", {})
        docs = state.get("documents", {})
        transcripts = state.get("transcripts", {})
        if isinstance(docs, dict):
            meetings = []
            for doc_id, doc in docs.items():
                if isinstance(doc, dict):
                    doc["_transcripts"] = transcripts.get(doc_id) or transcripts.get(doc.get("id", ""))
                    meetings.append(doc)
            return meetings
    # Fallback: list of meetings directly, or dict with 'meetings' key
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        for key in ("meetings", "panels", "items", "data"):
            if key in raw and isinstance(raw[key], list):
                return raw[key]
        vals = list(raw.values())
        if vals and isinstance(vals[0], dict):
            return vals
    return []


def meeting_summary(m):
    """Return a compact summary dict for a meeting."""
    started, ended = _timestamps(m)
    return {
        "id": m.get("id") or "",
        "title": m.get("title") or "(untitled)",
        "started_at": started,
        "ended_at": ended,
        "participants": _participants(m),
        "has_notes": bool(_notes_text(m)),
        "has_transcript": bool(m.get("_transcripts")),
    }


def _timestamps(m):
    """Extract start/end from google_calendar_event or created_at."""
    gcal = m.get("google_calendar_event") or {}
    if isinstance(gcal, dict):
        start = gcal.get("start") or {}
        end = gcal.get("end") or {}
        started = start.get("dateTime") or start.get("date") or m.get("created_at") or ""
        ended = end.get("dateTime") or end.get("date") or m.get("updated_at") or ""
        return started, ended
    return m.get("created_at") or "", m.get("updated_at") or ""


def _participants(m):
    """Extract participant names from people.attendees or google_calendar_event.attendees."""
    people = m.get("people") or {}
    if isinstance(people, dict):
        attendees = people.get("attendees") or []
        out = []
        for a in attendees:
            if isinstance(a, dict):
                # Try nested details.person.name.fullName first
                details = a.get("details") or {}
                person = details.get("person") or {}
                name_obj = person.get("name") or {}
                name = name_obj.get("fullName") or a.get("displayName") or a.get("email") or ""
                if name:
                    out.append(name)
        if out:
            return out
    # Fallback: google_calendar_event attendees
    gcal = m.get("google_calendar_event") or {}
    if isinstance(gcal, dict):
        gcal_attendees = gcal.get("attendees") or []
        return [a.get("displayName") or a.get("email") or "" for a in gcal_attendees if isinstance(a, dict)]
    return []


def _notes_text(m):
    """Extract notes from notes_markdown, notes_plain, summary, or overview."""
    for key in ("notes_markdown", "notes_plain", "summary", "overview"):
        v = m.get(key)
        if v and isinstance(v, str) and v.strip():
            return v
    return ""


def _action_items(m):
    for key in ("action_items", "actionItems", "todos", "tasks", "chapters"):
        v = m.get(key)
        if v and isinstance(v, list):
            return v
    return []


def _transcript(m):
    segs = m.get("_transcripts")
    if segs and isinstance(segs, list):
        return [
            {
                "speaker": s.get("source") or s.get("transcriber_user_id") or "unknown",
                "text": s.get("text") or "",
                "timestamp": s.get("start_timestamp") or "",
            }
            for s in segs
            if isinstance(s, dict) and s.get("text")
        ]
    return None


def cmd_recent(args, meetings):
    limit = args.limit
    # Sort by started_at descending
    def sort_key(m):
        s = m.get("started_at") or m.get("startedAt") or m.get("created_at") or ""
        return s

    sorted_meetings = sorted(meetings, key=sort_key, reverse=True)[:limit]
    result = [meeting_summary(m) for m in sorted_meetings]
    print(json.dumps({"meetings": result, "total": len(meetings), "returned": len(result)}, indent=2))


def cmd_search(args, meetings):
    query = args.query.lower()
    matched = []
    for m in meetings:
        title = (m.get("title") or m.get("name") or "").lower()
        participants = " ".join(_participants(m)).lower()
        notes = _notes_text(m).lower()
        if query in title or query in participants or query in notes:
            matched.append(meeting_summary(m))
    # Sort by started_at descending
    matched.sort(key=lambda x: x.get("started_at") or "", reverse=True)
    print(json.dumps({"query": args.query, "matches": matched, "count": len(matched)}, indent=2))


def _find_meeting(meeting_id, meetings):
    for m in meetings:
        mid = m.get("id") or m.get("panelId") or m.get("documentId") or ""
        if mid == meeting_id or mid.startswith(meeting_id):
            return m
    return None


def cmd_get(args, meetings):
    m = _find_meeting(args.meeting_id, meetings)
    if not m:
        err(f"Meeting not found: {args.meeting_id}")
    print(json.dumps(meeting_summary(m), indent=2))


def cmd_notes(args, meetings):
    m = _find_meeting(args.meeting_id, meetings)
    if not m:
        err(f"Meeting not found: {args.meeting_id}")
    notes = _notes_text(m)
    action_items = _action_items(m)
    print(json.dumps({
        "id": args.meeting_id,
        "title": m.get("title") or m.get("name") or "(untitled)",
        "notes": notes,
        "action_items": action_items,
    }, indent=2))


def cmd_transcript(args, meetings):
    m = _find_meeting(args.meeting_id, meetings)
    if not m:
        err(f"Meeting not found: {args.meeting_id}")
    transcript = _transcript(m)
    if not transcript:
        print(json.dumps({"id": args.meeting_id, "transcript": None, "available": False}, indent=2))
        return
    print(json.dumps({
        "id": args.meeting_id,
        "title": m.get("title") or "(untitled)",
        "transcript": transcript,
        "available": True,
    }, indent=2))


def cmd_health(args, meetings_unused):
    result = {"status": "unknown", "cache_path": str(CACHE_PATH)}

    if not CACHE_PATH.exists():
        result["status"] = "missing"
        result["detail"] = "Cache file not synced from Mac yet"
        print(json.dumps(result, indent=2))
        return

    stat = CACHE_PATH.stat()
    age_hours = (datetime.now(timezone.utc).timestamp() - stat.st_mtime) / 3600
    result["cache_age_hours"] = round(age_hours, 1)
    result["cache_size_bytes"] = stat.st_size

    if META_PATH.exists():
        try:
            meta = json.loads(META_PATH.read_text())
            result["last_sync"] = meta.get("synced_at")
            result["meeting_count_at_sync"] = meta.get("meeting_count")
        except Exception:
            pass

    try:
        data = json.loads(CACHE_PATH.read_text())
        meetings = extract_meetings(data)
        result["meeting_count"] = len(meetings)
    except json.JSONDecodeError:
        result["status"] = "degraded"
        result["detail"] = "Cache file is corrupt"
        print(json.dumps(result, indent=2))
        return

    if len(meetings) == 0:
        result["status"] = "degraded"
        result["detail"] = "Cache is empty — no meetings found"
    elif age_hours > STALE_HOURS:
        result["status"] = "stale"
        result["detail"] = f"Cache is {age_hours:.1f}h old (threshold: {STALE_HOURS}h)"
    else:
        result["status"] = "healthy"
        result["detail"] = f"{len(meetings)} meetings, cache {age_hours:.1f}h old"

    print(json.dumps(result, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Query Granola meeting cache")
    sub = parser.add_subparsers(dest="command", required=True)

    p_recent = sub.add_parser("recent", help="List recent meetings")
    p_recent.add_argument("--limit", type=int, default=10)

    p_search = sub.add_parser("search", help="Search meetings by keyword")
    p_search.add_argument("query")

    p_get = sub.add_parser("get", help="Get meeting summary")
    p_get.add_argument("meeting_id")

    p_notes = sub.add_parser("notes", help="Get meeting notes and action items")
    p_notes.add_argument("meeting_id")

    p_transcript = sub.add_parser("transcript", help="Get meeting transcript")
    p_transcript.add_argument("meeting_id")

    sub.add_parser("health", help="Check cache health")

    args = parser.parse_args()

    if args.command == "health":
        cmd_health(args, [])
        return

    data = load_cache()
    meetings = extract_meetings(data)

    dispatch = {
        "recent": cmd_recent,
        "search": cmd_search,
        "get": cmd_get,
        "notes": cmd_notes,
        "transcript": cmd_transcript,
    }
    dispatch[args.command](args, meetings)


if __name__ == "__main__":
    main()
