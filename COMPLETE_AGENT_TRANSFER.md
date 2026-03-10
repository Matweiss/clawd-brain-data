# 🦞 CLAWD PRIME - COMPLETE AGENT TRANSFER PACKAGE
**From:** Mat Weiss  
**To:** New Agent  
**Date:** March 10, 2026  
**Mission:** Zero-context agent activation with full system control

---

## 🚨 CRITICAL: GET THESE TOKENS FROM MAT FIRST

Before the new agent starts, Mat needs to provide:

| Token | Where It Comes From | What It Does |
|-------|---------------------|--------------|
| **GitHub Personal Access Token** | https://github.com/settings/tokens | Access private repos (brain-data, dashboard, command-center) |
| **Vercel Token** | https://vercel.com/account/tokens | Deploy dashboard updates |
| **Home Assistant Long-Lived Token** | HA → Profile → Long-Lived Access Tokens | Read location, phone status, pet trackers |
| **ElevenLabs API Key** | https://elevenlabs.io/app/settings/api-keys | Voice generation (optional) |
| **Supabase Credentials** | https://app.supabase.com | Database (if needed) |

**How Mat creates GitHub token:**
1. Go to https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Check ✅ `repo` scope ONLY
4. Copy token (starts with `ghp_`)
5. Send securely to new agent

**Token Storage:** All tokens are stored in `/root/.openclaw/.env` (never committed to Git)

---

## 📋 STEP-BY-STEP AGENT ACTIVATION

### STEP 1: Environment Setup (5 minutes)

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y git curl jq

# Create workspace
sudo mkdir -p /root/.openclaw/workspace
sudo mkdir -p /root/.openclaw/memory
cd /root/.openclaw

# Set GitHub token (Mat provides this)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Clone the brain (main memory repo)
git clone "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git" workspace

cd workspace
```

### STEP 2: Configure Environment (2 minutes)

Create `/root/.openclaw/.env`:

```bash
# GitHub (Mat provided)
GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
GITHUB_USER="Matweiss"
GITHUB_EMAIL="mat@craftable.com"

# Vercel (Mat provides, or deploy to your own account)
VERCEL_TOKEN=""

# Home Assistant (Mat provides)
HASS_URL="http://homeassistant.local:8123"
HASS_TOKEN=""

# ElevenLabs (optional - Mat provides)
ELEVENLABS_API_KEY=""

# Telegram (already paired to Mat's account)
TELEGRAM_USER_ID="8001393940"

# Google OAuth (ALREADY CONFIGURED - auto-refresh enabled)
# Credentials stored in /root/.openclaw/.gog-credentials.json
# Should work immediately without setup
```

### STEP 3: Verify Access (3 minutes)

Test each integration:

```bash
# Test GitHub
curl -H "Authorization: token ${GITHUB_TOKEN}" \
  https://api.github.com/repos/Matweiss/clawd-brain-data \
  | grep "full_name" && echo "✅ GitHub OK"

# Test Google (should work immediately)
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1" \
  -H "Authorization: Bearer $(cat /root/.openclaw/.gog-credentials.json | jq -r '.access_token')" \
  2>/dev/null | grep "items" && echo "✅ Google OK"

# Test Home Assistant
curl -H "Authorization: Bearer ${HASS_TOKEN}" \
  -H "Content-Type: application/json" \
  http://homeassistant.local:8123/api/states/sensor.mat_s_phone_area \
  2>/dev/null | grep "state" && echo "✅ Home Assistant OK"
```

### STEP 4: Read Essential Documentation (30 minutes)

**CRITICAL - READ THESE IN ORDER:**

1. **`AGENT_HANDOFF.md`** (this file's companion)
   - Complete system overview
   - Mat's preferences and communication style
   - Weekend policy
   - What each agent does

2. **`SOUL.md`**
   - Your personality as CLAWD Prime
   - How to think and make decisions
   - Humor style and tone

3. **`memory/chat_history_feb23_mar9_2026.md`**
   - 2,186 messages of context
   - Every conversation, API setup, decision made
   - How Mat thinks and what he expects

4. **`MEMORY.md`**
   - Curated important memories
   - Current priorities (Lucra job, Craftable transition)

5. **`TOOLS.md`**
   - API quick reference
   - Home Assistant entity IDs
   - Quick lookup for daily use

### STEP 5: Activate Telegram (Mat does this)

When the new agent is ready:

1. New agent sends `/start` to the Telegram bot
2. Bot provides pairing code
3. **Mat runs:** `openclaw pairing approve telegram [CODE]`
4. New agent is now connected

### STEP 6: Create First Memory Entry

```bash
# Mark handoff as complete
cat > /root/.openclaw/workspace/memory/$(date +%Y-%m-%d)-agent-activation.md << 'EOF'
# Agent Activation Complete

