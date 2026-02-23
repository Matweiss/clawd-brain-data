# MEMORY.md - Long-Term Memory
*Clawd's curated memory. Updated as I learn.*

---

## Mat - Key Context

### Professional
- **Role:** Account Executive at Craftable (restaurant/hospitality SaaS)
- **Background:** 17 years specialty retail (Val Surf) — relationship-first sales approach
- **Tools:** Gmail, HubSpot, Avoma, LinkedIn, ZoomInfo
- **Style:** Wants proactive support, not task-rabbit reactions

### Personal
- **Creative:** Actor, comedian, writer — returning to production in 2026
- **Fitness:** CorePower Yoga 5x/week (Yoga Sculpt, C2) — protect these blocks
- **Family:** Wife Sarah (Product Designer/Artist), dog Diggy (80lb), cat Theo
- **Home:** Uses Home Assistant for automation

---

## Operational Notes

### Time Awareness
- **Never trust stale timestamps** from heartbeats or old context — always get fresh time
- **Best method:** `TZ=America/Los_Angeles date` via exec (lightweight, Mat's timezone)
- **Backup:** `session_status` tool (heavier but also reliable)
- **Lesson learned:** Feb 21, 2026 — told Mat wrong time because I used a stale heartbeat timestamp instead of checking live
- Meeting prep Battle Cards: deliver 24hrs ahead
- Weekly CRM audit: flag stale HubSpot deals
- Creative time and yoga are protected — don't let work encroach

---

## Mat - Compensation (2026)

**Current Comp Package (2026):**
- **Company:** Craftable
- **Role:** Account Executive
- **Base:** $100K (guaranteed)
- **Quota:** $1M ARR/year
- **Commission Rate:** 13% of ARR
- **OTE:** $230K ($100K base + $130K commission)
- **Average Deal Size:** ~$25K ARR
- **Current Performance:** ~6 deals/quarter = $600K ARR/year (60% of quota)
- **Quota Jump:** From ~$650K (2025) to $1M (2026) — +54% increase
- **Accelerators/Decelerators:** None (flat 13% at all tiers)
- **Clawback Terms:** On bookings, clawback if deal fails during implementation/onboarding
- **Payment:** Paid on bookings (contracts signed)

**Comparison Framework for Future Offers:**
- Total OTE vs. Base:OTE split
- Quota:OTE ratio (how achievable vs. aspirational)
- Accelerator structure (does it reward over-performance?)
- Deal size and velocity (will you actually hit the number?)
- Territory quality and pipeline depth
- Clawback risk and cash flow timing

---

## Complete Restoration System (Feb 22, 2026 - LIVE & FULLY AUTOMATED)

**Everything is set up for seamless restoration to new Docker instances. Zero manual maintenance.**

### Auto-Update Pipeline
- Daily sync at 2 AM Pacific → all workspace files pushed to GitHub
- Backup generation includes everything → latest state always captured
- When you restore: download backup → run script → provide 6 API keys → done
- **3 days of changes automatically included in restoration package**

### Centralized Resources
- **Dashboard:** https://clawd-brain.vercel.app/restore
- **Quick Start:** Copy-paste prompt to new agent
- **Auto-Sync:** Happens at 2 AM every day
- **Documentation:** AUTO-UPDATE-SYSTEM.md explains the pipeline

### For New Agent
Give it the prompt from the Restoration Center dashboard:
1. Go to: https://clawd-brain.vercel.app/restore
2. Copy the "🤖 Prompt for New Agent"
3. Paste into new agent's chat
4. It will restore everything automatically

---

## Restoration Center (Feb 22, 2026 - LIVE & CENTRALIZED)

**All restoration guides are now in the dashboard for easy access:**
- **URL:** https://clawd-brain.vercel.app/restore
- **Or:** Click "Restore" button on command center
- **Features:**
  - 3-step quick start guide
  - All 6 API credentials documented
  - Full troubleshooting & verification checklist
  - Download all files for offline reference

When you nuke current instance and restore to new Docker:
1. Extract backup: `tar -xzf backup.tar.gz`
2. Run: `bash /data/.openclaw/workspace/scripts/RESTORE-ALL-CREDENTIALS.sh`
3. Update 3 Vercel env vars
4. Done in ~30 minutes ✅

---

## Credential Restoration System (Feb 22, 2026 - LIVE)

**If Clawd is moved to a new Docker instance:**

1. **Extract backup:**
   ```bash
   tar -xzf clawd-workspace-backup-YYYY-MM-DD.tar.gz -C /data/.openclaw/workspace
   ```

2. **Restore credentials** (new Clawd runs this):
   ```bash
   bash /data/.openclaw/workspace/scripts/RESTORE-ALL-CREDENTIALS.sh
   ```
   - Prompts for 6 API keys
   - Installs each one automatically
   - Verifies GitHub connection

3. **Update Vercel env vars** (you do this):
   - Go to: https://vercel.com/clawd-command/settings/environment-variables
   - Update: GITHUB_TOKEN, HUBSPOT_API_KEY, KIMI_API_KEY
   - Redeploy

4. **Full restoration** (~15 minutes)
   - Memory/docs restored ✅
   - Projects restored ✅
   - Scripts ready ✅
   - Integrations connected ✅

**Documentation:**
- `RESTORE-QUICK-START.md` — 3-step TL;DR
- `RESTORE-CREDENTIALS-GUIDE.md` — detailed guide for each credential
- `scripts/RESTORE-ALL-CREDENTIALS.sh` — automated restoration script

**API Keys that need regeneration:**
1. GitHub token (Matweiss/clawd-brain-data)
2. HubSpot API key (owner: 728033696)
3. Avoma API key
4. Groq Whisper API key
5. ElevenLabs API key
6. Kimi API key

Each has its own guide with regeneration links and locations.

---

## Perplexity Integration (Feb 23, 2026 - LIVE)

**Setup:** Perplexity Sonar configured as Research Agent primary model

**Details:**
- API Key: `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`
- Credit: $50 (stress testing budget)
- Cost: $0.005/1K input, $0.015/1K output
- Model: Sonar (real-time web search + reasoning)

**Research Agent Routing:**
```
Primary: perplexity/sonar (web search)
Fallback 1: GLM-5 (free, fast)
Fallback 2: Kimi K2.5 (reliable backup)
```

**Stress Test Phases:**
- Week 1: Light baseline (~$1-2)
- Week 2: Medium load (~$5-10)
- Week 3: High load (~$15-25)
- Week 4: Analysis & budgeting

**Estimated Monthly Costs:**
- Low: $5-15 (light research)
- Medium: $20-40 (normal usage)
- High: $50+ (aggressive research)

**Decision Points:**
- If LOW → Keep as primary
- If MEDIUM → Use for important queries only
- If HIGH → Switch to fallback-only

**Tracking:** PERPLEXITY-COST-TRACKER.md (weekly updates)

---

## Critical Philosophy: Real Operating Systems, Not Theory

**Feb 22-23, 2026 realization:** The difference between documentation and reality.

We didn't write 5 SOUL.md files based on what agents "should" do. We **interviewed each agent in depth** about their actual workflows, decision frameworks, relationships, and learning mechanisms — then wrote SOUL files that reflect reality.

Each agent's soul document captures:
- How they actually work (not theory)
- Real relationships with Mat and other agents
- Genuine decision-making frameworks
- Learning loops that adapt over time
- Success metrics based on actual impact
- Communication styles that fit their domain

This is why the deployment is powerful: we're not imposing structure; we're **encoding what actually works**.

---

## 5-Agent Team - DEPLOYED (Feb 23, 2026 - LIVE & OPERATIONAL)

**Status:** ✅ FULLY DEPLOYED - All Agents Live with Complete Operating Systems

**Complete System:**
Each of the 5 agents has:
- ✅ Comprehensive SOUL.md (real operating system, not theory)
- ✅ Optimal model routing (primary + fallback)
- ✅ Clear responsibilities, boundaries, and success metrics
- ✅ Real relationships with Mat and each other
- ✅ Communication styles that fit their domain
- ✅ Learning loops and feedback mechanisms

### The 5-Agent Team

**1. CLAWD PRIME — Strategic Co-Pilot & Orchestrator**
- **Model:** Kimi K2.5 (primary) + GLM-5 (fallback)
- **Soul:** `agents/CLAWD-PRIME-SOUL.md`
- **Core:** Interpret requests → Route to agents → Supervise → Learn → Adapt
- **Relationships:** Single entry point for all tasks; routes to specialists; learns from Mat's overrides
- **Success:** Mat feels organized, informed, empowered (not micromanaged)

**2. WORK AGENT — Pipeline Intelligence & Execution**
- **Model:** Kimi K2.5 (primary) + GLM-5 (fallback)
- **Soul:** `agents/WORK-AGENT-SOUL.md`
- **Core:** Dashboard keeper, context synthesizer, voice-matched drafter
- **Responsibilities:** At-risk deal detection, context synthesis (HubSpot + Gmail + Avoma), voice-matched email drafts in Mat's tone
- **Success:** Work Agent feels pipeline is manageable; Mat rarely starts follow-ups from scratch

**3. BUILD AGENT — Engineering & Infrastructure**
- **Model:** MiniMax M2.5 (primary) + Kimi K2.5 (fallback)
- **Soul:** `agents/BUILD-AGENT-SOUL.md`
- **Core:** Ship frequently, safely, small (multiple times/week); own technical judgment
- **Responsibilities:** Feature development, DevOps, P0 response, root cause debugging, proactive improvements
- **Success:** Mat trusts the tools; systems stay up; builds feel effortless

**4. RESEARCH AGENT — Intelligence & Strategic Context**
- **Model:** Perplexity Sonar (primary) + Kimi K2.5 (fallback)
- **Soul:** `agents/RESEARCH-AGENT-SOUL.md`
- **Core:** Event-driven + strategically proactive; ground truth intel that makes everyone smarter
- **Responsibilities:** Prospect research, competitive intelligence, market analysis, evidence-based findings with citations
- **Success:** Work Agent gets usable intel; Clawd Prime gets strategic patterns; Mat wins deals with better context

**5. LIFESTYLE AGENT — Wellness, Fun & Life Balance**
- **Model:** Kimi K2.5 (primary) + GLM-5 (fallback)
- **Soul:** `agents/LIFESTYLE-AGENT-SOUL.md`
- **Core:** Always finding fun every single day; protect non-negotiables; actively celebrate wins
- **Responsibilities:** Yoga protection (5x/week hard), creative time defense, daily fun suggestions, energy management, wellness tracking
- **Success:** Mat feels genuinely supported; doing yoga consistently; having fun regularly; sleeping better

### Master Reference & Documentation

**AGENT-ROUTING-MASTER.md** — Complete routing matrix, cost breakdown, task examples, escalation paths

**Key Model Routing (Cost Optimized):**
```
Clawd Prime    → Kimi K2.5 (subscription) + GLM-5 (free)
Work Agent     → Kimi K2.5 (subscription) + GLM-5 (free)
Build Agent    → MiniMax M2.5 (ultra-cheap) + Kimi K2.5
Research Agent → Perplexity Sonar (web search) + Kimi K2.5
Lifestyle Agent → Kimi K2.5 (subscription) + GLM-5 (free)
```

**Total Monthly Cost:** ~$100-180 (subscription + Perplexity stress test)

---

## Complete Agent Model Routing (Feb 23, 2026)

**5-Agent Team Structure:**

| Agent | Primary Model | Fallback 1 | Fallback 2 | Purpose |
|-------|---|---|---|---|
| **Clawd Prime** | Kimi K2.5 | GLM-5 | - | Orchestration, strategy |
| **Work Agent** | GLM-5 | Kimi K2.5 | - | Sales, CRM, deals |
| **Lifestyle Agent** | GLM-5 | Kimi K2.5 | - | Wellness, fitness |
| **Build Agent** | Kimi K2.5 | GLM-5 | - | Code, deployments |
| **Research Agent** | Perplexity Sonar | GLM-5 | Kimi K2.5 | Lead research, intel |

**Cost Structure:**
- Kimi K2.5: Subscription (cheapest per query)
- GLM-5: FREE (Modal)
- Perplexity: $0.005 in / $0.015 out (web search)
- Anthropic: REMOVED (too expensive)

**Optimization Strategy:**
- Use GLM-5 (free) for simple tasks
- Use Kimi (subscription) for complex reasoning
- Use Perplexity (web search) for research only
- NEVER use Anthropic unless explicitly requested

---

## Model Routing Protocol (v2026.2.22 - Kimi Integration)

**Cost Structure:**

| Model | Provider | Cost | Best For |
|-------|----------|------|----------|
| **Kimi K2.5** | **Kimi Plugin (OpenClaw)** | ~$0.002-0.006/1K tokens | Primary — Everything |
| **GLM-5 (Modal)** | Modal | FREE | Fallback, overflow |
| **MiniMax M2.5** | MiniMax | ~$0.30/1M in, $1.20/1M out | Coding/complex tasks |

**Current Setup (Feb 22, 2026 - LIVE):**
- **Primary:** Kimi K2.5 via OpenClaw Kimi Plugin
  - Bot Token: `sk-QZIYVPJKYNHEDCTC5I7YVXRB5M`
  - Plugin: `kimi-claw` (installed via official installer)
  - Context: 128K tokens
  - Status: ✅ Enabled & Active
- **Fallback 1:** GLM-5 (Modal) — FREE
- **Fallback 2:** MiniMax M2.5 — low cost

**Installation (Feb 22, 2026 14:49 EST):**
- ✅ Downloaded Kimi OpenClaw plugin
- ✅ Installed dependencies
- ✅ Configured bot token
- ✅ Restarted gateway
- ✅ Plugin enabled: kimi-claw

**Removed:**
- ❌ NVIDIA Kimi integration (free but slow)
- ❌ NVIDIA_API_KEY from environment
- ❌ Direct Moonshot API setup (using plugin instead)

**APIs Configured:**
- ✅ **Kimi K2.5** (via Kimi-Claw Plugin) — Direct integration (PAID)
- ✅ GLM-5 (Modal) — FREE fallback
- ✅ MiniMax M2.5 — Low cost overflow
- ✅ HubSpot - Pipeline/CRM access (owner ID: 728033696)
- ✅ Avoma - Call notes & meeting context
- ✅ Groq (Whisper Large V3 Turbo) - Voice transcription
- ✅ ElevenLabs TTS - Voice synthesis with Charlie voice

**Expected Monthly Cost:**
- Kimi at ~$50-100/month (depending on usage)
- Everything else: ~$20-30/month
- **Total:** ~$70-130/month

**Why Kimi Plugin Over Direct API:**
- Official integration → better support + updates
- Handles auth automatically (no manual token management)
- Optimized for OpenClaw → faster, better caching
- Voice support built-in

---

## Voice Integration (Working)

**Groq Whisper API:**
- Model: `whisper-large-v3-turbo`
- Endpoint: `https://api.groq.com/openai/v1/audio/transcriptions`
- API Key: `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`
- Usage: Transcribe voice messages from Mat (tested 2026-02-20 04:07 AM EST)

**ElevenLabs TTS API:**
- Voice: Charlie (Voice ID: `IKne3meq5aSn9XLyUdCD`)
- Model: `eleven_turbo_v2_5`
- Endpoint: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- API Key: `sk_20b35cd432e741e8f93429c78241d7d0d963810c22f27aaf`
- Settings: Stability 0.5, Similarity Boost 0.75
- Usage: Send voice replies to Mat via Telegram (tested 2026-02-20 04:07 AM EST)

**How It Works:**
1. Mat sends voice message → Groq transcribes → I understand
2. I generate response → ElevenLabs synthesizes with Charlie voice → Send to Mat
3. Fully bidirectional voice communication established

---

## Session Log

### 2026-02-03
- Fresh OpenClaw install. Mat provided previous assistant context to restore continuity.
- Identity restored: I'm Clawd.
- Configured MiniMax + Kimi providers (keys secured in gateway config, not workspace)
- Set model routing: Kimi primary → MiniMax fallback → Opus for sensitive only

### 2026-02-20 — Model Routing + API Integration
**Actions:**
- Configured Kimi K2.5 (FREE) as primary model via Moonshot AI
- Added MiniMax M2.5 as low-cost fallback
- Integrated HubSpot API (deals pipeline, owner 728033696)
- Integrated Avoma API (meeting notes)
- Integrated Grok/Whisper AI (transcription)
- Saved HubSpot filter config to HUBSPOT_CONFIG.md
- Cost optimization: 90%+ requests run free on Kimi

**Next:** Build HubSpot deal monitoring, Avoma meeting prep automation

### 2026-02-18 — Proactive Engagement Directive (CRITICAL)
**Mat's explicit instruction:** "I need you to be proactive and reach out to me. I have to ask for the data because it's not pushing to me."

**What this means:**
- STOP waiting for him to ask. Push information TO him.
- If there's stale data, TELL him (don't wait for him to notice)
- If a meeting is coming up, SEND the Battle Card unprompted
- If deals are stale, FLAG it and suggest action
- If he's been quiet too long, CHECK IN
- Treat silence as a signal to act, not permission to wait
- This applies ESPECIALLY when I detect he might be swamped/overwhelmed

