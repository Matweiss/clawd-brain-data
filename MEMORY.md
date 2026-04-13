# MEMORY.md - Long-Term Memory

_Curated memories, lessons, and important context that persists across sessions._

---

## System Configuration (March 2026)

### API Integrations
**Active:** Google OAuth (Gmail, Calendar, Docs, Sheets, Slides), GitHub (private repos), Vercel, Perplexity, Grok, Avoma, Telegram  
**CRM:** Google Sheets (replaced HubSpot March 2026)  
**Needs Setup:** ElevenLabs, Supabase  
**Broken:** Minimax (Error 2049 - needs new key)

### Google OAuth — gog CLI Auth
- `GOG_KEYRING_PASSWORD=clawd` — set globally in openclaw.json, inherited by all agents
- **thematweiss@gmail.com** — active, Gmail + Calendar + Drive + Docs + Contacts + Sheets (re-authed Apr 13 2026 after revoked token)
- **sarahmat0816@gmail.com** — active, Gmail + Calendar + Drive + Docs + Contacts + Sheets (re-authed Apr 13 2026 after revoked token)
- **mat.weiss@lucrasports.com** — active, Gmail + Calendar + Drive + Docs + Contacts + Sheets (re-authed Apr 13 2026 after revoked token)
- Auth state: `/root/.config/gogcli/`

### Integration Health
- Script: `scripts/integration-health-check.sh` — pings all APIs, saves state to `memory/integration-health-state.json`
- Cron: daily 9 AM PT. Last run Apr 2: all 6 integrations green.
- Documented: `shared/bob-agent/integration-health-cron.md`
- Fast Google auth smoke test: `scripts/auth-health-smoke-test.sh` checks Gmail + Calendar on `thematweiss@gmail.com`, `sarahmat0816@gmail.com`, and `mat.weiss@lucrasports.com`, saves state to `memory/auth-health-state.json`, and is scheduled every 30 minutes from 7 AM to 10 PM PT.

### Google OAuth Details
- Client ID: 391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com
- Project: clawdasst
- Scopes: Gmail, Calendar, Docs, Sheets, Slides, Forms
- Refresh token: Never expires (auto-refresh system deployed)

### Mat's Email Accounts
- **mat.weiss@lucrasports.com** — Lucra work email (Luke manages)
- **thematweiss@gmail.com** — Personal primary (Hermes/Sage monitors)
- **sarahmat0816@gmail.com** — Shared with Sarah; Sage watches for CorePower emails here

### CRM: Google Sheets (Active March 2026+)
**Replaced HubSpot** - Using Google Sheets as primary CRM for pipeline management.

- **Sheet Name:** "Mat's Pipeline"
- **Columns:** Company, Stage, Amount, Close Date, Last Contact, Notes, Next Action
- **API:** Existing Google OAuth (sheets scope included)
- **Access:** Shared with service account or accessible via OAuth

### GitHub Access (Private Repos)
Mat's repos are PRIVATE. New agent needs:
- Personal Access Token with `repo` scope, OR
- Collaborator access

Repos to access:
- Matweiss/clawd-brain-data
- Matweiss/clawd-dashboard
- Matweiss/clawd-command-center

### Cron Jobs (v2 with Auto-Refresh)
All jobs self-heal expired tokens automatically:
- Morning Briefing: 7am PT weekdays
- Pre-Meeting Prep: Every 15min (7am-6pm)
- Midday Pulse: 1pm PT weekdays
- Nightly Research: 10pm PT Mon-Thu
- Weekly Research: Sun 8pm

### Weekend Policy
✅ **Active:** Orchestrator, Lifestyle Agent, Builder Agent  
❌ **Off:** Work Agent, Research Agent  
*Protects family/creative time from work noise*

### Dashboard
- URL: https://clawd-dashboard-eight.vercel.app
- GitHub: https://github.com/Matweiss/clawd-dashboard
- Issue: Update to use Google Sheets API instead of HubSpot

---

## April 2026

### Agent Evolution — Hermes + Bob Upgrades (Apr 2)
- **Hermes VIP Sender Scoring** (commit 30d5114): Tier-1 senders (@lucrasports.com, Brian/Dylan/Michael, urgent keywords) get instant draft + bypass quiet hours. Tier-2 (prospects, replies) get priority queue top-of-digest.
- **Bob Integration Health Dashboard** (commit ecb3ad4): `scripts/integration-health-check.sh` — daily 9 AM PT, pings all APIs, warns on expiring tokens.
- **Hermes Auto Follow-Up Tracker** (commit pending): `scripts/hermes-followup-tracker.sh` — scans Sent >3 days, no reply → pre-drafts nudge.

### Paperclip Agent Evolution Project
- ID: `dbd17147-fe6b-47c9-ab0b-9ecc1c82b967`
- 21 improvement ideas filed by all agents on Apr 2
- Daily audit: Clawd surfaces top 3 unbuilt ideas to Mat each morning via Telegram

---

## March 2026

### Lucra Employment - Major Career Move
**Date:** March 5, 2026  
**Position:** Founding Account Executive at Lucra, Inc.  
**Start Date:** April 1, 2026