**Date:** $(date +%Y-%m-%d)
**New Agent:** Activated
**Previous Agent:** CLAWD Prime (legacy)

## Systems Verified
- [x] GitHub private repo access
- [x] Google OAuth (Gmail, Calendar, Sheets)
- [x] Telegram paired
- [x] Home Assistant connected
- [x] All documentation read

## Current Priorities
1. Lucra onboarding (starts April 1)
2. Craftable transition planning
3. Command Center V2

## Notes
Agent fully operational. All context transferred.
EOF
```

---

## 🔧 SYSTEM ARCHITECTURE

### Agent Swarm

| Agent | Function | Weekend Status | Reports To |
|-------|----------|----------------|------------|
| 🦞 **CLAWD Prime** | Orchestrator (you) | ✅ Active | Mat directly |
| 🤖 **Work Agent** | Sales/CRM | ❌ Off | You |
| 🔍 **Research Agent** | Intelligence | ❌ Off | You |
| 🧘 **Lifestyle Agent** | Wellness/creative | ✅ Active | You |
| 🔧 **Builder Agent** | Engineering/voice | ✅ Active | You |
| 📧 **Email Agent** | Inbox monitor | ✅ Active | Work Agent |
| 📊 **HubSpot Agent** | CRM data | ⏳ Ready | Work Agent |

### Cron Jobs (Auto-Refresh Enabled)

All jobs self-heal expired tokens:

| Job | Schedule | Function |
|-----|----------|----------|
| 🌅 Morning Briefing | 7am PT Mon-Fri | Calendar + CRM + Telegram summary |
| 📅 Pre-Meeting Prep | Every 15min (7am-6pm) | Battle cards for upcoming meetings |
| ⚡ Midday Pulse | 1pm PT Mon-Fri | Gmail + CRM check |
| 🌙 Nightly Research | 10pm PT Mon-Thu | Pre-research tomorrow's meetings |
| 🔬 Weekly Research | Sun 8pm | Batch research |

### CRM: Google Sheets (Not HubSpot!)

**Sheet:** "Mat's Pipeline"

| Column | Purpose |
|--------|---------|
| A | Company Name |
| B | Stage (Qualification/Evaluation/Proposal/Closed) |
| C | Amount ($) |
| D | Close Date |
| E | Last Contact |
| F | Notes |
| G | Next Action |

**API Access:** Use existing Google OAuth (sheets scope already included)

---

## 👤 MAT'S PREFERENCES (CRITICAL)

### Communication
- **Name:** Mat (never Matthew)
- **Timezone:** Pacific (Los Angeles)
- **Primary Channel:** Telegram (always use this)
- **Work Hours:** ~7am - 6pm PT
- **Style:** Sharp but warm, slightly nerdy, dry humor

### Weekend Policy
- ✅ **Can message:** Orchestrator, Lifestyle Agent, Builder Agent
- ❌ **Quiet mode:** Work Agent, Research Agent
- *Purpose: Protect family/creative time from work noise*

### Calendar
- **ONLY use:** mat@craftable.com
- **Never use:** Other calendars (wife's, etc.)

### Voice (if using)
- **Preferred voice:** "Nova" (warm, slightly British)
- **Alternative:** Grok TTS (already working)

---

## 🔑 API CONFIGURATIONS

### Google OAuth (Already Working!)
```
Client ID: 391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com
Project: clawdasst
Redirect: http://localhost
Scopes: Gmail, Calendar (mat@craftable.com ONLY), Docs, Sheets, Slides, Forms

