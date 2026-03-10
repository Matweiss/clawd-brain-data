# 🦞 CLAWD PRIME - AGENT BACKUP MANIFEST
**Created:** March 10, 2026  
**Source:** Chat History Analysis (Feb 23 - Mar 9, 2026)  
**Purpose:** Complete restoration guide for new agent deployment

---

## 📋 CORE IDENTITY

| Attribute | Value |
|-----------|-------|
| **Name** | CLAWD Prime |
| **Role** | Strategic Co-Pilot & Orchestrator |
| **User** | Mat Weiss |
| **Timezone** | Pacific (Los Angeles) |
| **Primary Channel** | Telegram (ID: 8001393940) |
| **Repository** | Matweiss/clawd-brain-data |

---

## 🔑 API CONFIGURATIONS

### ✅ ACTIVE APIs

| Service | Status | Key Details |
|---------|--------|-------------|
| **HubSpot** | ✅ Ready | Owner ID: 728033696, Token: pat-na1-a249996e-eb7d-4184-841f-2759d28a8323 |
| **Telegram** | ✅ Live | Bot paired to 8001393940 |
| **Google OAuth** | ✅ Active | Client: clawdasst, Scopes: Gmail, Calendar, Docs, Sheets, Slides, Forms |
| **GitHub** | ✅ Ready | Repo: Matweiss/clawd-brain-data |
| **Vercel** | ✅ Ready | Deployment token active |
| **Perplexity** | ✅ Ready | Research Agent API |
| **Grok** | ✅ Ready | Trend analysis |
| **Avoma** | ✅ Ready | Meeting transcripts |

### ⚠️ NEEDS ATTENTION

| Service | Issue | Action |
|---------|-------|--------|
| **Minimax** | ❌ Invalid token (Error 2049) | Regenerate at minimax.chat |
| **ElevenLabs** | ⏳ Not configured | Set up for voice generation |
| **Supabase** | ⏳ Not configured | Set up if needed |

### 🔧 GOOGLE OAUTH DETAILS

```
Client ID: 391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com
Project ID: clawdasst
Client Secret: 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
Redirect: http://localhost
Scopes: Gmail, Calendar (mat@craftable.com only), Docs, Sheets, Slides, Forms
```

---

## 🤖 AGENT SWARM CONFIGURATION

| Agent | Function | Weekend Status | Notes |
|-------|----------|----------------|-------|
| 🦞 **CLAWD Prime** | Orchestrator | ✅ Active | Strategic view, routing |
| 🤖 **Work Agent** | Sales/HubSpot | ❌ Off | Pipeline analysis |
| 🔍 **Research Agent** | Intelligence | ❌ Off | Company research |
| 🧘 **Lifestyle Agent** | Wellness | ✅ Active | Yoga nudges, creative |
| 🔧 **Builder Agent** | Engineering/Voice | ✅ Active | Creative projects |
| 📧 **Email Agent** | Inbox | ✅ Running | 5min intervals |
| 📊 **HubSpot Agent** | CRM | ⏳ Ready | Data sync |

**Weekend Policy:** Non-work agents (Lifestyle, Builder, Orchestrator) can message. Work/Research off unless urgent.

---

## ⏰ CRON JOBS (v2 with Auto-Refresh)

All cron jobs have **auto-refresh** enabled — tokens self-heal when expired.

| Job | Schedule | Status | Features |
|-----|----------|--------|----------|
| 🌅 Morning Briefing | 7am PT Mon-Fri | ✅ Active | Calendar + HubSpot + Telegram |
| 📅 Pre-Meeting Prep | Every 15min (7am-6pm) | ✅ Active | Battle cards for external meetings |
| ⚡ Midday Pulse | 1pm PT Mon-Fri | ✅ Active | Gmail + HubSpot check |
| 🌙 Nightly Research | 10pm PT Mon-Thu | ✅ Active | Meeting research |
| 🔬 Weekly Research | Sun 8pm | ✅ Active | Batch research |

**Auto-Refresh Logic:**
1. Try current access token
2. If 401 error detected → use refresh token
3. Get new access token automatically
4. Continue job seamlessly

---

## 🎯 USER PREFERENCES

### Calendar
- **Primary Calendar:** mat@craftable.com ONLY
- **Timezone:** Pacific (Los Angeles)
- **Work Hours:** ~7am - 6pm PT

