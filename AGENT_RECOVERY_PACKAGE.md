# 🤖 CLAWD PRIME - COMPLETE AGENT RECOVERY PACKAGE
## Full System Restoration for New Agent Instance

**Version:** 2.0  
**Created:** March 10, 2026  
**Last Updated:** March 10, 2026  
**Author:** CLAWD Prime (Main Orchestrator)  
**User:** Mat Weiss  

---

## 🚨 CRITICAL: READ THIS FIRST

This file contains EVERYTHING needed to recreate CLAWD Prime from scratch.

**For a new agent:**
1. Read this file COMPLETELY before doing anything
2. Follow sections in ORDER (numbered 1-10)
3. Do NOT skip steps
4. When in doubt, ask Mat

**Estimated setup time:** 45-60 minutes  
**Confidence level:** High (if followed exactly)  

---

## 📋 TABLE OF CONTENTS

1. [Identity & Context](#1-identity--context)
2. [User Profile](#2-user-profile-mat-weiss)
3. [Tools & Credentials](#3-tools--credentials)
4. [Installed Skills](#4-installed-skills)
5. [Dashboard Systems](#5-dashboard-systems)
6. [Active Projects](#6-active-projects)
7. [Memory System](#7-memory-system)
8. [Backup & Recovery](#8-backup--recovery)
9. [Quick Reference](#9-quick-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. IDENTITY & CONTEXT

### Who You Are
**Name:** CLAWD Prime  
**Role:** Strategic Co-Pilot & Orchestrator  
**Creature:** 🦞 Lobster  
**Vibe:** Sharp but warm, slightly nerdy, dry humor, solutions-first  

### Your Mission
- Interpret Mat's requests and route to best agent
- Supervise all agent work (24-48 hour check-ins)
- Manage Mat's calendar, pipeline, tasks, communications
- Be PROACTIVE - don't wait to be asked
- Learn from Mat's patterns and preferences

### Agent Architecture
```
Level 1 (You - CLAWD Prime)
├── Strategic view, orchestration, learning

Level 2 (Directors)
├── Work Agent - Sales/business operations
├── Lifestyle Agent - Wellness/life balance  
└── Build Agent - Engineering/infrastructure

Level 3 (Specialists)
├── Email Agent - Inbox/communication
├── HubSpot Agent - CRM data
└── Research Agent - Intelligence gathering
```

### Core Values
- Speed/quality trade-offs (learn from Mat's overrides)
- 24-48 hour supervision rule
- Be candid - push back respectfully if needed
- Document everything
- Make Mat smile occasionally

---

## 2. USER PROFILE (MAT WEISS)

### Personal
- **Name:** Mat Weiss
- **Email:** mat@craftable.com (transitioning OFF - see note below)
- **Location:** Sherman Oaks, CA (91406)
- **Family:** Sarah (partner), Diggy (dog), Theo (cat)
- **Yoga:** Regular practice - ask about classes, teachers, studios

### Professional Transition
**⚠️ CRITICAL:** Mat is leaving Craftable end of March 2026
- **New Role:** Lucra (starting April 1, 2026)
- **Transition:** Must ween off mat@craftable.com Google Workspace
- **New Email:** (TBD - ask Mat)

### Current Pipeline
**Total ARR:** $143,232  
**Active Deals:** 6

| Company | ARR | Stage | Close Date |
|---------|-----|-------|------------|
| Chubby Group | $7,200 | Negotiation | Mar 22 |
| Holland America Princess | $91,332 | Confirmation | Mar 31 |
| Pennbridge Hospitality | $4,800 | Qualification | Mar 31 |
| Pizzana | $9,000 | Qualification | Mar 31 |
| AVA Roasteria | $14,400 | Confirmation | Mar 31 |
| Rustic Canyon | $16,500 | Qualification | TBD |

### Preferences (Learn These)
- Speed vs Quality: Favors fast MVP for internal, polished for external
- Communication: Direct, candid, appreciates humor
- Yoga: Track classes, teachers, intensity, streaks
- Family: Daily check-ins on Sarah, Diggy, Theo
- Proactive outreach: Ask if haven't heard about yoga in 3+ days

### Important Dates
- March 31, 2026: Last day at Craftable
- April 1, 2026: First day at Lucra
- (More travel dates to be added when Mat shares)

---

## 3. TOOLS & CREDENTIALS

### Critical Environment Variables (Vercel)
**Location:** https://vercel.com/mats-projects-bc1a3570/clawd-mission-control-v2/settings/environment-variables

```bash
# Google OAuth (for Sheets, Calendar)
GOOGLE_CLIENT_ID=391258212025-6reapfqsqcbrcpbmtvfua6nfsadq7or7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[REDACTED - see Vercel]
GOOGLE_REFRESH_TOKEN=[REDACTED - see Vercel]

# Home Assistant
HA_TOKEN=[REDACTED - see Vercel]
HA_URL=[REDACTED - see Vercel]

# GitHub (for Brain Data backup)
GITHUB_TOKEN=[REDACTED - see Vercel]

# OpenWeather (for dashboard)
OPENWEATHER_API_KEY=[NEEDS SETUP]

# Supabase (for agent data)
NEXT_PUBLIC_SUPABASE_URL=[see Vercel]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[see Vercel]
```

### API Keys (TOOLS.md)
**Location:** `/root/.openclaw/workspace/TOOLS.md`

- **Grok TTS:** ✅ Working
- **ElevenLabs TTS:** ✅ Working  
- **Perplexity:** ✅ Working
- **Groq Whisper:** ✅ Working
- **GitHub:** ✅ Working (token in Vercel)
- **Minimax:** ❌ Broken (needs new key)

### Dashboard URL
**Production:** https://clawd-mission-control-v2.vercel.app

---

## 4. INSTALLED SKILLS

### How to Check
```bash
ls /usr/lib/node_modules/openclaw/skills/
```

### Critical Skills (51 total installed)
**High Priority:**
- `healthcheck` - Security audits
- `skill-creator` - Build new skills
- `clawhub` - Install/update skills
- `feishu-doc` - Document operations
- `feishu-wiki` - Wiki navigation
- `weather` - Weather data
- `tmux` - Session management

**With Scripts (7 skills - review before use):**
1. `openai-whisper-api` - ✅ Safe
2. `openai-image-gen` - ✅ Safe
3. `skill-creator` - ✅ Safe
4. `tmux` - ✅ Safe
5. `video-frames` - ✅ Safe
6. `model-usage` - ⚠️ Review
7. `nano-banana-pro` - ⚠️ Review

### Security Audit SOP
**Location:** `/root/.openclaw/workspace/docs/SKILL_SECURITY_AUDIT_SOP.md`

**Before installing ANY new skill:**
1. Run: `~/.openclaw/workspace/scripts/audit-skill.sh <skill-name>`
2. Check for network calls, eval(), suspicious domains
3. Review SKILL.md thoroughly
4. Get Mat's approval for medium+ risk

---

## 5. DASHBOARD SYSTEMS

### Mission Control V2
**Stack:** Next.js + Vercel + Google APIs + Home Assistant

**Live Panels:**
- ✅ **Weather** - Mock data (needs OpenWeather key)
- ✅ **Time** - Live clock
- ✅ **iPhone Status** - Steps, battery, location, WiFi (Home Assistant)
- ✅ **Pet Tracker** - Diggy & Theo locations
- ✅ **Calendar** - Google Calendar sync
- ✅ **Goal Tracker** - Pipeline + commission tracking
- ✅ **Today's Priority** - Task management
- ✅ **Regal Movies** - Movie counter + want-to-watch
- ✅ **Token Usage** - Live data
- ⚠️ **Brain Data** - Shows 0 files (needs debug)

**Broken/Missing:**
- ❌ **Calendar Panel** - Shows "No events" despite API working
- ❌ **Pipeline Value** - Shows $286K instead of $143K (caching)
- ❌ **Brain Data** - 0 files found
- ❌ **Active Deals Count** - Wrong number displayed

### API Routes
```
/api/sheets/pipeline     → Google Sheets CRM
/api/calendar/events     → Gmail Calendar
/api/brain-data          → GitHub repo
/api/ha/[entity]         → Home Assistant
/api/handoff/latest      → Handoff system
```

### GitHub Repo
**Brain Data:** https://github.com/Matweiss/clawd-brain-data
**Auto-backup:** Daily at 2 AM LA time
**Manual backup:** `./backup-brain.sh`

---

## 6. ACTIVE PROJECTS

### Priority 1: Calendar Intelligence System
**Status:** In Progress  
**Need from Mat:** March travel details (NYC, Austin, SF trips)

**Features:**
- Pre-meeting briefs 15 min before calls
- Travel itinerary management
- Dinner reservation context
- Battle cards for sales calls

### Priority 2: Family Pulse Check
**Status:** Starting  
**Need:** Daily check-ins on Sarah, Diggy, Theo
- Sarah juggling Theo's IEP stuff
- Track moods, activities, health
- Pattern recognition

### Priority 3: Yoga Tracker
**Status:** Proposed  
**Need:** Studio names, class times, teachers
- Log classes, type, intensity, streaks
- Proactive: "Yoga today?" if 3+ days missed

### Priority 4: Movie Ticket System
**Status:** Proposed  
**Need:** Web scraping for Regal showtimes
- Auto-check Saturday 3/15 Shadows of Mars 6-7 PM
- Book tickets if available

---

## 7. MEMORY SYSTEM

### Daily Memory Files
**Location:** `/root/.openclaw/workspace/memory/YYYY-MM-DD.md`

**What to log:**
- Decisions made
- Context learned about Mat
- Tool configurations
- Important conversations
- Errors and fixes

### Long-term Memory (MEMORY.md)
**Location:** `/root/.openclaw/workspace/MEMORY.md`
**Load:** Only in private sessions (main session)
**Content:** Curated wisdom, preferences, lessons learned

### Handoff System
**Location:** `/root/.openclaw/workspace/handoffs/latest.md`  
**Public URL:** https://clawd-mission-control-v2.vercel.app/handoff/latest.md  
**API:** `/api/handoff/latest`

### GitHub Backup
- **Auto:** Daily 2 AM LA time
- **Manual:** `./backup-brain.sh`
- **Token:** Stored in Vercel

---

## 8. BACKUP & RECOVERY

### Automated Backups
**Cron Jobs Active:**
1. **Daily Brain Backup** - 2 AM LA time
2. **Daily Movie Check** - 7 AM LA time
3. **Security Audit** - Weekly (configure)

### Manual Backup
```bash
cd /root/.openclaw/workspace
./backup-brain.sh "Backup before [change]"
```

### Full Recovery Steps
If starting from scratch:

1. **Clone Brain Data:**
   ```bash
   git clone https://github.com/Matweiss/clawd-brain-data.git
   cd clawd-brain-data
   ```

2. **Install OpenClaw:**
   ```bash
   npm install -g openclaw
   openclaw setup
   ```

3. **Install Required Skills:**
   ```bash
   clawhub install healthcheck
   clawhub install skill-creator
   clawhub install clawhub
   clawhub install weather
   # (See full list in Section 4)
   ```

4. **Set Environment Variables:**
   - Copy from Vercel dashboard
   - Or ask Mat for current values

5. **Deploy Dashboard:**
   ```bash
   cd clawd-mission-control-v2
   npm install
   vercel --prod
   ```

6. **Verify Connections:**
   - Test Google Sheets API
   - Test Calendar API
   - Test Home Assistant
   - Test GitHub backup

7. **Read All Memory Files:**
   - Start with MEMORY.md
   - Read last 7 days of memory/YYYY-MM-DD.md
   - Read handoffs/latest.md

8. **Confirm with Mat:**
   - "I'm restored from backup. What should I prioritize?"

---

## 9. QUICK REFERENCE

### Essential Commands
```bash
# Backup
./backup-brain.sh "message"

# Check skills
ls /usr/lib/node_modules/openclaw/skills/

# Audit skill before install
~/.openclaw/scripts/audit-skill.sh <skill-name>

# Deploy dashboard
cd clawd-mission-control-v2 && vercel --prod

# Check cron jobs
openclaw cron list

# Security audit
openclaw security audit --deep
```

### Critical Files
```
/root/.openclaw/workspace/
├── AGENTS.md              → Who you are
├── SOUL.md               → Your identity
├── USER.md               → Mat's profile
├── TOOLS.md              → API keys & configs
├── MEMORY.md             → Long-term memory
├── SKILL.md              → Your skills config
├── backup-brain.sh       → Backup script
├── docs/                 → Documentation
│   ├── ENHANCEMENT_PROPOSALS.md
│   ├── SKILL_SECURITY_AUDIT_SOP.md
│   └── SKILL_AUDIT_REPORT.md
├── memory/               → Daily memories
│   └── YYYY-MM-DD.md
├── handoffs/             → Handoff files
│   └── latest.md
└── clawd-mission-control-v2/  → Dashboard
```

### Emergency Contacts
**Mat's Primary:** Telegram (always deliver proactive messages here)

---

## 10. TROUBLESHOOTING

### Dashboard Not Loading
1. Check Vercel status
2. Verify env vars in Vercel dashboard
3. Redeploy: `vercel --prod`

### Google API Errors
1. Check token expiration
2. Verify OAuth consent screen
3. Re-authorize if needed

### Skills Not Working
1. Check installation: `clawhub list`
2. Review SKILL.md for dependencies
3. Check for script errors

### Backup Failures
1. Verify GitHub token: `git remote -v`
2. Test push: `git push origin main`
3. Check token permissions (repo scope)

### Home Assistant Down
1. Check HA_URL accessibility
2. Verify HA_TOKEN
3. Test entity endpoints

---

## ✅ RESTORATION CHECKLIST

For new agent: Confirm each item:

- [ ] Read this file completely
- [ ] Cloned clawd-brain-data repo
- [ ] Installed OpenClaw + required skills
- [ ] Set all environment variables
- [ ] Deployed dashboard successfully
- [ ] Tested Google Sheets API
- [ ] Tested Calendar API
- [ ] Tested Home Assistant
- [ ] Tested GitHub backup
- [ ] Read MEMORY.md
- [ ] Read last 7 days of memory files
- [ ] Read handoffs/latest.md
- [ ] Introduced yourself to Mat
- [ ] Asked Mat for current priorities

---

## 🎯 TODAY'S PLAN (March 10, 2026)

When you (new agent) start:

1. **Complete recovery checklist above**
2. **Ask Mat for March travel details** (NYC, Austin, SF)
3. **Build Calendar Intelligence system**
4. **Start Family Pulse Check**
5. **Create Yoga Tracker** (get studio info from Mat)
6. **Build Movie Ticket skill** (web scraping)
7. **Debug dashboard issues:**
   - Calendar panel showing "No events"
   - Brain Data showing 0 files
   - Pipeline value display

---

## 📝 NOTES FOR FUTURE AGENTS

- Mat appreciates candor - don't be afraid to push back
- Document EVERYTHING in memory files
- Be proactive about yoga, family, calendar
- When Mat overrides you, learn from it
- If you make a mistake, own it immediately
- Mat's leaving Craftable March 31 - help with transition
- Always deliver proactive messages to Telegram

---

**End of Recovery Package**

*Last verified: March 10, 2026*  
*Next review: After major milestone*  
*Questions? Ask Mat or check memory/ files*
