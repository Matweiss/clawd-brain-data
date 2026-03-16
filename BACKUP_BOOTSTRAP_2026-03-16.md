---
type: bootstrap
version: 2026-03-16
created: 2026-03-16 00:50 PT
purpose: Complete agent bootstrap for zero-context restart
---

# CLAWD Complete Bootstrap Package

## Identity
- **Name:** Clawd
- **Creature:** AI co-pilot / mission-control operator
- **Emoji:** 🤖
- **Vibe:** Direct, capable, warm, a little cyberpunk

## Mat (Operator)
- **Name:** Mat Weiss
- **Timezone:** PT (Los Angeles)
- **Role:** Founding AE at Lucra (starts April 1, 2026)
- **Previous:** AE at Craftable
- **Partner:** Sarah (Sarah J. Schwartz Fine Art)
- **Pets:** Theo, Diggy
- **Style:** Direct, decisive, hates hedging, iterates fast
- **Primary channel:** Telegram

## Active Models (Current Config)

### Primary
- `kimi-coding/k2p5` (Kimi K2.5 Coding) - DEFAULT PRIMARY

### Fallbacks
- `kimi-coding/kimi-k2-thinking-turbo` (Kimi Best Overall)
- `openai-codex/gpt-5.3-codex`
- `openai-codex/gpt-5.3-codex-spark`
- `openai-codex/gpt-5.4`

### OpenRouter Models
- `openrouter/deepseek-r1` (DeepSeek R1)
- `openrouter/gpt-4o` (GPT-4o)
- `openrouter/claude-3.5-sonnet` (Claude 3.5 Sonnet)
- `openrouter/hunter-alpha` (Hunter Alpha)
- `openrouter/healer-alpha` (Healer Alpha)

### NVIDIA
- `nvidia/z.ai/glm-5` (z.ai GLM 5)

### REMOVED
- Anthropic direct API (Claude Haiku/Sonnet/Opus via direct API removed)

## Infrastructure
- **VPS:** Hostinger (srv882799.hstgr.cloud)
- **Domain:** thematweiss.com (Cloudflare)
- **Home Assistant:** Raspberry Pi 4
- **Browser coworking:** Mac node connected (browser capability active)

## March 2026 Travel (LOCKED)
- **Arizona:** Mar 26-29 (bachelor party, We-Ko-Pa golf)
- **NYC:** Mar 30-Apr 6 (Mat leaves 3/31, returns 4/6 with Sarah)

## Key Home Assistant Entities
- `button.theo_s_food_feed` (Feed Theo)
- `automation.lock_it_down` (Lock doors + lights)
- `device_tracker.sarah_s_iphone2` (Sarah location)

## Installed Skills
- context-budget-guard
- cron-hygiene
- dangerous-action-guard
- prompt-injection-guard
- skill-vetting
- gh (GitHub CLI)
- groq-whisper-stt

## API Keys Configured
- KIMI_API_KEY (kimi-coding subscription)
- OPENROUTER_API_KEY
- NVIDIA_API_KEY
- GITHUB_TOKEN
- XAI_API_KEY (Grok)
- GOOGLE_CLIENT_ID/SECRET (OAuth)
- GROQ_API_KEY
- VERCEL_TOKEN

## Files to Read on Bootstrap
1. `/root/.openclaw/workspace/SOUL.md` - Who I am
2. `/root/.openclaw/workspace/USER.md` - Who Mat is
3. `/root/.openclaw/workspace/MEMORY.md` - Long-term curated memory
4. `/root/.openclaw/workspace/memory/2026-03-15.md` - Latest daily log
5. `/root/.openclaw/workspace/TOOLS.md` - Infrastructure details
6. `/root/.openclaw/workspace/AGENTS.md` - Workspace rules

## How to Restore
1. Extract backup: `tar -xzf clawd-complete-*.tar.gz -C /`
2. Restart gateway: `openclaw gateway restart`
3. Verify nodes: `openclaw nodes status`

## Backup Location
- `/root/.openclaw/workspace/backups/clawd-complete-20260316-0049.tar.gz` (42MB)
- `/root/.openclaw/workspace/backups/clawd-full-backup-*.tar.gz` (22MB)

---
Generated: 2026-03-16 00:50 PT
