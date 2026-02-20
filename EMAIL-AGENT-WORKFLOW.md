# Clawd Email Agent — Quick Start Workflow

## Golden Rules

1. **NEVER send emails** — Drafts only, always
2. **NEVER delete anything** — Label and archive only
3. **ALWAYS alert via Telegram** — Mat should never be surprised
4. **ALWAYS log actions** — Sheet is the audit trail
5. **ALWAYS reference tone guide** — Every draft must sound like Mat

---

## Daily Schedule

| Time | Job | Actions |
|------|-----|---------|
| 7:00 AM | Morning Briefing | Scan inbox → Classify → Create drafts → Update Sheet → Telegram summary |
| Every 30 min | Continuous Monitor | Check for 🔴 urgent only → Alert if found |
| 45 min before meeting | Pre-Meeting Prep | Build Battle Card → Telegram |
| 9:00 AM | Follow-Up Check | Scan sent folder → Flag overdue → Create follow-up drafts |
| 5:00 PM | End of Day | Summarize pending → Telegram digest |

---

## Email Processing Flow

```
Email Arrives
     │
     ▼
┌─────────────────┐
│ Is sender in    │──No──▶ Check domain
│ HubSpot?        │        business? ─Yes─▶ 🟡 Needs-Review
└────────┬────────┘                  ─No──▶ 🟢 Check keywords
         │Yes                                     │
         ▼                                        ▼
┌─────────────────┐               ┌─────────────────┐
│ Has active deal?│──No──▶        │ Urgent keywords?│──Yes──▶ 🟡 Needs-Review
└────────┬────────┘  🔵 FYI       └────────┬────────┘
         │Yes                              │No
         ▼                                 ▼
┌─────────────────┐               ⚫ Low-Priority (archive)
│ Urgent keywords │──Yes──▶ 🔴 Urgent-Reply
│ or late stage?  │              (alert + draft)
└────────┬────────┘
         │No
         ▼
    🟠 Needs-Reply
       (draft)
```

---

## Draft Creation Checklist

Before creating any draft:

- [ ] Got full email thread
- [ ] Checked HubSpot for contact/deal
- [ ] Checked Avoma for recent meeting
- [ ] Referenced tone guide
- [ ] If scheduling: checked calendar

Draft must have:
- [ ] First-name greeting
- [ ] No forbidden phrases
- [ ] Clear next step
- [ ] Simple signature ("Mat")

---

## Telegram Alert Priorities

| Priority | When to Send | Timing |
|----------|--------------|--------|
| 🔴 Immediate | Urgent keywords, Contract stage, escalation | Within 5 min of detection |
| 🟠 Briefing | Normal replies needed, follow-ups | Morning + EOD digest |
| 🟡 Info | FYI items, completed actions | Only in summaries |
| ⬜ Silent | Low-priority processing | Log only, no alert |

---

## Context Gathering Order

For any email that needs a draft:

1. **Email thread** (always)
2. **HubSpot contact** → name, title, company
3. **HubSpot deal** → stage, notes, last activity
4. **Avoma** → last meeting summary, key points
5. **Calendar** → availability (if scheduling)
6. **Research cache** → LinkedIn/ZoomInfo data (if available)
7. **Drive** → relevant docs (if referenced)

Skip any unavailable source, note in log.

---

## Stale Thresholds (Business Days)

| Stage | Days Until Stale | Follow-Up Style |
|-------|------------------|-----------------|
| Contract | 2 | Direct, urgent |
| Negotiation | 3 | Helpful check-in |
| Proposal | 4 | Value-add touch |
| Discovery | 5 | Gentle bump |
| Qualification | 7 | Soft follow-up |

---

## Emergency Responses

| Situation | Action |
|-----------|--------|
| Gmail API down | Telegram: "⚠️ Gmail unreachable" — wait and retry |
| Auth expired | Telegram: "🔐 Re-auth needed" — stop processing |
| HubSpot unavailable | Continue with email-only context, note in log |
| Draft creation fails | Telegram: "❌ Draft failed" — include error |
| Unusual spike in emails | Telegram: "📈 Unusual volume" — summarize, don't spam |

---

## Commands Mat Can Send

| Command | Response |
|---------|----------|
| `status` | Inbox counts + pending items |
| `drafts` | List all pending drafts with links |
| `search [query]` | Search email history, return results |
| `pause` | Stop alerts for 2 hours |
| `resume` | Resume normal alerting |
| `refresh` | Force immediate inbox scan |

---

## File Locations

| File | Purpose |
|------|---------|
| Tone Guide | Voice/style reference for all drafts |
| Google Sheet | Logging, tracking, cache |
| Gmail Drafts | All created drafts (never Sent) |
| Research Cache (Sheet tab) | Cached contact/company data |

---

## What Success Looks Like

- Mat spends <15 min on email per day (down from 1-2 hours)
- Zero missed urgent emails
- 80%+ of drafts sent without major edits
- Battle Card ready for every meeting
- No surprises — everything logged and alerted
