#!/usr/bin/env python3
"""
Deal Velocity Follow-Up Engine
Luke's automated deal staleness detector for Mat's Lucra pipeline.

Reads from Google Sheets "Lucra Pipeline Tracker" via gog CLI.
Drafts follow-up emails for stale deals and outputs JSON + Telegram-ready summary.

Usage:
    python3 deal-velocity-followup.py [--mock]
    
    --mock    Use hardcoded sample data (no Google Sheets required)
"""

import subprocess
import json
import sys
import os
from datetime import datetime, date, timedelta

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────

SHEET_ID = "1EfCK7TFd8mtzZJFTdFvf7jKToC7liAd5-z_xpRs0lNs"
SHEET_RANGE = "Sheet1!A2:P100"  # Skip header row; columns A–P
GOG_ACCOUNT = "mat.weiss@lucrasports.com"

# Staleness thresholds (days since last contact) per stage
STALE_THRESHOLDS = {
    "qualification":    7,
    "prospecting":      5,
    "discovery":        5,
    "demo scheduled":   2,
    "proposal":         4,
    "negotiation":      4,
    "contract":         3,
    # fallback
    "_default":         4,
}

# Column indices (0-based) based on sheet header:
# Deal Name(0), Company(1), Vertical(2), Contact Name(3), Contact Title(4),
# Contact Email(5), Stage(6), Deal Value(7), Rev Share(8), Contract Type(9),
# Last Activity(10), Next Action(11), Next Action Date(12), Days in Stage(13),
# Source(14), Notes(15)
COL_DEAL_NAME    = 0
COL_COMPANY      = 1
COL_CONTACT_NAME = 3
COL_EMAIL        = 5
COL_STAGE        = 6
COL_DEAL_VALUE   = 7
COL_LAST_CONTACT = 10
COL_NEXT_ACTION  = 11
COL_NOTES        = 15


# ─────────────────────────────────────────────
# Mock data for testing (--mock flag)
# ─────────────────────────────────────────────

MOCK_DEALS = [
    {
        "company": "TopGolf Enterprises",
        "stage": "Proposal",
        "deal_value": "$48,000",
        "last_contact": (date.today() - timedelta(days=5)).isoformat(),
        "contact_email": "jsmith@topgolf.com",
        "contact_name": "Jake Smith",
        "notes": "Loved the demo. Asked for custom rev share breakdown. Decision by end of Q2.",
        "next_action": "Follow up on proposal",
    },
    {
        "company": "Dave & Buster's",
        "stage": "Discovery",
        "deal_value": "$120,000",
        "last_contact": (date.today() - timedelta(days=6)).isoformat(),
        "contact_email": "mlee@davebusters.com",
        "contact_name": "Michelle Lee",
        "notes": "VP of Entertainment. Very interested in leaderboard features. Wants to see live venue demo.",
        "next_action": "Send case study before demo",
    },
    {
        "company": "Chicken N Pickle",
        "stage": "Qualification",
        "deal_value": "$24,000",
        "last_contact": (date.today() - timedelta(days=8)).isoformat(),
        "contact_email": "",
        "contact_name": "Tom Rivera",
        "notes": "Inbound lead via referral from TopGolf. Pickleball venues, 6 locations. Contact: tom@cnp.com",
        "next_action": "Discovery call",
    },
]


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def get_threshold(stage: str) -> int:
    s = stage.strip().lower()
    for key, days in STALE_THRESHOLDS.items():
        if key in s:
            return days
    return STALE_THRESHOLDS["_default"]


def parse_date(val: str) -> date | None:
    if not val:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y/%m/%d"):
        try:
            return datetime.strptime(val.strip(), fmt).date()
        except ValueError:
            continue
    return None


def days_since(d: date) -> int:
    return (date.today() - d).days


def urgency_label(days: int, threshold: int) -> str:
    overage = days - threshold
    if overage >= 7:
        return "🔴 CRITICAL"
    elif overage >= 3:
        return "🟠 HIGH"
    elif overage >= 1:
        return "🟡 MEDIUM"
    return "⚪ LOW"


def extract_email_from_notes(notes: str) -> str:
    """Pull an email address out of a Notes string if present."""
    import re
    m = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", notes, re.IGNORECASE)
    return m.group(0) if m else ""


def draft_email(deal: dict) -> dict:
    """Generate subject + body for a stale deal."""
    company = deal["company"]
    stage   = deal["stage"].strip().lower()
    days    = deal["days_stale"]
    name    = deal.get("contact_name", "").split()[0] if deal.get("contact_name") else "there"
    notes   = deal.get("notes", "")

    # Choose template by stage
    if "proposal" in stage or "negotiation" in stage or "contract" in stage:
        subject = f"Re: Lucra Proposal — {company}"
        body = (
            f"Hi {name},\n\n"
            f"Wanted to check in on the proposal we sent over for {company}. "
            f"It's been {days} days and I want to make sure you have everything you need to move forward.\n\n"
        )
        if notes:
            body += f"A quick reminder of where we left things: {notes}\n\n"
        body += (
            "Happy to jump on a quick call to address any questions, work through terms, "
            "or adjust anything in the proposal. What works best for you this week?\n\n"
            "Best,\nMat Weiss\nLucra Sports"
        )

    elif "demo" in stage or "discovery" in stage:
        subject = f"Following Up — Lucra Demo for {company}"
        body = (
            f"Hi {name},\n\n"
            f"Following up on our demo / discovery call from {days} days ago. "
            f"I'd love to keep the momentum going and answer any questions that came up.\n\n"
        )
        if notes:
            body += f"Based on what we discussed: {notes}\n\n"
        body += (
            "Would you be open to a 20-minute check-in this week? "
            "I can walk through how Lucra maps to your specific setup.\n\n"
            "Best,\nMat Weiss\nLucra Sports"
        )

    else:
        # Prospecting / Qualification / other
        subject = f"Quick Touch Base — Lucra × {company}"
        body = (
            f"Hi {name},\n\n"
            f"Just wanted to reconnect about Lucra. "
            f"We've been helping entertainment and hospitality venues drive more revenue and engagement — "
            f"and {company} feels like a great fit.\n\n"
        )
        if notes:
            body += f"Context from our last interaction: {notes}\n\n"
        body += (
            "Would love to find 15 minutes to show you what we've been building. "
            "Are you available for a quick call this week?\n\n"
            "Best,\nMat Weiss\nLucra Sports"
        )

    return {"subject": subject, "body": body}


