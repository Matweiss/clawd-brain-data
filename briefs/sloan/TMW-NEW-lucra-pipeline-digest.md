---
type: brief
project: lucra
agent: luke
date: 2026-04-13
importance: high
tags: [lucra, pipeline, digest, google-sheets, sales, luke]
builder: Luke
effort: low-medium
obsidian_page: Projects/Lucra/Pipeline.md
---

# Lucra Daily Pipeline Digest

**Status:** draft — pending Paperclip issue creation  
**Priority:** High  
**Assigned builder:** Luke  
**Date briefed:** 2026-04-13

---

## Problem

Mat is 12 days into a $300K OTE founding AE role. His pipeline lives in Google Sheets ("Mat's Pipeline") but there's no daily forcing function to review it. Deal momentum stalls silently — no meetings booked, close dates slipping, next actions sitting untouched. Without a daily digest, the pipeline is a record of the past, not a tool for the present.

## Success Criteria

- Every weekday morning by 8am PT, Mat receives a structured pipeline digest via Telegram
- Digest surfaces: top deal changes since yesterday, stalled opportunities (no activity in X days), and today's next actions
- Reading time under 90 seconds
- Mat starts each day knowing exactly where to focus his selling energy

## Digest Structure

```
Lucra Pipeline — Mon Apr 13

🔥 MOVED
  Acme Sports  →  Proposal  ($85K)
  River League →  Discovery ($40K)

⚠️ STALLED (5+ days no activity)
  Metro FC         last contact: Apr 7  →  [nudge?]
  National League  last contact: Apr 6  →  [nudge?]

📋 TODAY'S ACTIONS
  • Acme Sports — send proposal draft
  • River League — book discovery call
  • Metro FC — follow-up email

Pipeline total: $310K across 7 deals
```

## Technical Approach

**Data source:** Google Sheets "Mat's Pipeline"
Columns: Company, Stage, Amount, Close Date, Last Contact, Notes, Next Action

1. Luke reads pipeline sheet via Google Sheets API (existing OAuth, sheets scope active)
2. Compares current state against previous day's snapshot (`data/luke/pipeline-snapshot.json`)
3. Identifies:
   - **Moved deals:** Stage changed since last snapshot
   - **Stalled:** Last Contact date > 5 days ago AND stage is not Closed
   - **Today's actions:** Next Action field populated; filter for items due today or overdue
4. Generates digest, sends to Mat via Telegram by 8am PT
5. Writes new snapshot to `data/luke/pipeline-snapshot.json`

## Stall Threshold Logic

| Stage | Stall threshold |
|-------|----------------|
| Prospecting | 7 days |
| Discovery | 5 days |
| Proposal | 4 days |
| Negotiation | 3 days |
| Closed | N/A |

More urgency as deals advance — tighter follow-up window in late stages.

## Dependencies

- Google Sheets OAuth active ✅ (existing, sheets scope included)
- Luke must have Sheets read access to "Mat's Pipeline"
- Telegram delivery active ✅
- `data/luke/` directory in workspace
- Morning cron by 7:45am PT (so digest arrives by 8am)

## Sequencing / Prior Art

- No prior pipeline digest exists — clean build
- Luke has a mutual action plan generator (TMW-128) in backlog — that brief assumes this digest exists as a foundation; build this first
- TMW-180 (forecast confidence scorer) also reads pipeline data — consider shared Sheets client module to avoid duplicate API calls

## Architectural Flag for Vandalay

Two upcoming Luke features (TMW-128, TMW-180) will also read "Mat's Pipeline." Build a shared `luke-sheets-client` module now rather than three separate integrations. Recommend Vandalay review before TMW-128 and TMW-180 are briefed to builder.

## Estimated Effort

Low-Medium — 1–2 days (Sheets read + snapshot diff + digest template + cron)

## Recommended Builder

**Luke**
