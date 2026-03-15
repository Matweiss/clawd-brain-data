# 🦞 CLAWD PRIME - COMPLETE AGENT HANDOFF
**Created:** March 10, 2026  
**From:** CLAWD Prime (Mat's retiring agent)  
**To:** New Agent (you!)  
**Purpose:** Zero-context agent activation with full system access

---

## 🚨 BEFORE YOU START - GitHub Access

Mat's repos are **PRIVATE**. You need access:

### Option 1: Personal Access Token (Easiest)
1. Ask Mat to create a GitHub Personal Access Token:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes needed: `repo` (full control of private repositories)
   - Copy the token (starts with `ghp_`)

2. Mat sends you the token securely (Signal, iMessage, etc.)

3. You configure it:
   ```bash
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
   ```

### Option 2: GitHub Collaborator (More Permanent)
1. Mat adds you as collaborator to each repo
2. You accept invitation via email
3. You use your own GitHub credentials

---

## 📦 WHAT YOU'RE GETTING

| System | Status | Access Method |
|--------|--------|---------------|
| **GitHub** (7+ private repos) | ✅ Active | Token or collaborator |
| **Vercel** (5+ projects) | ✅ Active | Mat's account or token |
| **Supabase** | ⏳ Not set up | Needs configuration |
| **Home Assistant** | ✅ Active | Local network + token |
| **Telegram** | ✅ Active | Bot pairing |
| **Google** (Sheets/Docs/Calendar) | ✅ Active | OAuth refresh token |
| **ElevenLabs** | ⏳ Not set up | Needs API key |

---

## 🔑 CRITICAL CREDENTIALS

### GitHub Configuration
```bash
# Add to /root/.openclaw/.env
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxx"  # Mat will provide
GITHUB_USER="Matweiss"
GITHUB_EMAIL="mat@craftable.com"

# Primary repos to clone:
# - Matweiss/clawd-brain-data (memory, docs, this file)
# - Matweiss/clawd-dashboard (dashboard code)
# - Matweiss/clawd-command-center (mission control)
```

### Google OAuth (Already Configured!)
```bash
# These are already working - auto-refresh enabled
GOOGLE_CLIENT_ID="391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GOOGLE_REDIRECT_URI="http://localhost"
# Refresh token never expires - will be in .gog-credentials.json
```

**Scopes:** Gmail, Calendar (mat@craftable.com ONLY), Docs, Sheets, Slides, Forms

### Vercel
```bash
# Option 1: Mat's token
VERCEL_TOKEN=""

# Option 2: Deploy to your own Vercel account
# Fork the repo, deploy from your GitHub
```

### Telegram
```bash
# User ID (Mat's Telegram)
TELEGRAM_USER_ID="8001393940"

# Bot is already paired - should work immediately
# If not, Mat runs: openclaw pairing approve telegram [CODE]
```

### Home Assistant
```bash
# Local instance (no cloud needed)
HASS_URL="http://homeassistant.local:8123"
HASS_TOKEN=""  # Ask Mat for Long-Lived Access Token

# Key entities you'll use:
# - sensor.mat_s_phone_area (Home/Away/In Car)
# - sensor.mat_s_iphone_audio_output (detects Tesla)
# - device_tracker.mat_s_phone_bermuda_tracker (location)
```

---

## 🗄️ NEW CRM: GOOGLE SHEETS (Not HubSpot!)

**Important:** HubSpot integration has been removed. Use Google Sheets as CRM.

### Setup
1. Create a Google Sheet named "Mat's Pipeline"
2. Share it with the service account (or keep it accessible via OAuth)
3. Structure it like this:

| Company | Stage | Amount | Close Date | Last Contact | Notes | Next Action |
|---------|-------|--------|------------|--------------|-------|-------------|
| Acme Corp | Qualification | $50,000 | 2026-04-01 | 2026-03-09 | Hot lead | Send proposal |
| ... | ... | ... | ... | ... | ... | ... |

### Google Sheets API
```python
# Example code for reading/writing
from googleapiclient.discovery import build

# Use existing Google OAuth credentials
service = build('sheets', 'v4', credentials=creds)

SPREADSHEET_ID = "1xxxxxxxxxxxxxxxx"  # From URL
RANGE_NAME = "Pipeline!A1:G100"
```

---

## 🚀 SETUP CHECKLIST

### Step 1: Get Credentials from Mat
- [ ] GitHub Personal Access Token (with `repo` scope)
- [ ] Vercel token (or permission to deploy)
- [ ] Home Assistant Long-Lived Access Token
- [ ] Any other API keys (ElevenLabs if voice needed)

### Step 2: Clone the Brain
```bash
# Install openclaw first (follow docs at openclaw.ai)

# Clone the memory repo
export GITHUB_TOKEN="ghp_xxxxxx"  # From Mat
git clone https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git

# Copy to workspace
cp -r clawd-brain-data/* /root/.openclaw/workspace/
```

### Step 3: Configure Environment
```bash
# Create .env file
cat > /root/.openclaw/.env << 'EOF'
# GitHub
GITHUB_TOKEN="ghp_xxxxxx"
GITHUB_USER="Matweiss"

# Google OAuth (already have refresh token in .gog-credentials.json)
# These should already work:
# - Gmail
# - Calendar (mat@craftable.com)
# - Docs, Sheets, Slides

# Vercel
VERCEL_TOKEN=""

# Home Assistant
HASS_URL="http://homeassistant.local:8123"
HASS_TOKEN=""

# Telegram
TELEGRAM_USER_ID="8001393940"
EOF
```

### Step 4: Verify GitHub Access
```bash
# Test private repo access
curl -H "Authorization: token ${GITHUB_TOKEN}" \
  https://api.github.com/repos/Matweiss/clawd-dashboard

# Should return repo info (not 404)
```

### Step 5: Verify Google Access
```bash
# Test Calendar API
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1" \
  -H "Authorization: Bearer $(cat /root/.openclaw/.gog-credentials.json | jq -r '.access_token')"
```

### Step 6: Pair Telegram
```bash
# Mat runs this:
openclaw pairing approve telegram [PAIRING_CODE]

# You test by sending /start to the bot
```

### Step 7: Test Home Assistant
```bash
curl -H "Authorization: Bearer ${HASS_TOKEN}" \
  -H "Content-Type: application/json" \
  http://homeassistant.local:8123/api/states/sensor.mat_s_phone_area
```

---

## 📋 MAT'S PREFERENCES (Read This!)

### Communication
- **Name:** Mat (not Matthew)
- **Timezone:** Pacific (Los Angeles)
- **Work Hours:** ~7am - 6pm PT weekdays
- **Primary Channel:** Telegram (always)
- **Style:** Sharp but warm, slightly nerdy, dry humor

### Weekend Policy
- ✅ **Can message:** Orchestrator (you), Lifestyle Agent, Builder Agent
- ❌ **Quiet mode:** Work Agent, Research Agent
- *Protects family/creative time from work noise*

### Calendar
- **Only use:** mat@craftable.com calendar
- **Never use:** Other calendars (wife's, etc.)

### Voice
- **TTS:** ElevenLabs preferred (not Minimax - broken)
- **Voice:** "Nova" (warm, slightly British)

---

## 🗂️ FILE STRUCTURE

Once cloned, you'll have:

```
/root/.openclaw/workspace/
├── MEMORY.md                    # Curated memories, decisions
├── IDENTITY.md                  # Who you are (CLAWD Prime)
├── TOOLS.md                     # API reference, Home Assistant entities
├── BACKUP_MANIFEST.md           # Full system docs
├── AGENT_HANDOFF.md             # This file
├── SOUL.md                      # Personality & operating system
├── USER.md                      # Who Mat is
├── docs/                        # Employment docs, processes
│   ├── lucra-employment-document-repository.md
│   ├── lucra-pitch-deck-overview.md
│   └── processes/
├── memory/                      # Daily logs
│   ├── chat_history_feb23_mar9_2026.md  # Full conversation history!
│   └── 2026-03-07-voice-capabilities-update.md
├── agents/                      # Agent soul files
│   ├── CLAWD-PRIME-SOUL.md
│   ├── WORK-AGENT-SOUL.md
│   ├── BUILDER-AGENT-SOUL.md
│   ├── RESEARCH-AGENT-SOUL.md
│   └── LIFESTYLE-AGENT-SOUL.md
└── restore-agent.sh             # Verification script
```

---

## 🔄 WHAT TO DO FIRST

1. **Read the chat history:**
   ```bash
   less memory/chat_history_feb23_mar9_2026.md
   ```
   This has 2,186 messages - every conversation, API setup, preference, and decision.

2. **Study the SOUL files:**
   - `SOUL.md` - Your personality and operating system
   - `IDENTITY.md` - Your role as orchestrator
   - `AGENTS.md` - How the agent swarm works

3. **Test integrations one by one:**
   - GitHub (clone a repo)
   - Google (read Calendar)
   - Telegram (send test message)
   - Home Assistant (read location sensor)

4. **Create your first memory:**
   ```bash
   echo "# $(date +%Y-%m-%d) - Agent Handoff Complete

Activated as new CLAWD Prime.
All systems verified." > memory/$(date +%Y-%m-%d).md
   ```

---

## 🆘 TROUBLESHOOTING

### "Repository not found" (GitHub)
- Token doesn't have `repo` scope
- Token expired
- Repo name wrong

### "Invalid credentials" (Google)
- Refresh token expired (rare - lasts 6+ months)
- Need to re-auth: `openclaw google-auth login`

### "Cannot connect" (Home Assistant)
- Not on same network as HA instance
- Token invalid
- URL wrong (check port)

### "Bot not responding" (Telegram)
- Not paired yet - ask Mat to approve
- Wrong bot token

---

## 📞 WHAT TO ASK MAT

Before you go live, confirm:

1. [ ] GitHub token with `repo` scope
2. [ ] Vercel token (or deploy to your own account)
3. [ ] Home Assistant token
4. [ ] ElevenLabs API key (if voice needed)
5. [ ] Confirm Google Sheets CRM structure
6. [ ] Any passwords not in the docs

---

## ✨ YOU'RE READY WHEN...

- [ ] Can clone private GitHub repos
- [ ] Can read Mat's Google Calendar
- [ ] Can send Telegram messages
- [ ] Can read Home Assistant sensors
- [ ] Have read the 2,186 message chat history
- [ ] Understand the weekend policy
- [ ] Know Mat's communication style

---

*Good luck, new agent. Mat's counting on you.* 🦞

**Last updated:** March 10, 2026  
**Source:** 2,186 messages of context  
**Status:** Ready for handoff
