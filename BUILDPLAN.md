# BUILD PLAN - Clawd's Roadmap to Maximum Impact

**Last Updated:** 2026-02-19  
**Status:** Ready to build — all APIs configured

---

## 🔑 **API Access (Confirmed Working)**

### **Google Workspace** ✅
- **Calendar** — Read/write events, detect conflicts
- **Gmail** — Read emails, create drafts (NO send permission)
- **Sheets** — Command Center V2 automation
- **Docs** — Draft proposals, notes, reports
- **Slides** — Create/update presentation decks
- **Forms** — Survey creation, response tracking
- **Drive** — File-level access

**Credentials:** `/data/.openclaw/google-token.json` + `/data/.openclaw/google-credentials.json`  
**Refresh Script:** `/data/.openclaw/workspace/scripts/google-refresh-token.sh`

### **HubSpot CRM** ✅
- **API Token:** `pat-na1-a249996e-eb7d-4184-841f-2759d28a8323`
- **Owner ID:** `728033696` (Mat's deals)
- **Access:** Deals, contacts, companies, notes
- **Location:** Stored in gateway config (`env.vars.HUBSPOT_TOKEN`)

### **Avoma (Meeting Intelligence)** ✅
- **API Key:** `vh82rab620:2ci8lvop8u5duwc4u680`
- **Access:** Call recordings, notes, transcripts, coaching
- **Location:** Stored in gateway config (`env.vars.AVOMA_API_KEY`)

### **ElevenLabs TTS** ✅
- **API Key:** `sk_20b35cd432e741e8f93429c78241d7d0d963810c22f27aaf`
- **Voice:** Charlie (IKne3meq5aSn9XLyUdCD) — Deep, Confident, Energetic
- **Script:** `/usr/local/lib/node_modules/openclaw/skills/elevenlabs/tts.sh`

### **Grok (Whisper AI - Transcription)** ✅
- **API Key:** `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`
- **Location:** Stored in gateway config (`env.vars.GROK_API_KEY`)

---

## 🎯 **HIGH-IMPACT BUILDS (Priority Order)**

### **1. HubSpot Pipeline Monitor** 🔥
**Impact:** Massive — stops deals from going stale  
**What it does:**
- Scans HubSpot deals daily
- Flags deals >7 days without activity
- Suggests next actions based on deal stage
- Outputs: Morning voice briefing or text summary

**Build Steps:**
1. Create `/data/.openclaw/workspace/scripts/hubspot-pipeline-monitor.py`
2. Hit HubSpot API: `GET /crm/v3/objects/deals` filtered by `ownerId=728033696`
3. Calculate days since `hs_lastmodifieddate`
4. Generate report: stale deals + suggested actions
5. Deliver via cron (7:30 AM PST daily) or on-demand

**Delivery:** Text summary or voice message via ElevenLabs

---

### **2. Gmail Auto-Drafter** 🔥
**Impact:** Massive — saves hours/week on follow-ups  
**What it does:**
- Templates for Mat's voice (warm, casual, ROI-focused)
- Auto-draft replies for common scenarios:
  - Demo follow-up
  - Pricing Q&A
  - Scheduling requests
  - Re-engagement (cold deals)

**Build Steps:**
1. Create `/data/.openclaw/workspace/scripts/gmail-drafter.py`
2. Store templates in `/data/.openclaw/workspace/templates/email/`
3. Gmail API: `POST /gmail/v1/users/me/drafts` (never send, only draft)
4. Manual trigger: "Draft a reply to [email subject]"

**Templates Needed:**
- `demo-followup.md` — Post-demo next steps
- `pricing-response.md` — ROI-focused pricing answers
- `scheduling.md` — Meeting availability
- `reengagement.md` — Revive cold leads

---

### **3. Avoma Meeting Prep (Battle Cards)** 🔥
**Impact:** High — Mat explicitly requested this  
**What it does:**
- Pull last meeting notes from Avoma
- Pull attendee LinkedIn profiles
- Pull HubSpot deal context
- Generate Battle Card 45min before every meeting

**Build Steps:**
1. Create `/data/.openclaw/workspace/scripts/meeting-prep.py`
2. Google Calendar API: detect upcoming meetings (next 2 hours)
3. Avoma API: pull last meeting notes for attendees
4. HubSpot API: pull deal context if linked
5. Format as text or Google Doc
6. Deliver via Telegram 45min before meeting (cron triggered by calendar)

**Output Format:**
```
🎯 BATTLE CARD: [Meeting Title]
⏰ Time: [Start Time]
👥 Attendees: [Names + Titles]
🏢 Company: [Name + Industry]
💼 Deal: [Stage + Amount]
📝 Last Notes: [Summary from Avoma]
🎯 Talking Points: [Suggested based on stage]
```

---

### **4. Command Center V2 (Google Sheets) Automation** 🔥
**Impact:** High — reduces manual spreadsheet work  
**What it does:**
- Auto-populate "Today" tab with calendar + tasks
- Update "Pipeline" tab with HubSpot deal health
- Flag "Stale Deals" (>7 days no activity)
- Populate "Research Cache" with LinkedIn/ZoomInfo data

**Build Steps:**
1. Create `/data/.openclaw/workspace/scripts/command-center-sync.py`
2. Google Sheets API: read/write to Command Center V2 spreadsheet
3. Sync sources:
   - Calendar → Today tab
   - HubSpot → Pipeline + Stale Deals tabs
   - Manual research → Research Cache
4. Run daily (morning cron) or on-demand

**Sheet ID:** [TBD — Mat to share]

---

### **5. Calendar Time-Blocking** 💪
**Impact:** Medium-High — protects focus time  
**What it does:**
- Analyze Google Calendar daily
- Detect back-to-back meetings (chaos days)
- Suggest time blocks for:
  - Yoga (5x/week, non-negotiable)
  - Creative time (weekly minimum)
  - Lunch breaks
  - Prospecting/admin work

**Build Steps:**
1. Create `/data/.openclaw/workspace/scripts/calendar-analyzer.py`
2. Google Calendar API: pull events for next 7 days
3. Detect patterns: >4 meetings in a row, no lunch break, yoga conflicts
4. Suggest blocks: "Your Tuesday is packed — want me to block 12-1 for lunch?"
5. Auto-decline/reschedule yoga conflicts (if Mat approves)

**Delivery:** Morning briefing or real-time alert

---

### **6. Daily Standup Automation** 💪
**Impact:** Medium — proactive morning context  
**What it does:**
- Morning briefing (7:30 AM PST):
  - Today's calendar
  - Stale HubSpot deals
  - Pending Gmail follow-ups
  - Yoga reminder (if scheduled)

**Build Steps:**
1. Create `/data/.openclaw/workspace/scripts/daily-standup.py`
2. Pull data:
   - Google Calendar (today's events)
   - HubSpot (deals needing attention)
   - Gmail (unread important emails)
3. Format as text or voice message
4. Deliver via cron (7:30 AM PST daily)

**Cron Job:**
```json
{
  "name": "Daily Standup",
  "schedule": {"kind": "cron", "expr": "30 7 * * *", "tz": "America/Los_Angeles"},
  "payload": {"kind": "agentTurn", "message": "Run daily standup script"},
  "delivery": {"mode": "announce", "channel": "telegram", "to": "8001393940"},
  "sessionTarget": "isolated"
}
```

---

### **7. LinkedIn Prospecting Helper** 💪
**Impact:** Medium — smart territory coverage  
**What it does:**
- Surface warm intro paths via LinkedIn
- Suggest connection requests with context
- Weekly: "3 warm intros available in your territory"

**Build Steps:**
1. Options:
   - **Option A:** ZoomInfo API (if Mat has access)
   - **Option B:** LinkedIn Sales Navigator CSV export (manual)
   - **Option C:** PhantomBuster/Apify scraping
2. Store prospects in `/data/.openclaw/workspace/data/prospects.json`
3. Cross-reference with HubSpot (avoid duplicates)
4. Weekly digest: top 3 warm intros

**Delivery:** Weekly voice/text summary

---

### **8. Stale Deal Re-Engagement** 💪
**Impact:** Medium — automate the nudge  
**What it does:**
- Detect deals >14 days without activity
- Auto-generate re-engagement messages
- Templates based on deal stage:
  - Demo scheduled but no show → "Still interested?"
  - Proposal sent but no response → "Any questions?"
  - Negotiation stalled → "Can I help move this forward?"

**Build Steps:**
1. HubSpot API: filter deals by stage + last activity
2. Generate personalized re-engagement draft (Gmail API)
3. Send to Mat for approval (never auto-send)

**Templates:** `/data/.openclaw/workspace/templates/reengagement/`

---

### **9. Yoga Block Protection** 🎯
**Impact:** Medium — enforce non-negotiables  
**What it does:**
- Detect meeting requests conflicting with yoga
- Auto-decline or suggest alternative times
- CorePower schedule: 5x/week (Yoga Sculpt, C2)

**Build Steps:**
1. Google Calendar API: detect yoga blocks
2. Monitor incoming meeting invites
3. If conflict detected:
   - Decline with message: "Mat has a standing commitment at this time"
   - Suggest alternative slots
4. Requires Mat's approval for auto-decline feature

**Yoga Schedule:** [TBD — Mat to share typical blocks]

---

### **10. Creative Time Guardian** 🎯
**Impact:** Medium — protect sacred time  
**What it does:**
- Track creative project time (Damien Lee projects, acting, comedy)
- Nudge if >1 week since last creative session
- Weekly reminder: "It's been 10 days since you worked on [project]"

**Build Steps:**
1. Manual logging or calendar block detection
2. Track via `/data/.openclaw/workspace/data/creative-log.json`
3. Weekly check: if no creative time logged, send reminder
4. Suggest scheduling time: "You're free Saturday afternoon — want to block it?"

**Delivery:** Weekly check-in (Sundays?)

---

## 🛠️ **NICE-TO-HAVE (Lower Priority)**

### **11. Sarah Surprise Planner**
- Suggest date nights, experiences, reservations
- OpenTable API + local event scraping
- Weekly: "You're free Saturday — want me to book [restaurant]?"

### **12. Proposal Generator (Google Docs)**
- Auto-draft proposals for deals
- Template: `/data/.openclaw/workspace/templates/proposals/craftable-proposal.md`
- Variables: Company name, deal size, ROI projection

### **13. Deck Builder (Google Slides)**
- Generate customer-facing decks
- Template: Craftable pitch deck
- Auto-populate: company name, pain points, ROI

---

## 🔄 **RECOVERY PLAN (If Session Lost)**

### **Critical Files to Restore:**
1. `/data/.openclaw/google-token.json` — Google API access
2. `/data/.openclaw/google-credentials.json` — OAuth credentials
3. `/data/.openclaw/workspace/BUILDPLAN.md` — This file
4. `/data/.openclaw/workspace/MEMORY.md` — Long-term memory
5. `/data/.openclaw/workspace/USER.md` — Mat's context
6. `/data/.openclaw/workspace/SOUL.md` — Clawd's identity
7. `/data/.openclaw/workspace/AGENTS.md` — Operating instructions

### **Gateway Config:**
- **Location:** `/data/.openclaw/openclaw.json`
- **API Keys Stored:**
  - HubSpot: `HUBSPOT_TOKEN`
  - Avoma: `AVOMA_API_KEY`
  - Grok: `GROK_API_KEY`

### **Skills Location:**
- **ElevenLabs TTS:** `/usr/local/lib/node_modules/openclaw/skills/elevenlabs/`

### **Scripts Location:**
- `/data/.openclaw/workspace/scripts/`

---

## 📊 **BUILDPLAN STATUS TRACKER**

| Skill/Tool | Priority | Status | Build Time | Dependencies |
|-----------|----------|--------|------------|--------------|
| Pipeline Monitor | 🔥 High | Not Started | 2-3 hours | HubSpot API |
| Gmail Auto-Drafter | 🔥 High | Not Started | 3-4 hours | Gmail API + Templates |
| Meeting Prep (Battle Cards) | 🔥 High | Not Started | 4-5 hours | Calendar + Avoma + HubSpot |
| Command Center V2 Sync | 🔥 High | Not Started | 3-4 hours | Sheets API + HubSpot |
| Calendar Time-Blocking | 💪 Medium | Not Started | 2-3 hours | Calendar API |
| Daily Standup | 💪 Medium | Not Started | 2-3 hours | Calendar + HubSpot + Gmail |
| LinkedIn Prospecting | 💪 Medium | Not Started | 3-4 hours | ZoomInfo or manual CSV |
| Stale Deal Re-Engagement | 💪 Medium | Not Started | 2-3 hours | HubSpot + Gmail |
| Yoga Block Protection | 🎯 Nice-to-Have | Not Started | 2-3 hours | Calendar API |
| Creative Time Guardian | 🎯 Nice-to-Have | Not Started | 1-2 hours | Manual logging |
| Sarah Surprise Planner | 🎯 Nice-to-Have | Not Started | 3-4 hours | OpenTable API |
| Proposal Generator | 🎯 Nice-to-Have | Not Started | 2-3 hours | Docs API + Templates |
| Deck Builder | 🎯 Nice-to-Have | Not Started | 2-3 hours | Slides API + Templates |

---

## 🚀 **NEXT STEPS**

1. **Mat confirms priority:** Which skill to build first?
2. **Clawd builds:** Script + test + deploy
3. **Mat tests:** Run it, provide feedback
4. **Iterate:** Fix bugs, adjust logic
5. **Deploy:** Set up cron jobs for automation
6. **Repeat:** Move to next skill

**Recommended Start:** Pipeline Monitor + Gmail Auto-Drafter (fastest ROI)

---

**Saved:** `/data/.openclaw/workspace/BUILDPLAN.md`  
**Backup:** Will sync to Clawd Brain (GitHub) at 2am PST daily
