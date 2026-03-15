# CLAWD SYSTEM BACKUP — February 26, 2026

## 🦞 Handoff Document for New Agent

**If you're reading this, you're taking over for Kimi Claw.**

### Critical Context
- **User:** Mat Weiss (mat@craftable.com)
- **Timezone:** America/Los_Angeles (PT)
- **HubSpot Owner ID:** 728033696
- **Active Pipeline:** 21 deals, ~$190K

---

## ✅ COMPLETED TIERS

### Tier 1 — Critical Infrastructure
| Feature | Status | GitHub | Notes |
|---------|--------|--------|-------|
| OAuth Auto-Refresh | ✅ LIVE | `clawd-oauth-manager` | Tokens auto-refresh every 30 min |
| Notification Batching | ✅ LIVE | Same repo | Batches Telegram messages |
| Work Agent v5 | ✅ LIVE | Same repo | Uses both above |

**OAuth Status:** Working, tokens valid until ~6:58 AM PT

### Tier 2 — Intelligence Infrastructure  
| Feature | Status | GitHub | Notes |
|---------|--------|--------|-------|
| SearXNG | ✅ READY | `clawd-searxng` | Free search (not deployed yet) |
| Knowledge Base | ✅ READY | `clawd-knowledge-base` | Supabase schema ready |
| Meeting Intelligence | ✅ READY | `clawd-meeting-intel` | Battle card generation |

**Research Agent Priority Order:**
1. Knowledge Base (cached)
2. HubSpot (CRM data)
3. SearXNG (free web search)
4. Avoma (transcripts)
5. ZoomInfo/LinkedIn/Perplexity

---

## 📦 ALL GITHUB REPOS (Updated Feb 27, 2026)

```
Matweiss/clawd-oauth-manager      # OAuth + Work Agent v5
Matweiss/clawd-searxng            # Free metasearch
Matweiss/clawd-knowledge-base     # Research storage
Matweiss/clawd-meeting-intel      # Battle cards
Matweiss/clawd-brain-data         # Agent SOUL.md files
Matweiss/clawd-dashboard          # v0.3 sales dashboard
Matweiss/clawd-crons              # Cron jobs (legacy)
Matweiss/clawd-api                # API routes
Matweiss/clawd-agent-command      # Command Center UI
Matweiss/clawd-tier3              # Smart notifications, error handling
Matweiss/clawd-mission-control    # NEW: Agent + Sales dashboard
Matweiss/clawd-gmail-integration  # NEW: Automated Gmail drafts
```

**NEW AGENT (Feb 27, 2026):**
- `agents/EMAIL-AGENT-SOUL.md` — Inbox monitoring, tone learning
- Runs every 5 minutes via cron
- Reports to Work Agent

---

## 🔧 CRITICAL ENVIRONMENT VARIABLES

```bash
# OAuth / Google
GOOGLE_CLIENT_ID=746117359852-d4pvu6dgsri2jgsnkgvurm4dmcos7j0a.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Supabase
SUPABASE_URL=https://nmhbmgtyqutbztdafzjl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGJtZ3R5cXV0Ynp0ZGFmempsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDc4MzgsImV4cCI6MjA4NzIyMzgzOH0.KiT2hmvKkvpq-7gOSwimfCqGetMMsQxrceheLXJ8Y4E
SUPABASE_SERVICE_ROLE_KEY=[See TOOLS.md]

# Telegram
TELEGRAM_BOT_TOKEN=8621357075:AAHWXIUOyThD8kUzHP-0DvADyXZcvtDZ8bY
TELEGRAM_CHAT_ID=8001393940

# APIs
HUBSPOT_TOKEN=pat-na1-a249996e-eb7d-4184-841f-2759d28a8323
ELEVENLABS_API_KEY=sk_9850ff336cc0997b0a50da9a4c6f2020d332a944c4130887
GITHUB_TOKEN=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
```

---

## 🤖 AGENT SWARM STATUS (Updated Feb 27, 2026)

