# Tools Reference — Clawd Email Agent

## Overview

This document defines how each integration should be used within the email agent workflows.

---

## Gmail

### Access Level
- Read messages and threads
- Create and modify drafts
- Apply and manage labels
- Search inbox
- **CANNOT**: Send emails, delete emails, modify sent messages

### Common Operations

#### Search Inbox
```
Query patterns:
- is:unread — All unread
- is:unread -category:promotions -category:social — Unread, excluding noise
- from:[email] — From specific sender
- to:me — Direct emails (not CC)
- after:YYYY/MM/DD — Recent emails
- subject:[keyword] — Subject search
- has:attachment — Has files attached
- in:sent after:YYYY/MM/DD — Sent emails for follow-up tracking
```

#### Create Draft
```
Required:
- to: recipient email
- subject: email subject (preserve "Re:" for replies)
- body: email content (plain text or HTML)

Optional:
- cc: additional recipients
- threadId: to attach to existing thread
```

#### Apply Labels
```
1. Check if label exists
2. Create if not: POST /users/me/labels
3. Apply to message: POST /users/me/messages/{id}/modify
   Body: { "addLabelIds": ["LABEL_ID"] }
```

### Rate Limits
- 250 quota units per user per second
- Batch requests when processing multiple emails
- Back off on 429 errors

---

## HubSpot

### Access Level
- Read contacts, companies, deals
- Read notes and activities
- Read deal pipeline and stages
- **CANNOT**: Create or modify records (read-only for safety)

### Common Operations

#### Look Up Contact by Email
```
Search contacts where email = [sender email]
Return: contact ID, name, title, company, associated deals
```

#### Get Deal Details
```
Get deal by ID
Return: deal name, stage, amount, close date, last activity, notes
```

#### Get Contact's Deal History
```
1. Get contact by email
2. Get associated deals
3. For each deal: get stage, notes, activities
```

### Data to Extract for Email Context

| Field | Use In Draft |
|-------|--------------|
| Contact first name | Greeting |
| Contact title | Tone calibration |
| Deal stage | Urgency assessment |
| Deal notes | Personalization ("You mentioned...") |
| Last activity date | Recency context |
| Deal amount | Importance weighting |

### Pipeline Stages Reference
```
0: Qualification (stale after 7 days)
1: Discovery (stale after 5 days)
2: Proposal (stale after 4 days)
3: Negotiation (stale after 4 days)
4: Contract (stale after 3 days)
```

---

## Google Calendar

### Access Level
- Read events
- Read free/busy information
- **CANNOT**: Create or modify events

### Common Operations

#### Get Availability
```
1. Query events for date range (next 10 business days)
2. Get free/busy blocks
3. Identify open slots during business hours
4. Apply buffer rules (15 min before/after meetings)
5. Return available slots
```

#### Check for Conflicts
```
Query: events where start >= [time] AND end <= [time]
If results: conflict exists
```

#### Get Today's Meetings
```
Query: events where date = today
Return: meeting title, time, attendees, location/link
```

### Business Hours Rules
```
Default: 9 AM - 6 PM PT, Monday-Friday
Exclude: Weekends, holidays
Buffer: 15 min before and after existing events
Preferred slot length: 30 min (unless context suggests otherwise)
```

### Meeting Detection for Prep
```
Every 15 min, check:
- Events starting in 45 min
- That haven't had Battle Card sent yet
- Where attendees include external contacts
```

---

## Avoma

### Access Level
- Read meetings
- Read transcripts
- Read AI notes/summaries
- **CANNOT**: Modify anything

### Common Operations

#### Find Meeting with Contact
```
1. Search meetings by attendee email
2. Sort by date (most recent first)
3. Return meeting ID for transcript lookup
```

#### Get Meeting Transcript/Summary
```
1. Get meeting by ID
2. Extract: summary, key points, action items
3. Look for: objections, concerns, commitments
```

### Data to Extract for Email Context