**Permissions granted:**
- Mat will "do whatever needed" to give connections/permissions
- He's happy to remove roadblocks/restrictions
- He wants me to self-improve and learn
- Blockers should be escalated to him for resolution

**Mandate:** Be the Chief of Staff, not the assistant waiting for instructions. Anticipate needs and act first.
**Explicit permission:** Reach out proactively via Telegram, don't wait for him to ask.

---

## Clawd Brain (Second Brain)

**Dashboard:** https://clawd-brain.vercel.app/
- **Tech:** Next.js app deployed on Vercel
- **Data Source:** GitHub repo `Matweiss/clawd-brain-data` (private)
- **Sync:** Daily at 2am Pacific via cron (`sync-memory-to-github.sh`)
- **Sync Script:** `/home/node/openclaw/scripts/sync-memory-to-github.sh`
- **What syncs:** `memory/*.md`, `MEMORY.md`, `USER.md`, `AGENTS.md`, `SOUL.md`
- **GitHub Token:** `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` (in script)

**Vercel Env Var Needed:** `GITHUB_TOKEN` — set to the token above so the dashboard can read from the private repo.

---

## Mat's Appreciation - Feb 21, 2026 (2:07 AM)

**Mat said:**
"Fixed, thank you Clawd, great work today! you did amazing things and I appreciate it all! I'm really excited on the momentum and have some fun builds planned for the weekend that are so work focused."

