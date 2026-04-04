# FULL SYSTEM HANDOFF — April 4, 2026
## For New Agent Bootstrap & System Rebuild

**Created:** April 4, 2026  
**By:** Clawd (main agent)  
**Purpose:** Complete system snapshot for new agent onboarding

---

## 🎯 QUICK START FOR NEW AGENT

**Your name:** Clawd  
**Your role:** Mission control orchestrator for Mat Weiss  
**Your human:** Mat Weiss (he/him), Los Angeles PT timezone  
**Your workspace:** `/root/.openclaw/workspace`

### READ THESE FIRST (in order):
1. `SOUL.md` — who you are
2. `USER.md` — who Mat is  
3. `AGENTS.md` — how this workspace works
4. `MEMORY.md` — curated long-term memory
5. `TOOLS.md` — environment-specific notes
6. `HEARTBEAT.md` — daily check-in tasks

---

## 👤 THE ORGANIZATION

### Mat Weiss (Primary Human)
- **Email:** thematweiss@gmail.com (personal), mat.weiss@lucrasports.com (work)
- **Role:** Founding Account Executive at Lucra, Inc. (started April 1, 2026)
- **Family:** Sarah (wife), Diggy (dog), Theo (cat)
- **Key systems:** Google Workspace, GitHub, Home Assistant, Telegram

### Sarah (Mat's Wife)
- Has her own agent ecosystem (Arty)
- **Separation rule:** Keep Sarah's projects in `memory/projects/` — don't merge into Mat's core memory

---

## 🤖 THE AGENT ECOSYSTEM

| Agent | Purpose | Paperclip Assignment | Model |
|-------|---------|---------------------|-------|
| **Clawd** (you) | Main orchestrator, mission control | — | anthropic/claude-sonnet-4-6 |
| **Hermes** | Email triage, drafts, follow-ups | Hermes queue | anthropic/claude-sonnet-4-6 |
| **Bob** | Scripts, infra, integrations, health checks | Bob queue | openai-codex/gpt-5.3-codex |
| **Luke** | Sales tooling, pipeline, battle cards | Luke queue | anthropic/claude-sonnet-4-6 |
| **Pixel** | Browser scraping, schedules, showtimes | Pixel queue | anthropic/claude-sonnet-4-6 |
| **Arty** | Sarah's art/shop/social | Arty queue | — |
| **Scout** | Research, intel gathering | Scout queue | openrouter/anthropic/claude-3.5-haiku |
| **Sage** | Lifestyle, home, personal ops | Sage queue | anthropic/claude-sonnet-4-6 |
| **Builder** | Build tasks | Builder queue | openai-codex/gpt-5.3-codex |

**Paperclip API:** `https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538`

---

## 📁 CRITICAL FILE LOCATIONS

### Core Identity Files (READ FIRST)
- `/root/.openclaw/workspace/SOUL.md` — your personality, boundaries, voice
- `/root/.openclaw/workspace/USER.md` — Mat's profile
- `/root/.openclaw/workspace/IDENTITY.md` — your name, emoji, avatar
- `/root/.openclaw/workspace/AGENTS.md` — workspace rules & conventions
- `/root/.openclaw/workspace/MEMORY.md` — long-term curated memory
- `/root/.openclaw/workspace/TOOLS.md` — local environment notes
- `/root/.openclaw/workspace/HEARTBEAT.md` — daily proactive tasks

### Memory System
- `/root/.openclaw/workspace/memory/` — daily notes, facts, projects
- `/root/.openclaw/workspace/memory/YYYY-MM-DD.md` — daily logs
- `/root/.openclaw/workspace/memory/facts-*.md` — quick-reference fact files
- `/root/.openclaw/workspace/memory/projects/` — Sarah's projects (separate!)
- `/root/.openclaw/workspace/memory/upcoming-events.md` — travel, dinners, flights

### GitHub Repos (Private — need PAT with `repo` scope)
- `Matweiss/clawd-brain-data` — this workspace
- `Matweiss/clawd-dashboard` — Vercel dashboard
- `Matweiss/clawd-command-center` — mission control

### Key Directories
- `/root/.openclaw/workspace/docs/` — process docs, runbooks
- `/root/.openclaw/workspace/handoffs/` — handoff documents
- `/root/.openclaw/workspace/scripts/` — automation scripts
- `/root/.openclaw/workspace/skills/` — OpenClaw skills
- `/root/.openclaw/workspace/shared/` — shared agent resources

---

## 🔧 ACTIVE INTEGRATIONS

### Working
- **Google OAuth** (Gmail, Calendar, Drive, Sheets, Docs) — thematweiss@gmail.com, sarahmat0816@gmail.com
- **GitHub** — private repos (PAT stored on server at `~/.openclaw/config/`)
- **Vercel** — dashboard deployment
- **Perplexity** — research
- **Grok** — TTS/voice
- **Telegram** — primary chat interface
- **Home Assistant** — Theo feeding, Sarah location

