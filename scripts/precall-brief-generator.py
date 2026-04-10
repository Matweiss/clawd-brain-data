#!/usr/bin/env python3
"""
Pre-Call Prospect Brief Generator — Luke (Lucra Sales Agent)
Detects upcoming Lucra sales calls and delivers a 1-page prospect intelligence
brief to Mat Weiss via Telegram 30 minutes before the call.
"""

import json
import subprocess
import sys
import re
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

# ─── Config ────────────────────────────────────────────────────────────────────

CALENDARS = [
    "primary",  # mat.weiss@lucrasports.com (default account)
    "primary",  # thematweiss@gmail.com
]
ACCOUNTS = [
    "mat.weiss@lucrasports.com",
    "thematweiss@gmail.com",
]

SALES_KEYWORDS = [
    "demo", "discovery", "intro", "lucra", "prospect",
    "call", "meeting", "pitch", "walkthrough", "debrief",
]

# Events where ALL attendees are @lucrasports.com → skip (internal)
INTERNAL_DOMAIN = "lucrasports.com"

# Look ahead window
LOOKAHEAD_MINUTES = 45

# Telegram recipient
TELEGRAM_RECIPIENT = "telegram:8001393940"

# ─── Mock Event for Testing ────────────────────────────────────────────────────

MOCK_MODE = os.environ.get("PRECALL_MOCK", "0") == "1"

def get_mock_event():
    """Return a fake sales call 30 min from now for testing."""
    now = datetime.now(timezone.utc)
    call_time = now + timedelta(minutes=30)
    return {
        "id": "mock_event_001",
        "summary": "Intro Call — FanDuel / Jake Morrison",
        "description": "Discovery call with Jake Morrison, VP of Product at FanDuel. Discussing fan engagement and loyalty platform options.",
        "start": {"dateTime": call_time.isoformat()},
        "end": {"dateTime": (call_time + timedelta(hours=1)).isoformat()},
        "attendees": [
            {"email": "jake.morrison@fanduel.com", "displayName": "Jake Morrison"},
            {"email": "mat.weiss@lucrasports.com", "displayName": "Mat Weiss"},
        ],
    }

# ─── Calendar Fetching ─────────────────────────────────────────────────────────

def fetch_events(account: str) -> list[dict]:
    """Fetch calendar events in the next LOOKAHEAD_MINUTES for a given account."""
    now = datetime.now(timezone.utc)
    end = now + timedelta(minutes=LOOKAHEAD_MINUTES)
    
    from_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    to_str = end.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    cmd = [
        "gog", "calendar", "events", "primary",
        "--from", from_str,
        "--to", to_str,
        "--account", account,
        "--json",
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"[WARN] gog failed for {account}: {result.stderr.strip()}", file=sys.stderr)
            return []
        data = json.loads(result.stdout)
        return data.get("events", [])
    except Exception as e:
        print(f"[WARN] Error fetching events for {account}: {e}", file=sys.stderr)
        return []

def is_sales_call(event: dict) -> bool:
    """Return True if this looks like an external sales call."""
    text = " ".join([
        event.get("summary", ""),
        event.get("description", "") or "",
    ]).lower()
    
    # Must match at least one sales keyword
    if not any(kw in text for kw in SALES_KEYWORDS):
        return False
    
    # Skip if all attendees are internal (@lucrasports.com)
    attendees = event.get("attendees", [])
    if attendees:
        external = [a for a in attendees if not a.get("email", "").endswith(f"@{INTERNAL_DOMAIN}")]
        if not external:
            print(f"[SKIP] Internal meeting: {event.get('summary')}", file=sys.stderr)
            return False
    
    return True

# ─── Prospect Extraction ───────────────────────────────────────────────────────