# ─────────────────────────────────────────────
# Google Sheets fetch
# ─────────────────────────────────────────────

def fetch_pipeline_from_sheets() -> list[dict]:
    """Call gog CLI to read pipeline rows. Returns list of deal dicts."""
    cmd = [
        "gog", "sheets", "get",
        SHEET_ID, SHEET_RANGE,
        "--json"
    ]
    env = os.environ.copy()
    env["GOG_ACCOUNT"] = GOG_ACCOUNT

    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f"❌ gog sheets error: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(result.stdout)
    rows = data.get("values", [])

    deals = []
    for row in rows:
        # Skip empty rows or template rows
        if not row or len(row) < 7:
            continue
        if row[COL_COMPANY] in ("", "[Company]"):
            continue

        def col(i):
            return row[i].strip() if i < len(row) else ""

        company      = col(COL_COMPANY)
        stage        = col(COL_STAGE)
        last_contact = col(COL_LAST_CONTACT)
        notes        = col(COL_NOTES)
        email        = col(COL_EMAIL)
        contact_name = col(COL_CONTACT_NAME)
        deal_value   = col(COL_DEAL_VALUE)

        if not company or not stage:
            continue

        # Try to pull email from notes if main col empty
        if not email and notes:
            email = extract_email_from_notes(notes)

        deals.append({
            "company":      company,
            "stage":        stage,
            "deal_value":   deal_value,
            "last_contact": last_contact,
            "contact_email": email,
            "contact_name": contact_name,
            "notes":        notes,
            "next_action":  col(COL_NEXT_ACTION),
        })

    return deals


def load_mock_deals() -> list[dict]:
    return [d for d in MOCK_DEALS if not d.get("not_stale")]


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    use_mock = "--mock" in sys.argv

    if use_mock:
        print("⚠️  Running in MOCK mode — using hardcoded sample data\n")
        raw_deals = MOCK_DEALS
    else:
        raw_deals = fetch_pipeline_from_sheets()

    today = date.today()
    stale_deals = []

    for deal in raw_deals:
        stage = deal.get("stage", "").strip()
        if not stage or stage.lower() in ("closed won", "closed lost", "—"):
            continue

        last_contact_str = deal.get("last_contact", "")
        last_contact_dt  = parse_date(last_contact_str)

        if last_contact_dt is None:
            # No last contact date → treat as very stale
            days = 999
        else:
            days = days_since(last_contact_dt)

        threshold = get_threshold(stage)

        if days >= threshold:
            email_draft = draft_email({**deal, "days_stale": days})
            stale_deals.append({
                "company":       deal["company"],
                "stage":         stage,
                "days_stale":    days,
                "contact_email": deal.get("contact_email", ""),
                "contact_name":  deal.get("contact_name", ""),
                "deal_value":    deal.get("deal_value", ""),
                "notes":         deal.get("notes", ""),
                "last_contact":  last_contact_str,
                "threshold":     threshold,
                "urgency":       urgency_label(days, threshold),
                "subject":       email_draft["subject"],
                "body":          email_draft["body"],
            })

    # Sort by days_stale descending (most urgent first)
    stale_deals.sort(key=lambda x: x["days_stale"], reverse=True)

    # ── Output JSON ──
    date_str  = today.strftime("%Y-%m-%d")
    json_path = f"/tmp/deal-velocity-drafts-{date_str}.json"
    with open(json_path, "w") as f:
        json.dump(stale_deals, f, indent=2)

    # ── Stdout summary ──
    if not stale_deals:
        print(f"✅ No stale deals as of {date_str}. Pipeline looks healthy!")
        sys.exit(0)

    lines = [f"🔴 STALE DEALS — {date_str}", ""]

    for i, deal in enumerate(stale_deals, 1):
        preview = deal["body"][:100].replace("\n", " ").strip()
        lines.append(
            f"{i}. {deal['company']} ({deal['stage']}) — {deal['days_stale']} days since contact  {deal['urgency']}"
        )
        lines.append(f"   Subject: {deal['subject']}")
        lines.append(f"   Body preview: {preview}...")
        if deal.get("contact_email"):
            lines.append(f"   To: {deal['contact_email']}")
        lines.append("")

    lines.append(f"Full drafts saved to {json_path}")

    output = "\n".join(lines)
    print(output)

    # Exit code 1 = stale deals found (used by cron script to trigger Telegram)
    sys.exit(1)


if __name__ == "__main__":
    main()
