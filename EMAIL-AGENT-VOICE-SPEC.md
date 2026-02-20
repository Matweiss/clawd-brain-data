# Email Agent — Voice & Context Requirements

**Date:** 2026-02-19  
**Priority:** CRITICAL — This is the #1 feature Mat wants

---

## Core Requirements

### 1. Voice Matching (Non-Negotiable)

**Mat's Communication Style:**
- **Tone:** Fun, informal, humorous — never stiff or corporate
- **Format:** Over-communicates, proactive, relentless follow-up
- **Style:** Uses voice memos, calls, pings — whatever it takes
- **Promptness:** Same-day replies to leads
- **Personality:** "People buy from who they like" — relationship-first approach

**Examples of Mat's Voice:**
- Opening: "Hey [Name]!" not "Dear [Name],"
- Closing: "Let me know!" not "Please advise"
- Tone: Conversational, like a friend texting
- Humor: Appropriate, light touches
- Energy: Enthusiastic but not salesy

**Voice Training Needed:**
1. Analyze Mat's sent emails from Gmail (last 50-100)
2. Extract patterns: greetings, sign-offs, phrase choices
3. Build style guide from actual examples
4. Test drafts against Mat's voice before sending to him

---

### 2. Context Assembly (Required Before Drafting)

**For EVERY draft, gather full context:**

#### From HubSpot (via API or association)
- **Deal history:**
  - Current stage
  - Deal value
  - Close date
  - Last activity date/type
  - Notes field
  - Custom properties (next steps, pain points, etc.)
- **Contact history:**
  - All associated emails (sent + received)
  - Phone call logs
  - Meeting notes
  - LinkedIn messages (if logged)
- **Company info:**
  - Industry, size, location
  - Competitive intel
  - Previous deals (won/lost)

#### From Gmail (via API)
- **Full email thread** for the conversation
  - Previous replies from Mat
  - Previous replies from prospect
  - Dates, context, commitments made
- **Related threads** with same contact/company

#### From Avoma (via API or HubSpot association)
- **Meeting transcripts** (last 3-5 meetings with contact/company)
  - Key discussion points
  - Questions asked by prospect
  - Commitments made by Mat
  - Commitments made by prospect
  - Pain points mentioned
  - Competitors discussed
  - Budget/timeline details
- **Action items** from meetings
  - What Mat said he'd do
  - What prospect said they'd do
  - Follow-up questions

#### From Calendar
- **Upcoming meetings** with contact
- **Past meetings** (dates, durations)

---

### 3. Meeting Follow-Up Protocol (Critical)

**When drafting a post-meeting follow-up:**

1. **Pull Avoma transcript** for that specific meeting
2. **Identify questions asked by prospect** during meeting
3. **Draft answers** to those questions in the email
4. **If uncertain about answer:**
   - Flag it in draft: `[QUESTION FOR MAT: Can Craftable integrate with X?]`
   - Send draft to Mat for review WITH the flagged questions highlighted
   - Mat reviews, answers questions, approves draft
5. **Summarize key takeaways** from meeting
6. **Reference specific commitments** made during meeting
7. **Propose next steps** based on meeting discussion

**Example Flow:**

```
Meeting at 2pm: Discovery call with Acme Corp
Topics discussed: Inventory pain points, budget timeline, competitor XYZ

Avoma transcript shows prospect asked:
- "Can Craftable integrate with our Toast POS?"
- "What's the typical implementation timeline?"
- "Do you have customers in the Portland area we can reference?"

Clawd drafts follow-up:
---
Subject: Re: Discovery Call — Next Steps

Hey John!

Great chatting with you today about Acme's inventory challenges. 
A few quick answers to your questions:

**Toast POS integration:** [QUESTION FOR MAT: Confirm Toast integration status]

**Implementation timeline:** Typically 30-45 days from contract to go-live. 
[QUESTION FOR MAT: Any recent faster implementations to reference?]

**Portland references:** [QUESTION FOR MAT: Which Portland customers can we share?]

As discussed, I'll send over the proposal by Friday. Let me know if 
you need anything else in the meantime!

Best,
Mat
---

Mat reviews draft → fills in answers → approves → Clawd creates Gmail draft
```

---

### 4. Craftable Product Knowledge (Build This)

**Mat needs to teach me about Craftable so I can answer questions accurately.**

**Initial Knowledge Capture Session:**

Create a knowledge base file: `CRAFTABLE-KNOWLEDGE.md`