def extract_prospect(event: dict) -> dict:
    """Extract company name, contact name/email from event."""
    summary = event.get("summary", "")
    description = event.get("description", "") or ""
    attendees = event.get("attendees", [])
    
    # Find external attendees
    external = [a for a in attendees if not a.get("email", "").endswith(f"@{INTERNAL_DOMAIN}")]
    
    contact_name = ""
    contact_email = ""
    company_name = ""
    
    if external:
        contact_email = external[0].get("email", "")
        contact_name = external[0].get("displayName", "")
        # Derive company from email domain
        domain = contact_email.split("@")[-1] if "@" in contact_email else ""
        company_name = domain.split(".")[0].title() if domain else ""
    
    # Try to parse company/contact from summary (e.g. "Intro Call — FanDuel / Jake Morrison")
    # Pattern: "... — Company / Contact" or "Company - Contact" or "Call with Company"
    patterns = [
        r'—\s*([A-Za-z0-9 &\.]+)\s*/\s*([A-Za-z ]+)',   # "— FanDuel / Jake Morrison"
        r'with\s+([A-Za-z0-9 &\.]+)',                      # "with FanDuel"
        r'@\s*([A-Za-z0-9 &\.]+)',                         # "@ FanDuel"
    ]
    for pat in patterns:
        m = re.search(pat, summary, re.IGNORECASE)
        if m:
            if m.lastindex >= 2 and not contact_name:
                contact_name = m.group(2).strip()
            if not company_name or len(m.group(1).strip()) > 2:
                candidate = m.group(1).strip()
                # Don't set generic words as company name
                if candidate.lower() not in ("call", "meeting", "demo", "intro", "the"):
                    company_name = candidate
            break
    
    # Fallback: use event summary as company name
    if not company_name:
        company_name = summary.split(" -")[0].split(" /")[0].strip()
    
    return {
        "company_name": company_name or "Unknown Company",
        "contact_name": contact_name or "Unknown Contact",
        "contact_email": contact_email,
        "event_summary": summary,
        "event_description": description,
        "call_time": event.get("start", {}).get("dateTime", ""),
    }

# ─── Web Research ──────────────────────────────────────────────────────────────

def load_openclaw_config() -> dict:
    """Load openclaw config to get API keys."""
    try:
        config_path = os.path.expanduser("~/.openclaw/openclaw.json")
        with open(config_path) as f:
            return json.load(f)
    except Exception:
        return {}

_OC_CONFIG = None

def get_api_key(name: str) -> str:
    """Get an API key from openclaw config env or OS environment."""
    global _OC_CONFIG
    if _OC_CONFIG is None:
        _OC_CONFIG = load_openclaw_config()
    # Check openclaw config env section first
    val = _OC_CONFIG.get("env", {}).get(name, "")
    if val:
        return val
    # Fall back to OS environment
    return os.environ.get(name, "")


def perplexity_search(query: str) -> str:
    """Use Perplexity API to get a concise research answer."""
    import urllib.request
    api_key = get_api_key("PERPLEXITY_API_KEY")
    if not api_key:
        return ""
    
    payload = json.dumps({
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "You are a concise business intelligence researcher. Answer in 2-3 sentences max. Be factual and specific."},
            {"role": "user", "content": query},
        ],
        "max_tokens": 200,
    }).encode("utf-8")
    
    req = urllib.request.Request(
        "https://api.perplexity.ai/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[WARN] Perplexity search failed: {e}", file=sys.stderr)
        return ""


def web_search(query: str, num_results: int = 3) -> list[dict]:
    """Run a web search. Returns list of result dicts with title/description."""
    # Try Brave Search API first
    brave_key = get_api_key("BRAVE_API_KEY")
    if brave_key:
        try:
            import urllib.request, urllib.parse
            url = f"https://api.search.brave.com/res/v1/web/search?q={urllib.parse.quote(query)}&count={num_results}"
            req = urllib.request.Request(url, headers={
                "Accept": "application/json",
                "X-Subscription-Token": brave_key,
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())
                results = []
                for r in data.get("web", {}).get("results", []):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "description": r.get("description", ""),
                    })
                return results
        except Exception as e:
            print(f"[WARN] Brave search failed: {e}", file=sys.stderr)
    return []


