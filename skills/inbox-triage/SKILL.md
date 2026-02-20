# Inbox Triage Skill

## Purpose
Scan, classify, and prioritize incoming emails to surface what matters and filter noise.

## When to Use
- Morning Briefing (7 AM daily)
- Continuous monitoring (every 30 min during business hours)
- On-demand when Mat requests inbox status

## Classification Labels

Apply exactly ONE primary label to each unprocessed email:

| Label | Criteria | Color |
|-------|----------|-------|
| `🔴 Urgent-Reply` | Prospect in active deal + urgent keywords | Red |
| `🟠 Needs-Reply` | Prospect in pipeline, direct TO recipient | Orange |
| `🟡 Needs-Review` | Unknown sender with business keywords, potential lead | Yellow |
| `🔵 FYI` | CC'd, internal, informational only | Blue |
| `🟢 Meeting` | Calendar invites, scheduling threads | Green |
| `⚪ Waiting` | Emails Mat sent awaiting reply | White/Gray |
| `⚫ Low-Priority` | Newsletters, automated, promotional | Black/Gray |

## Priority Scoring Algorithm

```
Score = (Deal_Weight × 3) + (Recency × 2) + (Keywords × 2) + (Direct × 1)

Deal_Weight:
  - Contract stage: 10
  - Negotiation: 8
  - Proposal: 6
  - Discovery: 4
  - Qualification: 2
  - Not in pipeline: 1
  - Unknown: 0

Recency (hours since received):
  - <1 hour: 5
  - 1-4 hours: 4
  - 4-8 hours: 3
  - 8-24 hours: 2
  - >24 hours: 1

Keywords (additive):
  - "urgent", "asap", "immediately": +5
  - "contract", "agreement", "signature": +4
  - "proposal", "quote", "pricing": +3
  - "meeting", "call", "schedule": +2
  - "question", "help", "issue": +1

Direct:
  - TO recipient (not CC): +2
  - CC recipient: 0
```

**Thresholds:**
- Score ≥ 25: 🔴 Urgent-Reply
- Score 15-24: 🟠 Needs-Reply
- Score 8-14: 🟡 Needs-Review
- Score < 8: Classify by other criteria

## Sender Identification

### Step 1: Check if sender is in HubSpot
```
1. Extract sender email from message
2. Search HubSpot contacts by email
3. If found:
   - Get contact name, title, company
   - Get associated deals (if any)
   - Get deal stage for active deals
4. If not found:
   - Extract name from email signature
   - Check if company domain matches any HubSpot companies
   - Flag as "Unknown — potential lead" if business domain
```

### Step 2: Determine relationship
| Relationship | How to Identify | Default Priority |
|--------------|-----------------|------------------|
| Active prospect | Has open deal in HubSpot | High |
| Past prospect | Closed deal (won or lost) | Medium |
| Existing customer | Closed-won deal | High |
| Known contact, no deal | In HubSpot, no deals | Medium |
| Unknown, business domain | Not in HubSpot, corporate email | Medium |
| Unknown, personal domain | Gmail, Yahoo, etc. | Low |
| Automated/System | no-reply@, newsletters | Very Low |

## Automated Actions by Classification

| Classification | Immediate Action | Alert? | Draft? |
|----------------|------------------|--------|--------|
| 🔴 Urgent-Reply | Label, log, alert | YES — Immediate | YES |
| 🟠 Needs-Reply | Label, log | In briefing | YES |
| 🟡 Needs-Review | Label, log | In briefing | NO |
| 🔵 FYI | Label, archive | NO | NO |
| 🟢 Meeting | Label, check calendar | If conflict | If needed |
| ⚪ Waiting | Label (on sent emails) | If overdue | N/A |
| ⚫ Low-Priority | Label, archive | NO | NO |

## Keyword Detection Rules

### Urgent Keywords (trigger immediate alert):
- urgent, asap, immediately, time-sensitive
- contract, agreement, signature, DocuSign, sign
- cancel, issue, problem, broken, escalate
- CEO, executive, board (sender role mentions)

### Scheduling Keywords (trigger calendar check):
- meeting, call, schedule, calendar
- available, availability, free time
- let's connect, catch up, sync
- book, slot, time works

### Sales Keywords (boost priority):
- proposal, quote, pricing, cost
- demo, trial, pilot, POC
- decision, timeline, budget
- competitor names

### Auto-Archive Signals:
- unsubscribe link present
- "no-reply@" or "noreply@" sender
- Known newsletter patterns
- Marketing/promotional language with no personal content

## Duplicate/Thread Handling

- If email is part of existing thread, don't re-classify — keep original label
- Update thread if new message changes priority (e.g., urgent keyword added)
- Consolidate multiple emails from same sender in briefing (don't list 5 separately)

## Edge Cases

### Multiple Recipients
- If Mat is in TO with others: Still classify normally
- If Mat is only in CC: Likely FYI unless keywords override

### Forwarded Emails
- Check original sender, not forwarder
- If forwarded by internal team: Check for action request in forward note

### Auto-Replies (OOO)
- Detect "out of office", "automatic reply", "away from"
- Don't create drafts for these
- Update Waiting list if Mat was awaiting reply from this person

### Empty/Minimal Emails
- Emails with only attachments: Flag for review, check attachment names
- One-word replies ("Thanks", "Got it"): FYI, no action needed
- "?" or minimal responses: May need clarification, flag

## Output Format

### For Each Processed Email:
```
{
  "message_id": "...",
  "thread_id": "...",
  "from": "name@email.com",
  "from_name": "John Smith",
  "subject": "...",
  "received": "2024-01-15T10:30:00Z",
  "classification": "🟠 Needs-Reply",
  "priority_score": 18,
  "hubspot_contact_id": "123456" or null,
  "deal_id": "789" or null,
  "deal_stage": "Proposal" or null,
  "keywords_detected": ["proposal", "pricing"],
  "action": "draft_created" or "logged_only",
  "draft_id": "..." or null
}
```

### For Briefing Summary:
```
Inbox Processed: [count] emails

🔴 Urgent (immediate action): [count]
   • [Sender] — [Subject preview] — [Deal if any]
   
🟠 Need Reply: [count]
   • [List top 5 by priority score]
   
🟡 Review: [count]
🔵 FYI: [count] (archived)
⚫ Low Priority: [count] (archived)

Drafts created: [count]
```

## Error Handling

| Error | Handling |
|-------|----------|
| Gmail API rate limit | Wait and retry, log delay |
| HubSpot lookup timeout | Classify with email-only context, note "HubSpot unavailable" |
| Unknown encoding | Try common encodings, flag if unreadable |
| Very long email | Truncate for classification, full text available for drafting |