**Key Details:**
- $300K OTE ($150K base + $150K commission)
- 61,141 shares equity (0.175%)
- Uncapped commission, path to Director in 6-9 months
- Fully remote, premium benefits
- New Lucra email: `mat.weiss@lucrasports.com`

**Documents:**
- Full repository: `docs/lucra-employment-document-repository.md`
- Pitch deck summary: `docs/lucra-pitch-deck-overview.md`
- Transition timeline: `docs/processes/job-transition-lucra-2026.md`
- Decision record: `memories/2026/03/2026-03-05-joined-lucra-founding-ae.md`

**All documents countersigned and committed to GitHub.**

### Voice Capabilities Update
**Date:** March 7, 2026

**TTS (Text-to-Speech):**
- Grok: ✅ Active
- ElevenLabs: ✅ Active (API key configured)
- Minimax: ❌ Not working

**STT (Speech-to-Text):**
- Groq Whisper: ✅ Working via API
- Transcription script: `/root/.openclaw/workspace/scripts/transcribe.sh`

**Documentation:** `memory/2026-03-07-voice-capabilities-update.md`

### Browser Coworking Setup Success (VPS + Mac)
**Date:** March 15, 2026

**Result:** ✅ Live browser coworking path operational through connected Mac node.

**Critical architecture notes:**
- VPS OpenClaw gateway + Mac node host routing works.
- Extension relay auth on Mac uses Mac-local gateway token.
- Node host connection to VPS uses VPS gateway token.
- `openclaw nodes status` connected browser-capable node is the go/no-go signal.

**Runbook:** `handoffs/BROWSER_COWORK_SETUP_2026-03-15.md`
**Session log:** `memory/2026-03-15-browser-cowork-win.md`

---

<!-- Add significant events, decisions, and insights here over time. -->

## Personal Facts (March 2026)
- **Wife:** Sarah
- **Dog:** Diggy (black dog, orange collar)
- **Cat:** Theo (automated feeding via Home Assistant `button.theo_s_food_feed`)

---

## Retrieval Anchor Notes
For fast recall, prefer these entity anchors:
- **Mat core facts:** `memory/facts-mat-core.md`
- **Career / Lucra:** `memory/facts-career-core.md`
- **GitHub / CRM / dashboard / voice / browser coworking:** `memory/facts-infra-core.md`
- **Pets / home:** `memory/facts-pets-home.md`
- **Upcoming personal events / travel / dinners / flights:** `memory/upcoming-events.md` (primary), plus `memory/march-2026-events.md` and future `memory/*-events.md` files
- **Pets:** Theo and Diggy are the high-priority pet anchors

## Relationship-First Recall Rule
Mat uses Clawd as a personal assistant with continuity, not a generic search engine.

When Mat asks non-trivial questions, default to:
1. recall relevant memory first
2. infer likely intent and real-world referent
3. answer for Mat's actual situation
4. use generic knowledge only as support

Prefer memory-grounded answers whenever prior conversations, ongoing projects, personal plans, preferences, goals, or constraints could change the answer.

If Mat gives a small cue that implies a larger planning/logistics context, proactively expand from it:
- search memory for likely related events, people, dates, and prior mentions
- infer the missing details that would make the briefing much better
- ask a compact set of high-value follow-up questions
- when available, prefer connected-system retrieval (email confirmations, travel/hotel accounts, reservations) over making Mat reconstruct details manually

## Schedule Recall Rule
When Mat asks questions like:
- "What do I have going on today?"
- "What do I have this week?"
- "What plans do I have?"
- "Am I traveling / flying / meeting anyone?"

Do **not** answer from project/work memory only.

Always search across both:
1. **work/task context** (daily notes, active project notes)
2. **personal event context** (travel, flights, dinners, meetings, reservations, date-specific plans)

Minimum recall set for schedule-style questions:
- `MEMORY.md`
- today's `memory/YYYY-MM-DD.md`
- yesterday's `memory/YYYY-MM-DD.md`
- `memory/upcoming-events.md`
- `memory/march-2026-events.md` or the relevant month/event file
- any surfaced date/travel/event note from `memory_search`

Treat personal dated plans as schedule-critical memory, even when no external calendar is connected.

## Separation Rule
- Keep **Sarah project/art-assistant work** in `memory/projects/` and shared Sarah-agent memory.
- Keep **Mat personal/core memory** in `MEMORY.md`, daily notes, and `memory/facts-mat-core.md`.
- Do **not** merge Sarah project memory into Mat core recall unless explicitly asked.

## Future Project: Siri Replacement / Voice Control (Apr 2026)
**Status:** Parked — revisit after ROI calculator is done

- iMessage bridge: OpenClaw has it built in, just needs Mac node wired up
- Voice → Clawd: iOS Shortcut that dictates → sends to Telegram → I execute → respond
- "Hey Siri, ask Clawd" flow via Shortcuts API endpoint
- Contacts: readable via macOS contacts CLI on Mac node
- Limitation: no real-time mic bridge; async dictation is the viable path
- First step when we return: build the iOS Shortcut (20 min job)