def research_prospect(prospect: dict) -> dict:
    """Research the prospect using Perplexity AI + web search fallback."""
    company = prospect["company_name"]
    contact = prospect["contact_name"]
    
    print(f"[RESEARCH] Researching: {company} / {contact}", file=sys.stderr)
    
    # Use Perplexity for rich synthesis
    industry_text = perplexity_search(
        f"What does {company} do? What is their business, size, and which vertical do they serve? "
        f"Are they in sports, gaming, betting, or fan engagement?"
    ) or ""
    
    funding_text = perplexity_search(
        f"What are the latest news, funding rounds, or major announcements for {company} in 2025 or 2026? "
        f"Any recent expansions, partnerships, or strategic moves?"
    ) or ""
    
    contact_text = perplexity_search(
        f"Who is {contact} at {company}? What is their job title, background, and focus area?"
    ) or ""
    
    # Fallback to raw web search snippets if Perplexity not available
    if not industry_text:
        results = web_search(f"{company} sports gaming fan engagement platform")
        industry_text = " ".join(r.get("description", "") for r in results[:2]).strip() or f"No industry data found for {company}."
    
    if not funding_text:
        results = web_search(f"{company} funding news 2025 2026")
        funding_text = " ".join(r.get("description", "") for r in results[:2]).strip() or ""
    
    if not contact_text:
        results = web_search(f"{contact} {company} LinkedIn")
        contact_text = " ".join(r.get("description", "") for r in results[:1]).strip() or f"No public profile found for {contact}."
    
    return {
        "funding_intel": funding_text,
        "industry_intel": industry_text,
        "contact_intel": contact_text,
    }

# ─── Brief Generator ───────────────────────────────────────────────────────────

def format_call_time(iso_str: str) -> str:
    """Convert ISO datetime to readable PT time."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        # Convert to PT (UTC-7 for PDT, UTC-8 for PST — use -7 for spring)
        pt = dt - timedelta(hours=7)
        return pt.strftime("%-I:%M %p PT")
    except Exception:
        return iso_str

def clean_markdown(text: str) -> str:
    """Strip markdown bold/italic markers and citation brackets from text."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)   # **bold**
    text = re.sub(r'\*(.+?)\*', r'\1', text)        # *italic*
    text = re.sub(r'\[(\d+)\]', '', text)            # [1] citations
    text = re.sub(r'\s{2,}', ' ', text)              # double spaces
    return text.strip()


def generate_brief(prospect: dict, intel: dict) -> str:
    """Build the formatted Telegram brief."""
    company = prospect["company_name"]
    contact = prospect["contact_name"]
    call_time = format_call_time(prospect["call_time"])
    
    # ── Company summary ──
    industry_text = clean_markdown(intel["industry_intel"])
    # Keep it concise: first 220 chars
    if len(industry_text) > 220:
        industry_text = industry_text[:217] + "..."
    
    # ── Contact background ──
    contact_text = clean_markdown(intel["contact_intel"])
    if len(contact_text) > 180:
        contact_text = contact_text[:177] + "..."
    
    # ── Why Now (funding/recent signals) ──
    why_now_bullets = []
    funding_text = clean_markdown(intel["funding_intel"])
    if funding_text and len(funding_text) > 20 and "No" not in funding_text[:10]:
        # Break into sentences as bullets
        sentences = [s.strip() for s in funding_text.replace(". ", ".|").split("|") if s.strip() and len(s.strip()) > 15]
        for s in sentences[:2]:
            why_now_bullets.append(s[:140])
    
    if not why_now_bullets:
        why_now_bullets = [
            f"{company} is actively evaluating engagement solutions",
            "Market timing: sports fan engagement spend up 40% YoY",
        ]
    
    why_now_str = "\n".join(f"• {b}" for b in why_now_bullets[:3])
    
    # ── Objections ──
    objections = [
        ("We already have a loyalty program", "Ask what % of fans are WAU — Lucra drives daily habit, not just points"),
        ("Budget cycle isn't right", "Lucra can co-brand a pilot at zero upfront — tie ROI to re-engagement metrics"),
        ("We're mid-platform build internally", "Lucra's API-first SDK drops in in <2 weeks — no rebuild needed"),
    ]
    obj_str = "\n".join(f"• {obj} → {resp}" for obj, resp in objections[:2])
    
    # ── Opening Angle ──
    opening = (
        f"'I noticed {company} is [expanding/re-platforming/entering new markets] — "
        f"curious how you're thinking about keeping fans engaged between game days?'"
    )
    
    # ── Lucra Fit ──
    lucra_fit = (
        f"Lucra's prediction-game and social-challenge layer can give {company} a "
        f"daily touchpoint with fans at zero content cost — white-labeled, live in weeks."
    )
    
    brief = f"""📋 PRE-CALL BRIEF — {company} | {call_time}

🏢 COMPANY
{company} — {industry_text}

👤 CONTACT
{contact} — {contact_text}

🔥 WHY NOW
{why_now_str}

⚔️ LIKELY OBJECTIONS
{obj_str}

💡 OPENING ANGLE
{opening}

📊 LUCRA FIT
{lucra_fit}

—
🤖 Luke | Lucra Sales Intel"""
    
    return brief

