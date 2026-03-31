# Project: Switch to Anthropic as Default Model

**Created:** 2026-03-28  
**Target:** Monday 2026-03-30 (back from Arizona, before NYC trip — Mat flies Tue Mar 31 late night)  
**Status:** Planned

## Goal
Move from Kimi (broken tool calls) to Anthropic Sonnet as the primary Clawd model.
Upgrade Mat's Anthropic account to the $200/month Claude Max plan.

## Steps

### 1. Mat creates new Anthropic account (or upgrades existing)
- Go to console.anthropic.com
- Upgrade to **Claude Max ($200/month)**
- Generate a new API key

### 2. Update OpenClaw config with new token
- I'll update `/root/.openclaw/openclaw.json` with the new key
- Change default model from `kimi/kimi-for-coding` → `anthropic/claude-sonnet-4-6`
- Escalation path: `anthropic/claude-opus-4-6` for heavy tasks

### 3. Optionally remove Kimi
- Cancel Kimi Code subscription
- Remove `kimi/kimi-for-coding` from allowed models (or keep as optional chat-only)

### 4. Add free fallback (optional)
- Add Google Gemini provider (free tier) as fallback if Anthropic hits rate limits
- Requires Google API key from aistudio.google.com

### 5. Builder agent (future)
- Stand up a persistent coding/builder agent on GPT-4o or gpt-5.4
- Handles tool calls, file writes, coding tasks dispatched from Clawd
- See discussion: 2026-03-28 Telegram session

## Model Stack (target)
- **Default chat/assistant:** `anthropic/claude-sonnet-4-6`
- **Heavy reasoning:** `anthropic/claude-opus-4-6` (manual escalation)
- **Builder/coding agent:** OpenAI GPT (separate ACP agent)
- **Fallback:** Gemini free tier
- **Kimi:** Cancel or keep for reference

## Notes
- Mat currently paying: Anthropic $20/mo + OpenAI $20/mo + Kimi subscription
- Target: Anthropic $200/mo + OpenAI $20/mo (drop Kimi)
- Sonnet is already confirmed working with full tool support in OpenClaw
- Current Anthropic token works but is on the $20 plan (rate limits possible under heavy use)
