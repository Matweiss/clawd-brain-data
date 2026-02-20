# Clawd Command Center - Agents

Multi-agent system for Mat's AI assistant team.

## Architecture

**Dashboard:** https://clawd-command.vercel.app
**GitHub:** https://github.com/Matweiss/clawd-command-center
**Google Sheet:** https://docs.google.com/spreadsheets/d/1BBmXDzOHRMulBNXuOlRwxx0Dnu2Y-qk1O1n9XyJUg-o/edit

## Agents

### 1. Clawd Prime (Orchestrator)
- **Status:** Active
- **Role:** Main conversation partner, coordinator
- **Communication:** Telegram direct

### 2. Work Agent (Sales Chief of Staff)
- **Status:** ✅ Operational (Phase 2 complete)
- **Role:** HubSpot pipeline monitoring, Gmail, Calendar
- **Schedule:** Hourly (8 AM - 5 PM PST, Mon-Fri)
- **Tasks:**
  - Pipeline refresh (deals, total value, stale checks)
  - Calendar meetings (today's schedule)
  - Telegram alerts (3+ stale deals)

**Current Stats:**
- Pipeline: $1,904 across 7 deals
- Meetings: 6 today
- Stale deals: 0

**Cron:** `0 8-17 * * 1-5` (hourly during work hours)

### 3. Lifestyle Agent (Personal Concierge)
- **Status:** 🔵 Planned (Phase 3)
- **Role:** Yoga tracking, reservations, wellness, family logistics

### 4. Build Agent (Code Specialist)
- **Status:** 🔵 Planned (Phase 4)
- **Role:** Overnight coding, dashboard improvements, skills

### 5. Research Agent (Intelligence Gatherer)
- **Status:** 🔵 Planned (Phase 5)
- **Role:** ZoomInfo/LinkedIn lookups, contact research, caching

## Running Agents Manually

```bash
# Work Agent - Pipeline Refresh
cd /data/.openclaw/workspace/agents
python3 work_agent.py --task pipeline_refresh

# Check logs
tail -f /data/.openclaw/workspace/logs/work-agent.log
```

## Data Flow

```
Agent (Python) → Google Sheets → Dashboard (Next.js/Vercel) → Mat's Browser
```

**Google Sheet Tabs:**
- **Agents:** Status, current task, last active, stats
- **Tasks:** Task queue (future phases)
- **Activity_Log:** All agent actions with timestamps
- **Config:** Dashboard settings (refresh interval, etc.)

## Installation

**Dependencies:**
```bash
pip3 install --break-system-packages google-api-python-client google-auth-httplib2 google-auth-oauthlib requests
```

**Credentials:**
- Google OAuth: `/data/.openclaw/google-token.json`
- HubSpot Token: Hardcoded in `work_agent.py`
- Telegram Chat ID: `8001393940`

## Dashboard Development

```bash
cd /data/.openclaw/workspace/clawd-command
PORT=3001 npm run dev
```

**Environment Variables (Vercel):**
- `GOOGLE_CREDENTIALS`: Full Google OAuth JSON
- `SHEET_ID`: `1BBmXDzOHRMulBNXuOlRwxx0Dnu2Y-qk1O1n9XyJUg-o`

## Timeline

- ✅ **Phase 1** (Feb 20): Dashboard + Google Sheets backend
- ✅ **Phase 2** (Feb 20): Work Agent operational
- 🔜 **Phase 3** (Week 1): Lifestyle Agent
- 🔜 **Phase 4** (Week 2): Build Agent
- 🔜 **Phase 5** (Week 3): Research Agent

## Cost

**Current:** $16-30/month
- Kimi K2.5: FREE (90%+ usage)
- Claude Sonnet 4.5: ~$10-20/month (fallback)
- ElevenLabs TTS: ~$5-10/month
- Perplexity API: ~$1-5/month
- Google APIs: FREE
- Vercel: FREE (hobby tier)

**Total:** ~$0-2/month actual spend so far (mostly free tiers)