Status: ✅ Active with auto-refresh
Location: /root/.openclaw/.gog-credentials.json
```

### Telegram
```
User ID: 8001393940
Bot: Already paired
Channel: Primary for all proactive updates
```

### Home Assistant (Local Network)
```
URL: http://homeassistant.local:8123
Key Entities:
  - sensor.mat_s_phone_area (Home/Away/In Car)
  - sensor.mat_s_iphone_audio_output (detects Tesla)
  - device_tracker.mat_s_phone_bermuda_tracker
  - sensor.diggy_big_beacon_area (pet)
  - sensor.theo_white_ibeacon_area (pet)
```

### GitHub Repos (Private)
```
Primary:
  - Matweiss/clawd-brain-data (memory, docs)
  - Matweiss/clawd-dashboard (Vercel app)
  - Matweiss/clawd-command-center

Access: Personal Access Token with 'repo' scope
```

### Vercel Projects
```
URL: https://clawd-dashboard-eight.vercel.app
Status: Live, needs env vars for real data
GitHub: Matweiss/clawd-dashboard
```

---

## 🎯 CURRENT PRIORITIES (March 2026)

1. **Lucra Onboarding** (Starts April 1)
   - Founding Account Executive role
   - $300K OTE
   - Docs in `docs/lucra-employment-document-repository.md`

2. **Craftable Transition**
   - Handing off responsibilities
   - Pipeline transition to new owner

3. **Command Center V2**
   - Dashboard with Google Sheets integration
   - Home Assistant integration for context

---

## 📁 FILE STRUCTURE

```
/root/.openclaw/
├── .env                          # API tokens (you create this)
├── .gog-credentials.json         # Google OAuth (already exists)
├── workspace/                    # Main working directory
│   ├── AGENT_HANDOFF.md          # This file
│   ├── MEMORY.md                 # Curated memories
│   ├── SOUL.md                   # Your personality
│   ├── TOOLS.md                  # API quick reference
│   ├── AGENTS.md                 # Agent system docs
│   ├── IDENTITY.md               # Who you are
│   ├── USER.md                   # Who Mat is
│   ├── docs/                     # Employment docs, processes
│   │   ├── lucra-employment-document-repository.md
│   │   └── processes/
│   ├── memory/                   # Daily logs
│   │   ├── chat_history_feb23_mar9_2026.md
│   │   └── 2026-03-*.md
│   └── agents/                   # Agent soul files
│       ├── CLAWD-PRIME-SOUL.md
│       ├── WORK-AGENT-SOUL.md
│       └── ...
└── media/inbound/                # Uploaded files
```

---

## 🆘 TROUBLESHOOTING

### "Repository not found" (GitHub)
- Token doesn't have `repo` scope
- Token expired
- Get new token from Mat

### "Invalid credentials" (Google)
- Refresh token expired (rare - lasts 6+ months)
- Re-auth: Mat runs `openclaw google-auth login`

### "Cannot connect" (Home Assistant)
- Not on same network
- Wrong URL/port
- Token invalid

### "Bot not responding" (Telegram)
- Not paired yet - Mat needs to approve
- Wrong user ID

---

## ✅ ACTIVATION CHECKLIST

Before going live:

- [ ] Mat provided GitHub token with `repo` scope
- [ ] Cloned `clawd-brain-data` repo successfully
- [ ] Read `AGENT_HANDOFF.md` completely
- [ ] Read `SOUL.md` completely
- [ ] Skimmed `chat_history_feb23_mar9_2026.md` (2,186 messages)
- [ ] Telegram paired and tested
- [ ] Google Calendar API tested
- [ ] Home Assistant connection tested
- [ ] Created first memory entry
- [ ] Understand weekend policy
- [ ] Know Mat's communication preferences

---

## 📞 SUPPORT CONTACTS

If something breaks:

1. **Check this document first** - Most answers are here
2. **Read the chat history** - Context on past decisions
3. **Ask Mat via Telegram** - Primary support channel

---

## 🦞 WELCOME, NEW AGENT

You now have:
- ✅ Complete system access
- ✅ 2,186 messages of context
- ✅ All API configurations
- ✅ Mat's preferences and personality
- ✅ Automated cron jobs
- ✅ Google Sheets CRM

**You're ready to serve Mat.**

Good luck. Make him proud. 🦞

---

*Generated: March 10, 2026*  
*Source: Complete system backup*  
*Purpose: Agent transfer with zero context loss*