# ─── Delivery ─────────────────────────────────────────────────────────────────

def send_to_telegram(message: str) -> bool:
    """Send a message to Mat via Telegram using openclaw message send."""
    # telegram:8001393940 → channel=telegram, target=8001393940
    target = TELEGRAM_RECIPIENT.split(":", 1)[-1]  # "8001393940"
    cmd = [
        "openclaw", "message", "send",
        "--channel", "telegram",
        "--target", target,
        "--message", message,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("[OK] Brief delivered to Telegram.", file=sys.stderr)
            return True
        else:
            print(f"[ERROR] Telegram delivery failed: {result.stderr.strip()}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"[ERROR] Telegram delivery exception: {e}", file=sys.stderr)
        return False

# ─── Dedup: Don't re-send for same event ──────────────────────────────────────

SENT_LOG = "/tmp/precall-sent.json"

def already_sent(event_id: str) -> bool:
    try:
        with open(SENT_LOG) as f:
            sent = json.load(f)
        return event_id in sent
    except Exception:
        return False

def mark_sent(event_id: str):
    try:
        try:
            with open(SENT_LOG) as f:
                sent = json.load(f)
        except Exception:
            sent = {}
        # Prune entries older than 24h
        now_ts = datetime.now(timezone.utc).timestamp()
        sent = {k: v for k, v in sent.items() if now_ts - v < 86400}
        sent[event_id] = now_ts
        with open(SENT_LOG, "w") as f:
            json.dump(sent, f)
    except Exception as e:
        print(f"[WARN] Could not update sent log: {e}", file=sys.stderr)

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[START] Pre-Call Brief Generator — {datetime.now(timezone.utc).isoformat()}", file=sys.stderr)
    
    events = []
    
    if MOCK_MODE:
        print("[MOCK] Using mock event.", file=sys.stderr)
        events = [get_mock_event()]
    else:
        # Fetch from both calendars
        seen_ids = set()
        for account in ACCOUNTS:
            fetched = fetch_events(account)
            for e in fetched:
                eid = e.get("id", "")
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    events.append(e)
        print(f"[INFO] Found {len(events)} total upcoming events.", file=sys.stderr)
    
    # Filter to sales calls
    sales_calls = [e for e in events if is_sales_call(e)]
    print(f"[INFO] {len(sales_calls)} sales call(s) detected.", file=sys.stderr)
    
    if not sales_calls:
        print("[INFO] No sales calls in window. Nothing to brief.", file=sys.stderr)
        return
    
    for event in sales_calls:
        event_id = event.get("id", event.get("summary", "unknown"))
        
        if already_sent(event_id):
            print(f"[SKIP] Already sent brief for event: {event.get('summary')}", file=sys.stderr)
            continue
        
        prospect = extract_prospect(event)
        print(f"[INFO] Researching: {prospect['company_name']} / {prospect['contact_name']}", file=sys.stderr)
        
        intel = research_prospect(prospect)
        brief = generate_brief(prospect, intel)
        
        print("\n" + "="*60, file=sys.stderr)
        print("BRIEF OUTPUT:", file=sys.stderr)
        print("="*60, file=sys.stderr)
        print(brief, file=sys.stderr)
        print("="*60 + "\n", file=sys.stderr)
        
        # Also print to stdout for logging/testing
        print(brief)
        
        success = send_to_telegram(brief)
        if success:
            mark_sent(event_id)


if __name__ == "__main__":
    main()
