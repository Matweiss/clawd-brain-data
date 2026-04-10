---
name: luke-google-workspace
description: Google Workspace integration for mat.weiss@lucrasports.com
---

# Google Workspace Integration for Luke

## Overview

Luke uses Google Workspace (mat.weiss@lucrasports.com) for:
- **Gmail:** Prospect communication, follow-ups
- **Calendar:** Meeting tracking, prep reminders
- **Sheets:** Primary CRM ("Mat's Pipeline")
- **Docs:** Proposals, battle cards

## Prerequisites

1. **Account:** mat.weiss@lucrasports.com must be set up in gog
2. **Auth:** Run `gog auth add mat.weiss@lucrasports.com --services gmail,calendar,drive,docs,sheets`
3. **Environment:** `GOG_KEYRING_PASSWORD=clawd` (already set globally)

## Setup Status

From MEMORY.md:
> **mat.weiss@lucrasports.com** — pending (set up on/after Apr 1 Lucra start date)

**Action Required:** Complete gog auth for mat.weiss@lucrasports.com

## CRM Structure ("Mat's Pipeline" Sheet)

| Column | Property | Example |
|--------|----------|---------|
| A | Company | DraftKings |
| B | Stage | Stage 3 - Proposal |
| C | Amount | $50000 |
| D | Close Date | 2026-05-15 |
| E | Last Contact | 2026-04-10 |
| F | Notes | Met with VP Product |
| G | Next Action | Send proposal by Friday |
| H | Source | Outbound |

## Common Commands

### Gmail

```bash
# Search prospect emails (last 7 days)
gog gmail messages search "in:inbox newer_than:7d -from:lucrasports.com" \
  --account mat.weiss@lucrasports.com --max 20

# Search specific company
gog gmail messages search "from:draftkings.com OR subject:DraftKings" \
  --account mat.weiss@lucrasports.com

# Send follow-up
gog gmail send \
  --to prospect@company.com \
  --subject "Following up on our conversation" \
  --body-file ./followup.txt \
  --account mat.weiss@lucrasports.com

# Create draft proposal
gog gmail drafts create \
  --to prospect@company.com \
  --cc brian@lucrasports.com \
  --subject "Lucra Partnership Proposal" \
  --body-file ./proposal.txt \
  --account mat.weiss@lucrasports.com
```

### Calendar

```bash
# Today's meetings
gog calendar events primary \
  --from $(date -I)T00:00:00 \
  --to $(date -I)T23:59:59 \
  --account mat.weiss@lucrasports.com

# Next 7 days
gog calendar events primary \
  --from $(date -I)T00:00:00 \
  --to $(date -d '+7 days' -I)T23:59:59 \
  --account mat.weiss@lucrasports.com

# Create prep block
gog calendar create primary \
  --summary "PREP: Call with [Company]" \
  --from "2026-04-11T13:00:00" \
  --to "2026-04-11T13:30:00" \
  --description "Research prospect, pull battle cards" \
  --event-color 4 \
  --account mat.weiss@lucrasports.com
```

### Sheets (CRM)

```bash
# Get full pipeline
gog sheets get $PIPELINE_SHEET_ID "Pipeline!A1:H100" \
  --json --account mat.weiss@lucrasports.com

# Get specific deal row
gog sheets get $PIPELINE_SHEET_ID "Pipeline!A5:H5" \
  --json --account mat.weiss@lucrasports.com

# Update deal stage
gog sheets update $PIPELINE_SHEET_ID "Pipeline!B5" \
  --values-json '[["Stage 4 - Negotiation"]]' \
  --input USER_ENTERED \
  --account mat.weiss@lucrasports.com

# Update last contact date
gog sheets update $PIPELINE_SHEET_ID "Pipeline!E5" \
  --values-json '[["'$(date -I)'"]]' \
  --input USER_ENTERED \
  --account mat.weiss@lucrasports.com

# Add new deal
gog sheets append $PIPELINE_SHEET_ID "Pipeline!A:H" \
  --values-json '[["FanDuel","Stage 1 - Prospecting","75000","2026-06-01","'$(date -I)'","Initial outreach","Send intro email","Outbound"]]' \
  --insert INSERT_ROWS \
  --account mat.weiss@lucrasports.com
```

### Docs

```bash
# Export proposal to text
gog docs export $DOC_ID --format txt --out /tmp/proposal.txt \
  --account mat.weiss@lucrasports.com

# Read doc content
gog docs cat $DOC_ID --account mat.weiss@lucrasports.com
```

## Daily Workflow

### Morning
1. Pull today's calendar
2. Check for new emails from prospects
3. Review pipeline for stale deals

### Pre-Meeting
1. Block 30 min prep time on calendar
2. Research prospect
3. Pull relevant docs/battle cards

### Post-Meeting
1. Update Last Contact date
2. Move stage if applicable
3. Set Next Action
4. Create follow-up email draft

## Automation Ideas

- Auto-create prep blocks 1 hour before meetings
- Daily pipeline health check
- Stale deal alerts (>7 days no activity)
- Follow-up reminder emails
