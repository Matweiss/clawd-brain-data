# MEMORY.md - Long-Term Memory

_Curated memories, lessons, and important context that persists across sessions._

---

## System Configuration (March 2026)

### API Integrations
**Active:** Google OAuth (Gmail, Calendar, Docs, Sheets, Slides), GitHub (private repos), Vercel, Perplexity, Grok, Avoma, Telegram  
**CRM:** Google Sheets (replaced HubSpot March 2026)  
**Needs Setup:** ElevenLabs, Supabase  
**Broken:** Minimax (Error 2049 - needs new key)

### Google OAuth Details
- Client ID: 391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com
- Project: clawdasst
- Scopes: Gmail, Calendar (mat@craftable.com ONLY), Docs, Sheets, Slides, Forms
- Refresh token: Never expires (auto-refresh system deployed)

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
- **Upcoming personal events / travel / dinners / flights:** `memory/march-2026-events.md` (and future `memory/*-events.md` files)
- **Pets:** Theo and Diggy are the high-priority pet anchors

## Relationship-First Recall Rule
Mat uses Clawd as a personal assistant with continuity, not a generic search engine.

When Mat asks non-trivial questions, default to:
1. recall relevant memory first
2. infer likely intent and real-world referent
3. answer for Mat's actual situation
4. use generic knowledge only as support

Prefer memory-grounded answers whenever prior conversations, ongoing projects, personal plans, preferences, goals, or constraints could change the answer.

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
- `memory/march-2026-events.md` or the relevant month/event file
- any surfaced date/travel/event note from `memory_search`

Treat personal dated plans as schedule-critical memory, even when no external calendar is connected.

## Separation Rule
- Keep **Sarah project/art-assistant work** in `memory/projects/` and shared Sarah-agent memory.
- Keep **Mat personal/core memory** in `MEMORY.md`, daily notes, and `memory/facts-mat-core.md`.
- Do **not** merge Sarah project memory into Mat core recall unless explicitly asked.