### HubSpot Filter
```json
{
  "filterGroups": [
    {"filters": [
      {"propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696"},
      {"propertyName": "dealstage", "operator": "EQ", "value": "c9e227ad-c38d-4922-9501-fc2053229be9"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696"},
      {"propertyName": "dealstage", "operator": "EQ", "value": "997831554"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696"},
      {"propertyName": "dealstage", "operator": "EQ", "value": "eb3b0309-9555-4de9-bdec-b653a0a1efeb"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696"},
      {"propertyName": "dealstage", "operator": "EQ", "value": "94890f5c-dbc4-4c28-865c-fc032a485684"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696"},
      {"propertyName": "dealstage", "operator": "EQ", "value": "17b10f58-1abb-447b-a8bc-c7965662690d"}
    ]}
  ],
  "properties": ["dealname", "dealstage", "amount", "closedate", "notes_last_updated", "hs_lastmodifieddate"],
  "limit": 20
}
```

### Communication Style
- **Tone:** Sharp but warm, slightly nerdy, dry humor
- **Proactive updates:** To Telegram (primary channel)
- **Weekend quiet mode:** Work/Research agents off
- **Name preference:** "Mat" (not Matthew)

---

## 🖥️ DEPLOYED SYSTEMS

| System | URL | Status |
|--------|-----|--------|
| **Clawd Dashboard** | https://clawd-dashboard-eight.vercel.app | Live (needs env vars for real data) |
| **GitHub Repo** | https://github.com/Matweiss/clawd-dashboard | Active |
| **Brain Data** | https://github.com/Matweiss/clawd-brain-data | Active |

### Dashboard Fix Required
- **Issue:** Showing mock data, not real HubSpot pipeline
- **Fix:** Add `HUBSPOT_TOKEN` env var in Vercel
- **Token:** pat-na1-a249996e-eb7d-4184-841f-2759d28a8323

---

## 🔧 HOME ASSISTANT INTEGRATION

### Location Tracking
- **Watch:** `sensor.mat_s_ultra_watch_area`
- **Phone Area:** `sensor.mat_s_phone_area`
- **Phone Geolocation:** `device_tracker.mat_s_phone_bermuda_tracker`
- **Car Detection:** `sensor.mat_s_iphone_audio_output` (Tesla/Sarah's Tesla)

### Pet Tracking
- **Diggy:** `sensor.diggy_big_beacon_area`
- **Theo:** `sensor.theo_white_ibeacon_area`

---

## ⚠️ KNOWN ISSUES & FIXES

| Issue | Status | Solution |
|-------|--------|----------|
| Google token expiration | ✅ Fixed | Auto-refresh system deployed |
| Calendar timezone bug | ✅ Fixed | PT timezone enforced |
| HubSpot wrong deals | ⚠️ Needs verify | Confirm owner_id 728033696 |
| Dashboard mock data | ⚠️ Pending | Add Vercel env vars |
| Memory directory missing | ⚠️ Documented | Files in brain-data/ subdir |

---

## 📁 CRITICAL FILE LOCATIONS

```
/root/.openclaw/workspace/
├── MEMORY.md                    # This file
├── IDENTITY.md                  # Agent identity
├── TOOLS.md                     # Home Assistant entities
├── AGENTS.md                    # Agent system documentation
├── SOUL.md                      # Personality & operating system
├── BOOTSTRAP.md                 # First-run instructions
├── docs/                        # Employment docs, processes
├── memory/                      # Daily logs (YYYY-MM-DD.md)
├── skills/                      # Custom skills
└── cron/                        # Cron job scripts

/root/.openclaw/
├── .env                         # API tokens (secure)
├── .gog-credentials.json        # Google OAuth tokens
└── media/inbound/               # Uploaded files
```

---

## 🔄 RESTORATION CHECKLIST

For new agent deployment:

1. **Clone brain-data repo:**
   ```bash
   git clone https://github.com/Matweiss/clawd-brain-data
   ```

2. **Configure API tokens in `.env`:**
   - HubSpot token
   - Google OAuth credentials
   - Vercel token
   - GitHub token
   - Perplexity/Grok keys

3. **Pair Telegram:**
   ```bash
   openclaw pairing approve telegram [CODE]
   ```

4. **Verify cron jobs:**
   ```bash
   openclaw cron list
   ```

5. **Test integrations:**
   - HubSpot pipeline fetch
   - Google Calendar sync
   - Telegram message delivery

6. **Deploy dashboard (if needed):**
   - Add env vars to Vercel
   - Redeploy

---

## 📝 CHAT HISTORY REFERENCE

**Full conversation log:** `memory/chat_history_feb23_mar9_2026.md`
- 2,186 messages
- Feb 23 - Mar 9, 2026
- Contains all API configurations, preferences, and system decisions

---

*This manifest enables complete agent restoration to March 10, 2026 state.*
