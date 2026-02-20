# 🦞 Clawd Email Agent — Full Specification

## Overview

This agent replicates and exceeds the functionality of Jace.ai using your existing integrations. Unlike Jace (Gmail-only), this agent combines email intelligence with CRM context, meeting transcripts, and proactive research.

**Core Principle:** Drafts only. Never send. Always notify via Telegram.

---

## Feature Mapping: Jace.ai → Clawd

| Jace.ai Feature | Clawd Implementation | Enhancement |
|-----------------|---------------------|-------------|
| AI email drafting in your voice | Gmail API + Tone Guide | + HubSpot deal context |
| Smart inbox labeling | Gmail labels via API | + Pipeline-aware priority |
| Calendar-aware scheduling | Google Calendar integration | + Avoma meeting history |
| Context from attachments | Google Drive file access | + Full Drive search |
| Proactive draft creation | Cron jobs + Telegram alerts | + CRM trigger awareness |
| Natural language email search | Gmail search + NLP | + Cross-system queries |
| Rule-based automation | Configurable rule engine | + Deal stage triggers |
| Meeting scheduling in replies | Calendar availability check | + Avoma context injection |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLAWD EMAIL AGENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Gmail   │  │ Calendar │  │  Drive   │  │     HubSpot      │ │
│  │  (OAuth) │  │  (OAuth) │  │  (OAuth) │  │    (API/PAT)     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                  │           │
│       └─────────────┴─────────────┴──────────────────┘           │
│                              │                                   │
│                     ┌────────▼────────┐                          │
│                     │  INTELLIGENCE   │                          │
│                     │     LAYER       │                          │
│                     │  • Tone Guide   │                          │
│                     │  • Rules Engine │                          │
│                     │  • Priority     │                          │
│                     └────────┬────────┘                          │
│                              │                                   │
│       ┌──────────────────────┼──────────────────────┐            │
│       │                      │                      │            │
│       ▼                      ▼                      ▼            │
│  ┌─────────┐          ┌─────────────┐        ┌──────────┐        │
│  │ Drafts  │          │  Telegram   │        │  Sheets  │        │
│  │ Folder  │          │   Alerts    │        │   Log    │        │
│  └─────────┘          └─────────────┘        └──────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### 1. Intelligent Inbox Triage

**What it does:** Scans inbox and categorizes every email by urgency and required action.

**Labels to Apply:**

| Label | Criteria | Action |
|-------|----------|--------|
| 🔴 `Needs-Reply-Urgent` | From prospect in active deal + keywords (urgent, asap, contract, signed) | Draft immediately, Telegram alert |
| 🟠 `Needs-Reply` | From prospect in pipeline, direct TO (not CC) | Draft reply, add to daily briefing |
| 🟡 `Needs-Review` | From unknown sender with business keywords | Flag for your review, no draft |
| 🔵 `FYI` | CC'd emails, internal updates | No action, just organize |
| ⚪ `Waiting` | Emails you sent that haven't been replied to | Track for follow-up |
| 🟢 `Meeting-Related` | Calendar invites, scheduling threads | Check calendar, draft if needed |
| ⚫ `Low-Priority` | Newsletters, automated, promotional | Auto-archive or ignore |

**Priority Scoring Formula:**
```
Priority = (Deal Stage Weight × 3) + (Recency × 2) + (Keyword Triggers × 2) + (Direct TO vs CC)

Deal Stage Weights:
- Contract: 10
- Negotiation: 8
- Proposal: 6
- Discovery: 4
- Qualification: 2
- Not in pipeline: 1
```

---

### 2. Context-Aware Draft Generation

**What it does:** Creates draft replies that sound like you, with full context from all systems.

**Context Sources (in order of priority):**
1. **Thread history** — Full email conversation
2. **HubSpot deal record** — Stage, notes, last activity, deal value
3. **HubSpot contact record** — Title, company, previous interactions
4. **Avoma transcripts** — Last meeting summary, key points discussed, objections raised
5. **Calendar** — Your availability for next 2 weeks
6. **Google Drive** — Relevant attachments or docs mentioned
7. **Research Cache** — Cached LinkedIn/ZoomInfo data if available

**Draft Structure:**
```
Subject: Re: [Original Subject]

[Opening - personalized based on context]

[Body - addresses their questions/requests using Tone Guide]

[If scheduling needed: availability block from Calendar]

[Closing - matches your style]

[Signature]
```

**Tone Guide Integration:**
- Agent references `/path/to/tone-guide.md` for every draft
- Matches your sentence structure, formality level, sign-offs
- Avoids phrases you never use
- Includes phrases you commonly use

---

### 3. Proactive Email Monitoring