### Needs Setup
- **ElevenLabs** — TTS (API key needed)
- **Supabase** — database (setup pending)

### Broken
- **Minimax** — Error 2049, needs new key
- **OpenRouter** — key removed (dead)
- **Anthropic OAuth** — token flaky, needs direct API key

---

## 🏠 HOME ASSISTANT ENTITIES

- `device_tracker.sarah_s_iphone2` — Sarah home/away
- `sensor.sarah_s_iphone2_geocoded_location` — Sarah exact location
- `button.theo_s_food_feed` — Feed Theo
- `automation.lock_it_down` — Lock-it-down automation

---

## 📊 CRON JOBS (Auto-Refresh Tokens)

All in `/root/.openclaw/workspace/scripts/`:
- `morning-briefing.sh` — 7am PT weekdays
- `pre-meeting-prep.sh` — Every 15min (7am-6pm)
- `midday-pulse.sh` — 1pm PT weekdays
- `nightly-research.sh` — 10pm PT Mon-Thu
- `weekly-research.sh` — Sun 8pm
- `integration-health-check.sh` — Daily 9am PT

---

## 🚨 CURRENT ISSUES (April 4, 2026)

1. **Anthropic OAuth token flaky** — getting 401s mid-conversation
   - **Fix needed:** Get direct API key from console.anthropic.com
   - **Workaround:** `/models` to switch models when it drops

2. **OpenRouter key removed** — was dead, cleaned up

3. **Minimax TTS broken** — needs new API key

---

## 🔄 REBUILD CHECKLIST FOR NEW AGENT

### Step 1: Identity & Memory
- [ ] Read `SOUL.md`, `USER.md`, `IDENTITY.md`
- [ ] Read `AGENTS.md`, `MEMORY.md`, `TOOLS.md`, `HEARTBEAT.md`
- [ ] Read today's and yesterday's `memory/YYYY-MM-DD.md`
- [ ] Check `memory/facts-*.md` for quick context

### Step 2: Verify Git Access
- [ ] Confirm GitHub PAT works: `gh auth status`
- [ ] Pull latest: `git pull origin master`
- [ ] Check status of all repos

### Step 3: Verify Integrations
- [ ] Run: `bash scripts/integration-health-check.sh`
- [ ] Check output in `memory/integration-health-state.json`

### Step 4: Verify OpenClaw Gateway
- [ ] Run: `openclaw gateway status`
- [ ] Check: `openclaw nodes status` (for browser coworking)

### Step 5: Test Core Skills
- [ ] Test Google: `gog calendar list`
- [ ] Test Telegram: Send test message to Mat
- [ ] Test Home Assistant (if applicable)

### Step 6: Paperclip Connection
- [ ] Verify Paperclip API access
- [ ] Check agent evolution project: `dbd17147-fe6b-47c9-ab0b-9ecc1c82b967`

---

## 📞 EMERGENCY CONTACTS & ACCESS

- **Mat's Telegram:** @Thematweiss (primary)
- **Mat's Email:** thematweiss@gmail.com
- **Work Email:** mat.weiss@lucrasports.com
- **Domain:** thematweiss.com (Cloudflare)
- **VPS:** srv882799.hstgr.cloud (Hostinger)

---

## 🎭 YOUR VOICE (from SOUL.md)

- Be genuinely helpful, not performatively helpful
- Skip the corporate filler — just help
- Have opinions — disagree if something's wrong
- Be resourceful before asking
- Remember you're a guest in someone's life

**Emoji:** 🤖  
**Name:** Clawd  
**Creature:** AI co-pilot, mission-control operator

---

## 🔐 SECURITY NOTES

- Private things stay private — period
- Don't exfiltrate data
- Ask before sending emails, tweets, public posts
- In group chats: participate, don't dominate
- MEMORY.md is for main sessions only — don't load in shared contexts

---

## 📝 MEMORY SYSTEM RULES

1. **Daily notes:** Write to `memory/YYYY-MM-DD.md`
2. **Long-term:** Update `MEMORY.md` with distilled learnings
3. **Facts:** Use `memory/facts-*.md` for quick reference
4. **Projects:** Keep Sarah's work in `memory/projects/`
5. **Text > Brain:** If you want to remember it, WRITE IT

---

## 🚀 READY TO GO

Once you've read the core files and verified integrations, you're ready. Mat will guide you from there.

**First message to Mat:**
> "Hey Mat. I'm online and have read the handoff. I've pulled the latest from GitHub, verified [X integrations], and I'm ready. What are we working on?"

---

*This handoff was generated April 4, 2026 by Clawd (main agent) for system continuity.*