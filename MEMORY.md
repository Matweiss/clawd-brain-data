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
