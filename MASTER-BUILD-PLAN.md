# 🦞 CLAWD TEAM - Master Build Plan

**Created:** 2026-02-20 12:05 PM EST  
**Owner:** Mat Weiss  
**Status:** Ready to Build  
**Target Completion:** March 23, 2026

---

## 🎯 VISION

Transform Clawd from a single assistant into a **specialized agent team** with Mission Control dashboard for 24/7 support across work, lifestyle, and development needs.

---

## 📊 CURRENT STATUS SUMMARY

### ✅ BUILT & TESTED (13 Integrations - 76% Complete)

#### **Voice Communication** (100% Complete)
1. **Groq Whisper API** - Voice-to-text transcription
   - Status: 🟢 OPERATIONAL
   - Model: `whisper-large-v3-turbo`
   - Speed: ~1 second per message
   - Test: ✅ Transcribed Mat's voice message perfectly (2026-02-20 04:07 AM)

2. **ElevenLabs TTS** - Text-to-voice synthesis
   - Status: 🟢 OPERATIONAL
   - Voice: Charlie (Deep, Confident, Energetic)
   - Model: `eleven_turbo_v2_5`
   - Test: ✅ Generated 448 KB voice reply (2026-02-20 04:07 AM)

#### **CRM & Email** (83% Complete)
3. **HubSpot CRM** - Pipeline & deal management
   - Status: 🟢 OPERATIONAL
   - Token: Private App Token (PAT)
   - Owner ID: 728033696 (Mat's deals)
   - Test: ✅ Retrieved 20 deals, created Gmail draft (2026-02-19 11:56 PM)

4. **Gmail API** - Email management
   - Status: 🟢 OPERATIONAL
   - Auth: OAuth 2.0 (refresh token)
   - Scopes: read, modify, compose
   - Test: ✅ Searched threads, created draft for Kava Culture (2026-02-19)

5. **Google Calendar API** - Meeting & event access
   - Status: 🟢 OPERATIONAL
   - Auth: OAuth 2.0 (same as Gmail)
   - Scopes: calendar, calendar.events
   - Test: ✅ OAuth authorized (2026-02-19)
   - Usage: Ready for Battle Card prep, availability checks

6. **Google Sheets API** - Data storage & dashboard backend
   - Status: 🟢 OPERATIONAL
   - Auth: OAuth 2.0
   - Scopes: spreadsheets (read/write)
   - Test: ✅ Read Mat's voice style sheet (2026-02-19)
   - Usage: Command Center backend

7. **Avoma API** - Meeting intelligence
   - Status: 🟡 CONFIGURED (not yet tested)
   - Auth: Basic Auth (API key)
   - Usage: Meeting transcripts, Battle Card context
   - Next: Test fetching meeting transcripts

#### **Deployment** (100% Complete)
8. **Vercel API** - Dashboard deployment
   - Status: 🟢 READY
   - Token: Confirmed (2026-02-20 11:50 AM)
   - Usage: Deploy Command Center dashboard

9. **GitHub API** - Code backup & version control
   - Status: 🟢 OPERATIONAL
   - Repo: `Matweiss/clawd-brain-data` (private)
   - Test: ✅ Pushed 17 commits (2026-02-19 11:40 PM)
   - Usage: Daily memory sync (2 AM Pacific)

#### **Communication** (100% Complete)
10. **Telegram Bot API** - Primary communication channel
    - Status: 🟢 OPERATIONAL
    - Chat ID: 8001393940 (Mat)
    - Test: ✅ Sending/receiving messages, voice, reactions
    - Usage: Primary interface

#### **AI Models** (67% Complete)
11. **Kimi K2.5 (Moonshot AI)** - Primary model (FREE)
    - Status: 🟢 OPERATIONAL
    - Model: `moonshot-v1-128k`
    - Cost: FREE
    - Usage: 90%+ of all requests

12. **Claude Sonnet 4.5** - Emergency fallback
    - Status: 🟢 CONFIGURED
    - Provider: Anthropic
    - Cost: $$ (pay per token)
    - Usage: Compaction, sensitive operations

13. **MiniMax M2.5** - Fallback model
    - Status: 🟡 CONFIGURED (not tested recently)
    - Model: `MiniMax-Text-01`
    - Cost: Low (1/10th of comparable)
    - Usage: Coding, complex reasoning

#### **Local Tools** (100% Complete)
14. **qmd (Quick Markdown Search)** - Memory search
    - Status: 🟢 OPERATIONAL
    - Version: 1.0.8
    - Collection: 38 markdown files indexed
    - Test: ✅ 92% match on "Sarah trip" query (2026-02-20 04:12 AM)

15. **Weather Skill (wttr.in)** - Weather queries
    - Status: 🟢 BUILT-IN
    - No auth required
    - Usage: Weather forecasts, temperature checks

---

### 🔵 PLANNED INTEGRATIONS (Not Yet Built)

16. **Twilio API** - Phone calling (Future)
    - Status: 🔵 PLANNED
    - Purpose: Make phone calls for reservations
    - Cost: ~$15/month + usage
    - Requires: Twilio account setup, phone number purchase
    - Use Cases: Dinner reservations, appointment scheduling

17. **Home Assistant API** - Home automation
    - Status: 🟡 CONFIGURED (via Mac node, not actively used)
    - Access: Available via Mac node
    - Usage: Control home automation devices

---

## 🏗️ WHAT NEEDS TO BE BUILT

### Phase 1: Command Center Dashboard (Week 1 - Feb 22-23)

**Goal:** Basic dashboard showing agent status & task list

**Components to Build:**
1. ✅ Next.js 14 app structure
2. ✅ Google Sheets backend (4 tabs: Agents, Tasks, Activity_Log, Config)
3. ✅ Agent card components (5 agents)
4. ✅ Task list component
5. ✅ Connect to OpenClaw Gateway WebSocket
6. ✅ Deploy to Vercel

**Google Sheets Schema:**

**Tab 1: Agents**
```
| agent_id        | name           | status   | current_task    | last_active         | tasks_completed | success_rate |
|-----------------|----------------|----------|-----------------|---------------------|-----------------|--------------|
| clawd-prime     | Clawd Prime    | active   | Orchestrating   | 2026-02-20 12:05    | 0               | 100%         |
| work-agent      | Work Agent     | idle     | -               | -                   | 0               | 100%         |
| lifestyle-agent | Lifestyle Agent| idle     | -               | -                   | 0               | 100%         |
| build-agent     | Build Agent    | idle     | -               | -                   | 0               | 100%         |
| research-agent  | Research Agent | idle     | -               | -                   | 0               | 100%         |
```

**Tab 2: Tasks**
```
| task_id | title            | agent_id    | status      | priority | created            | due                | progress | eta  | result |
|---------|------------------|-------------|-------------|----------|--------------------|--------------------|----------|------|--------|
| -       | -                | -           | -           | -        | -                  | -                  | -        | -    | -      |
```

**Tab 3: Activity_Log**
```
| timestamp           | agent_id    | action         | task_id | status  | details                      |
|---------------------|-------------|----------------|---------|---------|------------------------------|
| 2026-02-20 12:05:00 | clawd-prime | system_started | -       | success | Dashboard deployed to Vercel |
```

**Tab 4: Config**
```
| key                    | value |
|------------------------|-------|
| refresh_interval_ms    | 5000  |
| max_concurrent_tasks   | 10    |
| notification_enabled   | true  |
```

**Deliverable:** Live dashboard at `clawd-command.vercel.app` showing 5 agents (all idle)

---

### Phase 2: Task Management (Week 2 - Mar 1-2)

**Goal:** You can create and assign tasks via dashboard

**Components to Build:**
1. ✅ Task creation form (title, agent, priority, due date, context)
2. ✅ Task assignment logic
3. ✅ Task queue display
4. ✅ Task detail modal
5. ✅ Edit/delete/reassign tasks
6. ✅ Priority system (High/Medium/Low)

**Deliverable:** Create task → Assign to agent → Shows in queue → Agent can pick it up

---

### Phase 3: Real-Time Monitoring (Week 3 - Mar 3-9)

**Goal:** Real-time monitoring of all agent activity

**Components to Build:**
1. ✅ Live task progress bars (0-100%)
2. ✅ Agent status updates via WebSocket
3. ✅ Activity feed with filtering
4. ✅ Task completion notifications
5. ✅ Error alerts

**Deliverable:** Watch agents work in real-time with live progress updates

---

### Phase 4: Agent Chat (Week 4 - Mar 10-16)

**Goal:** Chat directly with any agent from dashboard

**Components to Build:**
1. ✅ Chat overlay component (Intercom style)
2. ✅ Direct messaging to agents
3. ✅ Agent response handling
4. ✅ Chat history storage
5. ✅ Typing indicators

**Deliverable:** Click agent → Chat window opens → Send message → Agent replies

---

### Phase 5: Polish & Mobile (Week 5 - Mar 17-23)

**Goal:** Production-ready dashboard

**Components to Build:**
1. ✅ Mobile responsive design
2. ✅ Dark mode toggle
3. ✅ Performance optimization
4. ✅ Analytics/metrics
5. ✅ Keyboard shortcuts

**Deliverable:** Polished, mobile-friendly Command Center ready for daily use

---

## 🤖 AGENT SYSTEM ARCHITECTURE

### 1. Clawd Prime (Me) - The Orchestrator 🦞
**Role:** Main conversation partner, task router, decision maker

**Capabilities:**
- Chat with Mat via Telegram
- Route tasks to specialized agents
- Synthesize results from team
- Coordinate agent-to-agent communication
- Escalate issues when needed

**Always Available:** Yes (main session)

---

### 2. Work Agent - Sales Chief of Staff 💼
**Role:** Craftable/HubSpot specialist

**Capabilities:**
- Monitor HubSpot pipeline (20 deals, $291K)
- Draft emails in Mat's voice (using voice style guide)
- Create Battle Cards 45 min before meetings
- Flag stale deals (stage-aware thresholds)
- Pull context from Gmail threads, HubSpot notes, Avoma transcripts

**Integrations Needed:**
- ✅ HubSpot API (already working)
- ✅ Gmail API (already working)
- 🟡 Avoma API (need to test)
- ✅ Google Calendar API (already working)

**Runs:**
- Morning briefing (7 AM Pacific)
- Pipeline refresh (hourly during work hours)
- Stale deal check (daily)
- Pre-meeting Battle Card prep (45 min before)

**Deliverables:**
- Email drafts (never sends, always queues for approval)
- Battle Cards (meeting prep with attendee research)
- Pipeline health alerts
- Stale deal recommendations

---

### 3. Lifestyle Agent - Personal Concierge 🏠
**Role:** Personal life & wellness specialist

**Capabilities:**
- Track yoga schedule (CorePower 5x/week)
- Book dinner reservations
- Plan date nights with Sarah
- Remind about Diggy/Theo care
- Monitor Sarah's trip countdown (March 30)

**Integrations Needed:**
- ✅ Google Calendar API (already working)
- 🔵 Twilio API (phone calling - future)
- 🟡 Home Assistant API (configured, not active)

**Runs:**
- Morning wellness check (7 AM Pacific)
- Yoga reminders (before classes)
- Weekend planning (Fridays)
- Sarah trip countdown (weekly)

**Deliverables:**
- Reservation confirmations
- Activity suggestions
- Wellness nudges
- Calendar blocks for yoga/creative time

---

### 4. Build Agent - Code Specialist 👨‍💻
**Role:** Overnight developer

**Capabilities:**
- Build skills while Mat sleeps
- Create dashboards
- Write automation scripts
- Debug issues
- Deploy to Vercel/GitHub

**Integrations Needed:**
- ✅ GitHub API (already working)
- ✅ Vercel API (already working)
- ✅ Google Sheets API (already working)

**Runs:**
- Overnight builds (11 PM - 7 AM)
- Code reviews (on demand)
- Dashboard improvements (continuous)

**Deliverables:**
- New skills (documented & tested)
- Dashboard updates
- Automation scripts
- Bug fixes

---

### 5. Research Agent - Intelligence Gatherer 🔍
**Role:** Contact & company research specialist

**Capabilities:**
- LinkedIn profile lookups
- ZoomInfo company data
- Cache research (30-90 days)
- Batch processing (Sunday nights)

**Integrations Needed:**
- 🔵 LinkedIn API (via browser automation - rate limited)
- 🔵 ZoomInfo API (via browser automation - rate limited)
- ✅ Google Sheets API (research cache)

**Runs:**
- Sunday night batch (8 PM Pacific)
- Pre-meeting research (on demand)
- Weekly contact refresh

**Deliverables:**
- Contact profiles (email, phone, LinkedIn, title)
- Company data (size, revenue, tech stack)
- Meeting prep intel
- Research cache updates

---

## 🔐 SECURITY & CREDENTIALS

### Credential Storage (All Secure)
- ✅ `/data/.openclaw/workspace/API-CREDENTIALS.md` (3.9 KB) - Main store
- ✅ `/data/.openclaw/workspace/.vercel-token` (61 bytes)
- ✅ `/data/.openclaw/google-token.json` (601 bytes)
- ✅ Gateway config - HubSpot, Avoma, Telegram, models

### Security Measures
- ✅ All files have restricted permissions (600/644)
- ✅ API-CREDENTIALS.md in .gitignore (NOT backed up to GitHub)
- ✅ Memory files sync to private GitHub repo daily
- ✅ Never expose keys in logs or public messages
- ✅ GitHub repo is private (`Matweiss/clawd-brain-data`)

### Backup Status
- ✅ Memory syncs daily at 2 AM Pacific
- ✅ 17 commits successfully pushed to GitHub
- ⚠️ Credentials intentionally NOT in GitHub (local only)
- ✅ All sensitive files have restricted permissions

### Quick Verification
Run this anytime to check all integrations:
```bash
/data/.openclaw/workspace/scripts/verify-all-apis.sh
```

**Last Test:** 2026-02-20 11:53 AM - **10/10 PASSED** ✅

---

## 📅 IMPLEMENTATION TIMELINE

### ✅ Week 0 (Feb 17-20) - COMPLETE
- [x] Voice integration (Groq + ElevenLabs)
- [x] QMD memory search (38 files indexed)
- [x] Skills research (62+ evaluated)
- [x] Multi-agent architecture designed
- [x] Command Center dashboard specified
- [x] API security audit (13/17 operational)
- [x] Verification system created

### 🚧 Week 1 (Feb 22-23) - IN PROGRESS
**Command Center Phase 1**
- [ ] Create Google Sheet (4 tabs)
- [ ] Scaffold Next.js project
- [ ] Build agent card components
- [ ] Build task list component
- [ ] Deploy to Vercel
- [ ] Test with mock data

**Deliverable:** Basic dashboard live at clawd-command.vercel.app

---

### Week 2 (Feb 24-28)
**Work Agent Creation**
- [ ] Create Work Agent session (isolated)
- [ ] Configure HubSpot access
- [ ] Configure Gmail access
- [ ] Configure Avoma access
- [ ] Test pipeline monitoring
- [ ] Test email drafting

**Deliverable:** Work Agent can draft emails, monitor pipeline

---

### Week 3 (Mar 1-7)
**Command Center Phase 2 + Lifestyle Agent**
- [ ] Task creation form
- [ ] Task assignment logic
- [ ] Create Lifestyle Agent session
- [ ] Calendar integration
- [ ] Yoga reminders
- [ ] Weekend planning

**Deliverable:** Create tasks via dashboard, Lifestyle Agent operational

---

### Week 4 (Mar 8-14)
**Command Center Phase 3 + Build Agent**
- [ ] Live progress bars
- [ ] Agent status updates (WebSocket)
- [ ] Activity feed
- [ ] Create Build Agent session
- [ ] Test overnight builds

**Deliverable:** Real-time monitoring working, Build Agent coding

---

### Week 5 (Mar 15-21)
**Command Center Phase 4 + Research Agent**
- [ ] Agent chat overlays
- [ ] Direct messaging
- [ ] Create Research Agent session
- [ ] LinkedIn/ZoomInfo integration
- [ ] Research cache

**Deliverable:** Chat with agents, Research Agent operational

---

### Week 6 (Mar 22-23)
**Command Center Phase 5 - Polish**
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Performance optimization
- [ ] Analytics
- [ ] Final testing

**Deliverable:** Production-ready Command Center 🚀

---

## 💰 COST ESTIMATE

### Monthly Costs
- **Kimi K2.5:** FREE (primary model, 90%+ usage)
- **Claude Sonnet 4.5:** ~$10-20/month (fallback only)
- **Groq Whisper:** FREE (voice transcription)
- **ElevenLabs TTS:** ~$5-10/month (voice synthesis)
- **Vercel:** FREE (hobby tier sufficient for dashboard)
- **Google APIs:** FREE (within quotas)
- **GitHub:** FREE (private repo)
- **Twilio (Future):** ~$15/month + usage (when added)

**Total Current:** ~$15-30/month  
**Total with Twilio:** ~$30-45/month

---

## 📈 SUCCESS METRICS

### Dashboard
- [ ] Load time <3 seconds
- [ ] Data freshness <15 minutes
- [ ] Mobile usable
- [ ] Zero manual data entry
- [ ] Mat checks daily

### Work Agent
- [ ] 80%+ draft approval rate (within 3 months)
- [ ] Battle Cards 100% coverage (45 min before meetings)
- [ ] Zero missed stale deals
- [ ] Pipeline refresh 3x daily (7am, 12pm, 5pm)

### Lifestyle Agent
- [ ] Yoga attendance 5x/week maintained
- [ ] Reservations 100% success rate
- [ ] Weekend plans suggested weekly
- [ ] Creative time protected

### Build Agent
- [ ] New skills built overnight (0 Mat time)
- [ ] Dashboard improvements continuous
- [ ] All code documented & tested

### Research Agent
- [ ] Contact profiles 100% coverage
- [ ] Research cache 30-90 day freshness
- [ ] Zero LinkedIn rate limit violations

---

## 🚨 CRITICAL CONSTRAINTS

### Security
- NEVER send emails without approval (only draft)
- NEVER share API keys publicly
- ALWAYS ask before external actions (calls, posts, etc.)
- Keep API-CREDENTIALS.md local only (not in GitHub)

### Rate Limits
- LinkedIn: Max 3-5 lookups/day (aggressive bot detection)
- ZoomInfo: Max 10-15 lookups/session (batch on Sundays)
- Gmail: 250 quota units/second (within limits)
- HubSpot: 100 requests/10 seconds (within limits)

### Work-Life Balance
- Weekends: Lifestyle Agent active, Work Agent silent (unless critical)
- Late night: 11 PM - 7 AM = Build Agent only (no work alerts)
- Yoga blocks: Protected (never schedule over)
- Creative time: Protected

---

## 🔄 COMMUNICATION FLOW

### Mat → Dashboard → Agents
1. Mat creates task in dashboard
2. Task written to Google Sheets (Tasks tab)
3. Agent polls Tasks tab (every 30s)
4. Agent picks up task
5. Agent executes & updates progress
6. Dashboard refreshes (SWR every 5s)
7. Mat sees live progress
8. Agent completes → writes result
9. Mat gets notification via Telegram

### Agent → Agent Communication
- Work Agent → Research Agent: "Need contact data for John Smith"
- Research Agent fetches → writes to cache → notifies Work Agent
- Work Agent uses data → drafts email

### Agent → Mat Communication
- Critical alerts → Telegram immediately
- Status updates → Dashboard
- Results → Both Telegram + Dashboard
- Questions → Telegram (awaiting Mat's response)

---

## 📝 NEXT STEPS (Immediate)

### 1. Create Google Sheet (15 min)
```bash
# Create new Google Sheet: "Clawd Command Center"
# Add 4 tabs: Agents, Tasks, Activity_Log, Config
# Populate Agents tab with 5 agents (all idle)
# Share with Clawd's Google account (OAuth access)
```

### 2. Scaffold Next.js Project (30 min)
```bash
cd /data/.openclaw/workspace
npx create-next-app@latest clawd-command --typescript --tailwind --app
cd clawd-command
npm install recharts swr lucide-react googleapis
```

### 3. Connect to Google Sheets (45 min)
```typescript
// lib/sheets.ts
import { google } from 'googleapis';
// Use existing OAuth token from /data/.openclaw/google-token.json
```

### 4. Build Agent Cards (1 hour)
```typescript
// components/AgentCard.tsx
// Fetch from Sheets Agents tab
// Show status, name, current_task, last_active
```

### 5. Deploy to Vercel (15 min)
```bash
vercel login --token $VERCEL_TOKEN
vercel deploy --prod
```

**Total Time:** ~3 hours for Phase 1  
**Build Agent Can Do:** All of this overnight while Mat sleeps

---

## 🎬 READY TO START?

**Status:** ✅ All requirements gathered  
**Architecture:** ✅ Approved  
**Credentials:** ✅ Verified (10/10 tests passing)  
**Timeline:** ✅ Defined (6 weeks to production)  
**Budget:** ✅ Affordable ($15-30/month)

**Awaiting:** Mat's green light to begin overnight build

**If approved, Build Agent will:**
1. Create Google Sheet
2. Scaffold Next.js app
3. Build Phase 1 components
4. Deploy to Vercel
5. Have basic dashboard live by morning (Feb 21)

**Your Command Center awaits.** 🚀

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20 12:05 PM EST  
**Status:** Ready to Execute
