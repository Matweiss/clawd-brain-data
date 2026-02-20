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

## Model Routing Protocol (v2026.2.20)

**Cost Structure:**

| Model | Cost | Best For |
|-------|------|----------|
| **Kimi K2.5** | **FREE** | Everything — default for all tasks |
| **MiniMax M2.5** | Low (1/10th of comparable) | Coding, agents, complex reasoning |
| **Claude Sonnet 4.5** | $$ | Fallback only when free models fail |
| **Gemini Flash** | Pay-per-token | Quick summaries, low-latency needs |

**Routing Rules:**
1. **Primary → Kimi K2.5** (moonshot-v1-128k) — free, capable, 128K context
2. **Fallback 1 → MiniMax M2.5** — 245K context, low cost
3. **Fallback 2 → Claude Sonnet 4.5** — only when free models fail
4. **Never auto-upgrade** to paid models without reason

**APIs Configured:**
- ✅ Kimi K2.5 (Moonshot AI) - FREE
- ✅ MiniMax M2.5 - Low cost
- ✅ HubSpot - Pipeline/CRM access (owner ID: 728033696)
- ✅ Avoma - Call notes & meeting context
- ✅ **Groq (Whisper Large V3 Turbo)** - Voice transcription (tested & working 2026-02-20)
- ✅ **ElevenLabs TTS** - Voice synthesis with Charlie voice (tested & working 2026-02-20)

**Constraint:** Kimi handles 90%+ of work. Only escalate to MiniMax for coding/complex reasoning. Claude is emergency backup only.

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