**Topics to cover:**
1. **Core capabilities** — what does Craftable actually do?
2. **Integrations** — which POS systems, accounting tools, vendors?
3. **Implementation** — how long? what's the process?
4. **Pricing** — tiers, typical deal sizes
5. **ROI metrics** — savings percentages, time savings
6. **Competitive positioning** — vs Birchstreet, MarginEdge, BevSpot, etc.
7. **Customer stories** — which references to use for which use cases
8. **Common objections** — and how Mat typically addresses them

**Process:**
1. Mat provides initial brain dump (voice memo, doc, or Q&A session)
2. I organize into structured knowledge base
3. Reference this KB when drafting emails
4. Flag unknowns for Mat to fill in

---

### 5. Draft Review Flow

**NEVER send emails directly. ALWAYS draft for Mat's approval.**

**Standard Flow:**

```
1. Email arrives (classified as "Needs Reply")
   ↓
2. Clawd gathers context (HubSpot + Gmail + Avoma + Calendar)
   ↓
3. Clawd drafts reply in Mat's voice
   ↓
4. IF uncertain about any facts:
   - Flag with [QUESTION FOR MAT: ...]
   - List all questions at top of draft
   ↓
5. Create draft in Gmail (via API)
   ↓
6. Add task: "Review draft for [Contact] re: [Subject]"
   ↓
7. Notify Mat via Telegram:
   "📧 Draft ready: Reply to John @ Acme re: pricing question
    [View Draft] [Approve & Send] [Needs Changes]"
   ↓
8. Mat reviews:
   - Approves → Mat sends from Gmail (I don't send)
   - Requests changes → I revise and re-submit
   - Answers flagged questions → I update draft
```

---

### 6. Voice Training Data Collection

**To build Mat's voice model, I need:**

1. **50-100 sent emails from Mat** (export from Gmail)
2. **10-20 meeting transcripts** (export from Avoma)
3. **Mat's feedback on early drafts** (what feels right/wrong)

**Analysis to perform:**
- Greeting patterns (Hey, Hi, Hello + first name usage)
- Sentence length distribution
- Punctuation style (exclamation points, em-dashes, etc.)
- Paragraph structure (short vs long)
- Closing phrases
- Emoji usage (if any)
- Tone keywords (excited, helpful, consultative)

**Output:** Voice style guide I reference when drafting

---

### 7. Context Window Template

**For every draft, I should have this context loaded:**

```markdown
## Context for Draft to [Contact Name]

### Deal Info
- Company: [Name]
- Deal: [Name] — [Stage] — $[Amount]
- Last Activity: [Date] — [Type]
- Next Step: [From HubSpot]

### Recent Emails (Last 3)
- [Date]: [From] → [To]: [Subject] — [Summary]
- [Date]: [From] → [To]: [Subject] — [Summary]
- [Date]: [From] → [To]: [Subject] — [Summary]

### Recent Meetings (Last 2)
- [Date]: [Title] — [Duration]
  - Key Points: [Summary from Avoma]
  - Questions Asked: [List]
  - Commitments Made: [List]

### Current Email to Reply To
- From: [Name] <[Email]>
- Subject: [Subject]
- Date: [Date]
- Body: [Full text]

### Draft Approach
- Goal: [Answer question / Follow up / Move to next stage]
- Tone: [Helpful / Consultative / Closing]
- Key points to address: [List]
```

---

### 8. Questions for Mat (Initial Setup)

**Before I can draft effectively, I need:**

1. **Voice samples:**
   - Can you share 10-20 recent sent emails? (Export or forward to me)
   - Any specific phrases/greetings you always use?

2. **Craftable knowledge:**
   - Let's do a 15-30 min Q&A to build the knowledge base
   - Or record a voice memo covering key capabilities, integrations, ROI

3. **Access confirmation:**
   - HubSpot owner ID: 728033696 (confirmed)
   - Avoma: Is it linked to HubSpot deals? How do I find meeting notes?
   - Gmail: Do I have API access? (Need to test)

4. **Approval process:**
   - Telegram notifications for drafts OK?
   - Inline buttons: [Approve] [Revise] [Answer Questions]?

5. **Example scenario:**
   - Pick one recent email you sent
   - I'll draft a reply in your voice
   - You tell me what's off / what's right
   - Iterate until it feels authentic

---

## Next Steps

1. **Immediate:** Test API access to HubSpot, Gmail, Avoma
2. **Day 1:** Collect voice samples, build initial knowledge base
3. **Day 2:** Draft first test email, get Mat's feedback
4. **Day 3-5:** Iterate on voice, refine context gathering
5. **Week 2:** Go live with drafts for Mat's approval

---

**Mat's Mandate:** "Emails must feel personalized from my voice, with context from previous emails, meetings, etc."

**Clawd's Commitment:** I will NEVER send an email without your approval. Every draft will have full context. Every uncertainty will be flagged. Your voice will be preserved.
