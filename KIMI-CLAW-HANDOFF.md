# Kimi Claw Handoff Guide
**Date:** February 24, 2026  
**From:** Clawd (Docker VPS)  
**To:** Kimi Claw (Cloud)  
**Status:** Parallel Operation → Gradual Migration

---

## Quick Start (Kimi Claw Terminal)

```bash
# 1. Clone the workspace repo
git clone https://github.com/Matweiss/clawd-brain-data.git /data/.openclaw/workspace

# 2. Copy critical identity files
cp SOUL.md AGENTS.md USER.md MEMORY.md /path/to/kimi/workspace/

# 3. Copy agent SOUL files
cp agents/*-SOUL.md /path/to/kimi/workspace/agents/

# 4. Set environment variables in Kimi Cloud console
KIMI_API_KEY=sk-kimi-ZM8ts7f9JJNH3b9JyvmWI9tb7iU9hwnCcKSrHRGWFYeofaPMWE8LxEimmYGFsX3w
HUBSPOT_TOKEN=pat-na1-a249996e-eb7d-4184-841f-2759d28a8323
AVOMA_API_KEY=vh82rab620:2ci8lvop8u5duwc4u680
GROK_API_KEY=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
TELEGRAM_BOT_TOKEN=8308910172:AAFf-1JPjf2cYlwISWQFqRXp39-FzSW8Oa8

# 5. Create cron jobs in Kimi Cloud UI (see section below)
```

---

## Files to Copy to Kimi Claw

### Root Workspace Files (REQUIRED)
```
✅ SOUL.md                    — Clawd's core identity
✅ AGENTS.md                  — Agent management guidelines
✅ USER.md                    — Mat's profile & working style
✅ MEMORY.md                  — Long-term memory (curated)
✅ TOOLS.md                   — Local notes & infrastructure
✅ HEARTBEAT.md               — Periodic check tasks
```

### Agent Identity Files (REQUIRED)
```
✅ agents/CLAWD-PRIME-SOUL.md
✅ agents/WORK-AGENT-SOUL.md
✅ agents/LIFESTYLE-AGENT-SOUL.md
✅ agents/BUILD-AGENT-SOUL.md
✅ agents/RESEARCH-AGENT-SOUL.md
```

### Daily Memory (OPTIONAL but recommended)
```
📝 memory/2026-02-24.md       — Today's raw notes
📝 memory/2026-02-23.md       — Yesterday's notes
(Pull full memory/ folder to preserve continuity)
```

### Config Files (REFERENCE ONLY)
```
📋 openclaw.json              — Model config (for reference)
📋 cron/jobs.json             — Cron job structure (create in UI instead)
```

---

## Environment Variables (Set in Kimi Cloud Console)

**API Keys:**
```
KIMI_API_KEY=sk-kimi-ZM8ts7f9JJNH3b9JyvmWI9tb7iU9hwnCcKSrHRGWFYeofaPMWE8LxEimmYGFsX3w
HUBSPOT_TOKEN=pat-na1-a249996e-eb7d-4184-841f-2759d28a8323
AVOMA_API_KEY=vh82rab620:2ci8lvop8u5duwc4u680
GROK_API_KEY=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
MODAL_API_KEY=modalresearch_kVqbah1T8iVhx0ptuBJvjBXZEK5tWu3xIwa66nT8K_I
PERPLEXITY_API_KEY=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
MINIMAX_API_KEY=sk-api-4Lhk_TvcaNPgN7iXorx5WofHOeOKMvXXYb0mtXR1w0kd_Kk3wbvogkt8g5PwIv7kyNNQuSgdNbp2QP1XvSQHnSqZPSUWGaqggZHD1osyozo3YYjbqxFebjc
```

**GitHub:**
```
GITHUB_TOKEN=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
GITHUB_REPO=Matweiss/clawd-brain-data
```

**Telegram:**
```
TELEGRAM_BOT_TOKEN=8308910172:AAFf-1JPjf2cYlwISWQFqRXp39-FzSW8Oa8
TELEGRAM_CHAT_ID=8001393940
```

---