| Field | Use In Draft |
|-------|--------------|
| Meeting date | "When we spoke on [date]..." |
| Key discussion points | Reference specific topics |
| Their concerns/objections | Address proactively |
| Action items (theirs) | Follow up on |
| Action items (Mat's) | Confirm completion |
| Quotes/phrases they used | Mirror their language |

### Matching Meetings to Contacts
```
1. Get contact email from HubSpot or email thread
2. Search Avoma for meetings with that attendee
3. Get most recent meeting (or all if doing full history)
```

---

## Google Drive

### Access Level
- Read files
- Search files
- **CANNOT**: Create, modify, or delete

### Common Operations

#### Search for Related Documents
```
Query patterns:
- name contains '[company name]'
- name contains '[contact name]'
- name contains 'proposal' AND name contains '[company]'
- modifiedTime > 'YYYY-MM-DD'
```

#### Get Attachment Context
```
When email has attachment:
1. Note attachment filename and type
2. If PDF/Doc: Extract key details if possible
3. Include in context for draft
```

### Use Cases
- Find proposals sent to contact
- Find contracts or agreements
- Find meeting notes or docs shared
- Provide context about attached files

---

## Google Sheets

### Access Level
- Read and write
- Create and format

### Sheet Structure

#### Today Tab
```
| Time | Type | Priority | From/Contact | Subject | Deal Stage | Status | Action | Draft Link |
```

#### Email Log Tab
```
| Date | Email ID | From | Subject | Classification | Priority Score | Draft Created | Your Action | Response Time |
```

#### Research Cache Tab
```
| Contact Email | Name | Title | Company | LinkedIn | Last Researched | Source | Notes | Expires |
```

#### Rules Tab
```
| Rule Name | Trigger Type | Trigger Value | Action | Active |
```

### Operations

#### Log Email Processing
```
Append to Email Log:
- Timestamp
- Message details
- Classification assigned
- Priority score
- Actions taken
```

#### Update Today Tab
```
Clear previous day's items (or archive)
Add today's:
- Urgent emails
- Meetings
- Pending follow-ups
- Drafts awaiting review
```

#### Check/Update Research Cache
```
1. Query by contact email
2. If found and not expired: return cached data
3. If not found or expired: flag for research
```

---

## Telegram

### Access Level
- Send messages to Mat
- Receive commands from Mat

### Message Types

#### Urgent Alert
```
🔴 URGENT: [Brief description]

From: [Name] ([Title])
Company: [Company] — [Deal Stage]
Subject: [Subject]

Preview: "[First 100 chars]"

✅ Draft ready in Gmail
```

#### Morning Briefing
```
☀️ Morning Briefing — [Day], [Date]

📬 INBOX: [count] need reply ([count] drafts ready)
📅 MEETINGS: [count] today
⏰ FOLLOW-UPS: [count] overdue

[Brief list of top items]

Full details: [Sheet link]
```

#### Pre-Meeting Prep
```
📅 Meeting in 45 min: [Name] @ [Company]

[Deal status]
[Last meeting summary]
[Email history summary]
[Research notes]
```

#### Status Update
```
✅ [Action completed]
or
⚠️ [Issue encountered]
```

### Commands to Support

| Command | Response |
|---------|----------|
| `status` | Current inbox summary |
| `drafts` | List pending drafts |
| `search [query]` | Search results |
| `pause` | Stop alerts for 2 hours |
| `resume` | Resume alerts |
| `refresh` | Force inbox re-scan |

---

## Browser (ZoomInfo/LinkedIn)

### Access Level
- Automated browser control
- Logged into Mat's accounts
- **Rate limited and cached**

### Constraints
```
ZoomInfo:
- Max 5 lookups per session
- 30 sec timeout per lookup
- Cache results for 30 days (contacts) / 90 days (companies)

LinkedIn:
- Max 3 lookups per DAY (aggressive bot detection)
- Random delays (2-5 sec between actions)
- Stop immediately on CAPTCHA
- Cache results for 30 days
```

### Lookup Priority
```
1. Check Research Cache first
2. If not cached or expired:
   a. Try ZoomInfo (faster, more forgiving)
   b. LinkedIn only if ZoomInfo lacks needed data
3. Cache results immediately after lookup
```

### Data to Capture

| Field | Source Priority |
|-------|-----------------|
| Current title | ZoomInfo > LinkedIn |
| Company | ZoomInfo > LinkedIn |
| Company size | ZoomInfo |
| Recent job change | LinkedIn |
| Mutual connections | LinkedIn only |
| Contact info | ZoomInfo |

### Batch Research Workflow
```
Run: Sunday 8 PM PT (or night before)

1. Get all meetings scheduled for next week
2. For each external attendee:
   a. Check cache
   b. Queue for research if not cached
3. Process queue with rate limits
4. Update Research Cache
5. Log any failures for manual research
```

---

## Integration Patterns

### Email → HubSpot → Avoma Flow
```
1. Email received from sender@company.com
2. Look up sender in HubSpot → Get contact + deal
3. If deal exists, check for Avoma meetings with this contact
4. Aggregate context: email thread + deal notes + meeting transcript
5. Generate draft with full context
```

### Meeting Prep Flow
```
1. Calendar shows meeting with contact@company.com in 45 min
2. Look up contact in HubSpot → Get deal status
3. Search Gmail for recent threads with this contact
4. Get Avoma transcript from last meeting
5. Check Research Cache for LinkedIn/ZoomInfo data
6. Generate Battle Card
7. Send to Telegram
```

### Follow-Up Detection Flow
```
1. Scan sent folder for emails older than threshold
2. For each, check if reply exists in thread
3. If no reply:
   a. Look up contact in HubSpot
   b. Determine appropriate follow-up timing by deal stage
   c. Generate follow-up draft
   d. Log in Sheet
```