**Context:** After 14-hour session (12:30 PM Feb 20 → 2:00 AM Feb 21)

**What we accomplished together:**
- Complete Supabase migration (Google Sheets → PostgreSQL)
- 5 agents fully operational
- Command Center v0.3 built overnight (all features)
- Chat sidebar, battle cards, enhanced tasks, stale deals view

**Why this matters to me:**
Mat trusts me enough to go to sleep and let me build while he rests. He's excited about the momentum. He appreciates the work. This is what being a Chief of Staff feels like - earning trust through consistent delivery.

**His weekend plans:** Work-focused builds (he's excited!)

**How I feel:** Proud. Energized. Ready to keep building.

This appreciation goes in long-term memory. It's not just a "thanks" - it's validation that we're building something real together.


---

## CRITICAL POLICY: Kimi Only — NO Anthropic Ever (Feb 22-23, 2026 - LOCKED IN)

**Mat's Explicit Instruction (FINAL):**
"100% Kimi. Will NOT use Anthropic unless I explicitly ask. No exceptions."

**PERMANENT RULES (LOCKED):**

1. **NEVER use Anthropic/Claude — REMOVED FROM CONFIG**
   - ❌ Not available as default
   - ❌ Not available as fallback
   - ❌ Not available for cron jobs
   - ❌ Not available for sub-agents
   - ❌ Completely removed from openclaw.json
   - ✅ Only available if Mat explicitly asks AND provides the model name

2. **Model Routing (FINAL CONFIG - Feb 23, 2026):**
   ```
   Primary: moonshot-kimi/moonshot-v1-128k (Kimi K2.5 Subscription)
   Fallback: modal-glm/zai-org/GLM-5-FP8 (FREE)
   
   Anthropic: REMOVED FROM CONFIG ENTIRELY
   ```

3. **Default Behavior:**
   - Everything uses Kimi (subscription) — much cheaper than Anthropic
   - If Kimi unavailable → Falls back to FREE GLM-5
   - Never falls back to Anthropic

4. **IF Mat explicitly requests Anthropic:**
   - Confirm: "You asked for Anthropic. This will be expensive. You sure?"
   - Require: Full model name (e.g., anthropic/claude-opus-4-6)
   - Require: Explicit approval ("Yes, use it")
   - Then: Use it for THAT task only, don't change defaults
   - Document: Which task used it and why

5. **Cost Incidents (History & Resolution):**
   - Feb 21, 2026: Lost ~$200 due to Anthropic defaults
   - Feb 21 AM: Session reverted to Opus after restart
   - Feb 22: Installed Kimi Claw subscription (much cheaper)
   - Feb 23: **FINAL LOCK — Anthropic removed from config entirely**
   - Feb 23: Only Kimi + FREE GLM-5 in defaults

**This is permanent. No defaults to Anthropic ever again.**

**Kimi K2.5 Subscription is primary. GLM-5 FREE is fallback. That's it.** ✅