## Cron Jobs to Create in Kimi Cloud UI

Create these jobs in the Kimi Cloud cron/scheduler interface:

### 1. Work Agent - Hourly Pipeline Refresh
- **Schedule:** `0 8-17 * * 1-5` (8 AM - 5 PM, Mon-Fri, PT)
- **Agent:** work_agent.py
- **Message:** "Execute the Work Agent pipeline refresh script"
- **Model:** kimi-coding/k2p5
- **Delivery:** Telegram → 8001393940

### 2. Lifestyle Agent - Daily Wellness Check
- **Schedule:** `0 19 * * *` (7 PM daily, PT)
- **Agent:** lifestyle_agent.py
- **Message:** "Execute the Lifestyle Agent daily wellness check"
- **Model:** kimi-coding/k2p5
- **Delivery:** Telegram → 8001393940

### 3. Build Agent - Nightly Health Check
- **Schedule:** `0 23 * * *` (11 PM nightly, PT)
- **Agent:** build_agent.py
- **Message:** "Execute the Build Agent nightly infrastructure check"
- **Model:** kimi-coding/k2p5
- **Delivery:** Telegram → 8001393940

### 4. Morning Briefing - 7 AM Daily
- **Schedule:** `0 7 * * 1-5` (7 AM, Mon-Fri, PT)
- **Message:** "Generate morning briefing for Mat"
- **Model:** kimi-coding/k2p5
- **Delivery:** Telegram → 8001393940

### 5. Research Agent - Sunday Batch
- **Schedule:** `0 20 * * 0` (8 PM Sundays, PT)
- **Agent:** research_agent.py
- **Message:** "Execute the Research Agent batch processing"
- **Model:** kimi-coding/k2p5
- **Delivery:** Telegram → 8001393940

### 6. GitHub Memory Sync
- **Schedule:** `0 2 * * *` (2 AM daily, PT)
- **Message:** "Sync workspace memory to GitHub"
- **Model:** kimi-coding/k2p5
- **Delivery:** Silent (no Telegram)

---

## Validation Checklist (Week 1 - Parallel Operation)

- [ ] Kimi Claw repo cloned and synced from GitHub
- [ ] All env vars set in Kimi Cloud console
- [ ] All 6 cron jobs created and scheduled
- [ ] Work Agent runs and delivers to Telegram (test manually)
- [ ] Lifestyle Agent runs and delivers to Telegram (test manually)
- [ ] Both instances pulling/pushing memory to same GitHub repo
- [ ] Mat validates outputs look identical
- [ ] Costs are within budget (~$50-100/month on Kimi K2.5)

---

## Handoff Timeline

**Phase 1 (Now - Feb 25):** Setup & Validation
- Kimi Claw pulls all files from GitHub
- Both instances run in parallel
- Test agents on both sides

**Phase 2 (Feb 25 - Mar 3):** Monitor & Compare
- Watch both instances for 1 week
- Validate Telegram messages match
- Check HubSpot, Avoma, memory sync
- Confirm no data loss

**Phase 3 (Mar 3+):** Gradual Shutdown
- Once confident, disable Docker cron jobs
- Kimi Claw takes full load
- Keep Docker running idle (1-2 weeks) as safety net
- Final GitHub push from Docker
- Decommission Docker

---

## Troubleshooting

**If Kimi Claw agents don't run:**
- Check env vars are set
- Verify cron jobs in UI
- Check Telegram bot token is correct
- Look at Kimi Cloud logs

**If memory isn't syncing:**
- Verify GITHUB_TOKEN is valid
- Check repo permissions
- Confirm both instances have write access

**If you lose data:**
- Full backup in `/tmp/openclaw-backup-2026-02-23-1042.tar.gz`
- GitHub has full history
- Docker is still running (can restore anytime)

---

## Questions for Mat

1. Are you ready to test Kimi Claw agents this week?
2. How long should the parallel period be? (1 week? 2 weeks?)
3. Any agents you want to test first? (Work Agent is safest)

---

*Handoff prepared by Clawd (Docker VPS) at 2026-02-24 06:10 EST*