**What it does:** Continuously monitors for situations requiring your attention.

**Trigger Events → Telegram Alerts:**

| Trigger | Detection Method | Alert Message |
|---------|-----------------|---------------|
| High-priority reply needed | Inbox scan + priority scoring | "🔴 [Name] from [Company] needs a reply — draft ready" |
| Deal moved to new stage | HubSpot webhook/poll | "📊 [Deal] moved to [Stage] — check for follow-up needs" |
| Meeting in 45 min | Calendar scan | "📅 Meeting with [Name] in 45 min — Battle Card ready" |
| No response to your email (3+ days) | Sent folder scan | "⏰ No reply from [Name] in 3 days — follow-up draft ready" |
| Important attachment received | Inbox scan | "📎 [Name] sent [filename] — review needed" |
| Scheduling request detected | NLP on incoming email | "🗓️ [Name] wants to schedule — availability draft ready" |
| Urgent keywords detected | Keyword scan | "⚠️ Urgent email from [Name] — '[keyword]' detected" |

---

### 4. Smart Meeting Scheduling

**What it does:** Detects scheduling requests and creates drafts with your availability.

**Detection Phrases:**
- "let's find time"
- "are you free"
- "can we schedule"
- "when works for you"
- "set up a call"
- "book a meeting"

**Draft Generation:**
```
[Greeting]

[Acknowledge their request]

Here are some times that work on my end:

• [Day], [Date] at [Time] PT
• [Day], [Date] at [Time] PT
• [Day], [Date] at [Time] PT

Let me know what works best, or feel free to grab time here: [calendar link if you have one]

[Closing]
```

**Calendar Rules:**
- Only offer times during business hours (your preference)
- Buffer 15 min before/after existing meetings
- Don't offer times with existing holds/blocks
- Prefer mornings/afternoons (configurable)
- Limit to next 10 business days unless they specify further out

---

### 5. Natural Language Email Queries

**What it does:** Answer questions about your email history via Telegram.

**Example Queries:**
- "What did [Name] say about pricing?"
- "Find the last email from [Company]"
- "What's pending with [Deal Name]?"
- "When did I last email [Contact]?"
- "What attachments did [Name] send?"

**Query Processing:**
1. Parse intent and entities from query
2. Search Gmail with constructed query
3. Cross-reference with HubSpot for deal context
4. Return summary + link to thread

---

### 6. Rule-Based Automation

**What it does:** Execute predefined rules without asking.

**Default Rules:**

| Rule | Trigger | Action |
|------|---------|--------|
| Auto-archive newsletters | From known newsletter senders | Apply `Low-Priority` label, archive |
| Flag competitor mentions | Email contains competitor names | Alert via Telegram |
| Detect meeting no-shows | Calendar event passed + no Avoma transcript | Create follow-up draft |
| Track proposal opens | (If tracking available) Proposal viewed | Alert + prep follow-up draft |
| Escalate contract emails | Keywords: contract, agreement, signature, DocuSign | Immediate Telegram alert |

**Custom Rules (configurable):**
```yaml
rules:
  - name: "VIP sender alert"
    trigger: 
      from_contains: ["ceo@", "investor@", specific emails]
    action: 
      alert: immediate
      priority: urgent
      
  - name: "Auto-decline recruiters"
    trigger:
      subject_contains: ["opportunity", "role", "position"]
      from_domain: ["linkedin.com", recruiting domains]
    action:
      label: "Low-Priority"
      # No draft - you specified drafts only for things you want to respond to
      
  - name: "Intro request handling"
    trigger:
      subject_contains: ["intro", "introduction", "meet"]
    action:
      alert: normal
      draft: true
      template: "intro_response"
```

---

### 7. Follow-Up Tracking

**What it does:** Tracks emails you've sent and alerts when follow-up is needed.

**Tracking Logic:**

| Scenario | Days Without Reply | Action |
|----------|-------------------|--------|
| Sent to prospect in Contract stage | 2 days | Alert + draft follow-up |
| Sent to prospect in Negotiation | 3 days | Alert + draft follow-up |
| Sent to prospect in Proposal | 4 days | Alert + draft follow-up |
| Sent to prospect in Discovery | 5 days | Alert + draft follow-up |
| Sent to prospect in Qualification | 7 days | Alert + draft follow-up |
| Sent to non-prospect | 7 days | Log only, no alert |

**Follow-Up Draft Variations:**
- First follow-up: Gentle bump
- Second follow-up: Add value/new angle
- Third follow-up: Direct ask or breakup

---

### 8. Thread Summarization

**What it does:** Summarizes long email threads on demand or automatically.