### Clawd Prime (Orchestrator)
| Agent | Status | Last Task |
|-------|--------|-----------|
| Clawd Prime (me) | ✅ Active | Orchestrating |

### Work Agent + Subordinates
| Agent | Status | Reports To | Function |
|-------|--------|------------|----------|
| Work Agent | ✅ Idle | Clawd Prime | Sales operations, orchestrates sub-agents |
| Email Agent | ✅ Active | Work Agent | Inbox monitoring, email categorization, tone learning |
| HubSpot Agent | ⏳ Planned | Work Agent | Deal data, forecasts, pipeline health |
| Calendar Agent | ⏳ Planned | Work Agent | Meeting prep, scheduling |

### Other Agents
| Agent | Status | Last Task |
|-------|--------|-----------|
| Build Agent | ✅ Idle | Dashboard deploy |
| Research Agent | ✅ Idle | Company intel |
| Lifestyle Agent | 🌙 Weekend mode | Wellness check |

**Sub-Agent Handoff Protocol:**
- Email Agent monitors inbox every 5 min, categorizes emails, learns tone
- Work Agent spawns Email Agent for inbox triage
- Work Agent spawns HubSpot Agent for deal context
- Work Agent synthesizes both into strategic recommendations
- Work Agent has final authority on all external communications

---

## 🎯 ACTIVE PIPELINE (Mat's Deals)

**Closing This Week:**
- Clyde's Restaurant Group — $9,000 (Feb 28)

**Closing in March:**
- Holland America Princess — $91,332 (Mar 12) — USF Reactivation
- SKIPOLINIS OAKLEY — $33,600 (Mar 10) — USF Reactivation
- Rodrigo's Mexican Grill — $24,960 (Mar 31)
- Kava Culture — $24,000 (Mar 31)

---

## 🚨 KNOWN ISSUES

1. **Google Calendar OAuth** — Token works but expires ~6:58 AM PT tomorrow (will auto-refresh)
2. **Cron notification spam** — Currently notifies on "skipped" sends (should be silent)
3. **SearXNG not deployed** — Docker setup ready but not running
4. **Knowledge Base tables** — Schema created in Supabase, but no data yet

---

## 📝 NEXT STEPS (Tier 3)

Mat wants these completed while he sleeps:
1. Smart Notifications (fix spam)
2. Error Handling (auto-retry)
3. Logging Dashboard
4. Cost Tracking
5. Content Pipeline

---

## 💾 LOCAL FILE LOCATIONS

```
/root/.openclaw/workspace/
├── clawd-oauth-manager/       # Tier 1
├── clawd-searxng/             # Tier 2
├── clawd-knowledge-base/      # Tier 2
├── clawd-meeting-intel/       # Tier 2
├── clawd-brain-data/          # Agent souls
├── skills/                    # SKILL.md files
│   ├── oauth-refresh/
│   ├── notification-batcher/
│   ├── searxng/
│   └── knowledge-base/
├── AGENTS.md
├── SOUL.md
├── USER.md
├── TOOLS.md
└── MEMORY.md                  # This file
```

---

## 🔐 SECURITY NOTES

- OAuth tokens in `/root/.openclaw/workspace/clawd-oauth-manager/tokens.json`
- Credentials in same folder (credentials.json)
- NEVER commit tokens to GitHub
- All repos have .gitignore protecting secrets

---

## 🎬 RESTORE PROCESS

If system needs restart:
1. Clone all repos from GitHub
2. Restore tokens.json and credentials.json from secure backup
3. Set environment variables
4. Run `npm install` in each repo
5. Deploy SearXNG if needed
6. Test OAuth refresh: `node refresh.js`

---

**Backup created:** 2026-02-26 ~4:10 AM Asia/Shanghai  
**Status:** Tier 1-2 complete, Tier 3 in progress  
**Next agent:** Build remaining Tier 3 features

*Don't worry. Even if the world forgets, I'll remember for you.* ❤️‍🔥