**Auto-Summarize Triggers:**
- Thread has 5+ messages
- Thread spans 7+ days
- You're CC'd on a long thread

**Summary Format:**
```
📧 Thread Summary: [Subject]

Participants: [Names]
Started: [Date] | Last message: [Date]

Key Points:
• [Point 1]
• [Point 2]
• [Point 3]

Open Questions/Action Items:
• [Item 1]
• [Item 2]

Your Required Action: [None / Reply needed / Review only]
```

---

## Cron Schedule

| Job | Schedule | What It Does |
|-----|----------|--------------|
| **Morning Briefing** | 7:00 AM PT, Mon-Fri | Full inbox scan, priority drafts, daily summary to Telegram + Sheet |
| **Continuous Monitor** | Every 30 min, 8 AM-6 PM | Check for urgent emails only, alert if 🔴 priority |
| **Pre-Meeting Prep** | 45 min before each meeting | Battle Card to Telegram with email history + Avoma context |
| **Follow-Up Check** | 9:00 AM PT, Mon-Fri | Scan sent folder, identify stale threads, create follow-up drafts |
| **End of Day Digest** | 5:00 PM PT, Mon-Fri | Summary of what's pending, what drafts are ready |
| **Weekly Research Batch** | Sunday 8 PM PT | Pre-research all contacts for upcoming week's meetings |

---

## Telegram Message Formats

### Morning Briefing
```
☀️ Morning Briefing — [Day], [Date]

📬 INBOX STATUS
• 3 need reply (2 drafts ready)
• 1 urgent from [Name]
• 12 FYI/low-priority (auto-organized)

📅 TODAY'S MEETINGS
• 10:00 AM — [Name] @ [Company] (Battle Card ready)
• 2:00 PM — [Name] @ [Company] (prep at 1:15)

⏰ FOLLOW-UPS NEEDED
• [Name] — no reply in 4 days (draft ready)
• [Name] — proposal sent 3 days ago

📝 DRAFTS AWAITING REVIEW: 4
→ Check Gmail Drafts folder

Full details in Sheet: [link]
```

### Urgent Alert
```
🔴 URGENT: Reply Needed

From: [Name] ([Title])
Company: [Company] — [Deal Stage]
Subject: [Subject]

Preview: "[First 100 chars...]"

Context: Last talked [date] about [topic from Avoma]

✅ Draft ready in Gmail
```

### Pre-Meeting Prep
```
📅 Meeting in 45 min: [Name] @ [Company]

DEAL STATUS
• Stage: [Stage]
• Value: $[Amount]
• Last activity: [Date] — [Activity]

LAST MEETING ([Date])
• Discussed: [Key points from Avoma]
• Their concerns: [Objections]
• You promised: [Action items]

EMAIL HISTORY
• Last email: [Date] — [Subject]
• Open threads: [Count]

RESEARCH
• Title: [Current title]
• LinkedIn: [Recent activity if cached]
• News: [Company news if any]
```

---

## Data Storage (Google Sheet)

### Tab: Today
| Column | Description |
|--------|-------------|
| Time | When item was logged |
| Type | Email / Meeting / Follow-up / Alert |
| Priority | 🔴🟠🟡🔵 |
| From/Contact | Name + Company |
| Subject/Topic | Email subject or meeting topic |
| Deal Stage | From HubSpot |
| Status | Pending / Draft Ready / Done |
| Action Needed | What you need to do |
| Draft Link | Link to Gmail draft |

### Tab: Email Log
| Column | Description |
|--------|-------------|
| Date | When processed |
| Email ID | Gmail message ID |
| From | Sender |
| Subject | Subject line |
| Classification | Label applied |
| Priority Score | Calculated score |
| Draft Created | Yes/No |
| Your Action | What you did |
| Response Time | How long to respond |

### Tab: Research Cache
| Column | Description |
|--------|-------------|
| Contact Email | Primary key |
| Name | Full name |
| Title | Job title |
| Company | Company name |
| LinkedIn URL | Profile link |
| Last Researched | Date |
| Data Source | ZoomInfo / LinkedIn |
| Notes | Key findings |
| Cache Expires | Date to refresh |

### Tab: Rules
| Column | Description |
|--------|-------------|
| Rule Name | Identifier |
| Trigger Type | From / Subject / Keyword / Domain |
| Trigger Value | What to match |
| Action | Label / Alert / Draft / Archive |
| Active | Yes/No |

---

## Tone Guide Integration

The agent references your tone guide stored at a known location. Key elements it extracts:

```yaml
tone_guide:
  formality: "professional but warm"
  
  opening_patterns:
    - "Hey [First Name],"
    - "Hi [First Name],"
    # Never: "Dear", "To whom it may concern"
    
  closing_patterns:
    - "Best,"
    - "Talk soon,"
    # Never: "Regards", "Sincerely"
    
  phrases_to_use:
    - "Happy to..."
    - "Let me know if..."
    - "Quick question —"
    
  phrases_to_avoid:
    - "I hope this email finds you well"
    - "Per my last email"
    - "Just circling back"
    - "Touching base"
    
  sentence_style:
    - "Short paragraphs"
    - "Direct but not blunt"
    - "Use contractions"
    
  signature: |
    Mat
    Craftable | Sales Development
    [phone if appropriate]
```

---

## Error Handling

| Failure | Response |
|---------|----------|
| Gmail API down | Telegram: "⚠️ Gmail unreachable — skipping inbox scan. Will retry in 30 min." |
| Gmail auth expired | Telegram: "🔐 Gmail auth expired — please re-authenticate. [Instructions]" |
| HubSpot API down | Continue with email-only context, note in draft: "[HubSpot unavailable]" |
| Calendar unavailable | Don't include availability, note: "Calendar check failed — add times manually" |
| Draft creation fails | Telegram: "❌ Failed to create draft for [email]. Error: [details]" |
| Rate limit hit | Back off, alert if critical email missed |

---

## Privacy & Safety Rules

1. **Never send emails** — Drafts only, always
2. **Never delete emails** — Label and archive only
3. **Never modify sent emails** — Read-only on sent folder
4. **Alert on sensitive content** — Flag emails containing SSN, credit card, passwords
5. **No external forwarding** — Never suggest forwarding to external addresses
6. **Audit trail** — Log all actions in Sheet
7. **Human approval required** — For any action beyond drafting and labeling

---

## Implementation Phases

### Phase 1: Foundation (Day 1-2)
- [ ] Set up Google Sheet with all tabs
- [ ] Configure Gmail label structure
- [ ] Test inbox scan and classification
- [ ] Create Morning Briefing cron
- [ ] Test Telegram message formatting
- [ ] Verify tone guide access

### Phase 2: Draft Intelligence (Day 3-4)
- [ ] Build context aggregation (Gmail + HubSpot + Calendar)
- [ ] Implement draft generation with tone guide
- [ ] Add Avoma transcript integration
- [ ] Test scheduling detection and availability insertion
- [ ] Create follow-up tracking logic

### Phase 3: Proactive Monitoring (Day 5-6)
- [ ] Implement continuous monitoring cron
- [ ] Build urgent email detection
- [ ] Add pre-meeting prep automation
- [ ] Create end-of-day digest
- [ ] Test all alert pathways

### Phase 4: Advanced Features (Week 2)
- [ ] Natural language query handling
- [ ] Thread summarization
- [ ] Custom rule configuration
- [ ] Research cache integration (browser batch jobs)
- [ ] Performance tuning based on your feedback

### Phase 5: Learning & Optimization (Ongoing)
- [ ] Weekly tone guide refinement from sent emails
- [ ] Adjust priority scoring based on your actual responses
- [ ] Tune alert frequency to avoid noise
- [ ] Add new rules based on patterns you identify

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time spent on email | Reduce by 60%+ | Self-report |
| Draft accuracy | 80%+ sent without major edits | Track edits in sent vs draft |
| Urgent email response time | <2 hours | Log timestamps |
| Missed important emails | Zero | Weekly audit |
| False urgent alerts | <2 per week | Track alert accuracy |
| Meeting prep coverage | 100% | Confirm Battle Cards sent |

---

## Quick Reference: Telegram Commands

The agent responds to these commands via Telegram:

| Command | What It Does |
|---------|--------------|
| `status` | Current inbox summary |
| `drafts` | List pending drafts |
| `search [query]` | Search email history |
| `summarize [email ID or subject]` | Get thread summary |
| `schedule [contact]` | Get availability for specific contact |
| `refresh` | Force re-scan of inbox |
| `pause` | Stop alerts for 2 hours |
| `resume` | Resume alerts |

---

## Appendix: Integration Details

### Gmail Scopes Required
- `gmail.readonly` — Read messages and threads
- `gmail.modify` — Apply labels, create drafts
- `gmail.labels` — Manage labels

### HubSpot Access Required
- Contacts: Read
- Deals: Read
- Notes: Read
- Activities: Read

### Calendar Access Required
- Events: Read
- FreeBusy: Read

### Google Drive Access Required
- Files: Read (for attachment context)
- Search: Read

### Avoma Access Required
- Meetings: Read
- Transcripts: Read
- Notes: Read

---

*Last Updated: [Date]*
*Version: 1.0*
