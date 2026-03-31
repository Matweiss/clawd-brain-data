# 2026-03-25 Clean Baseline

## OpenClaw config reset
Performed a deliberate provider/model cleanup in `/root/.openclaw/openclaw.json` to remove stale Claude/bridge experiments and return the New CLI to a clean baseline.

### Removed
- All direct Anthropic auth/profile config
- All Anthropic model entries
- All OpenRouter provider/model entries
- NVIDIA `z.ai/glm-5`
- NVIDIA `nvidia/nemotron-3-nano-30b-a3b`

### Kept
- Kimi provider and all Kimi models
- OpenAI Codex models
- NVIDIA `nvidia/nemotron-3-super-120b-a12b`

### Defaults after cleanup
- Primary model: `kimi/k2p5`
- Remaining auth profiles:
  - `openai-codex:default`
  - `kimi:default`
- Remaining providers:
  - `kimi`
  - `nvidia`
  - `openai-codex` (agent model entries retained)

## Telegram verification
After gateway restart, Telegram/New CLI provider picker matched the cleaned config:
- `kimi (4)`
- `nvidia (1)`
- `openai-codex (3)`
- Anthropic gone
- OpenRouter gone

A follow-up Telegram test reply succeeded after cleanup, confirming the reply path still worked normally post-reset.

## Context
This reset was done because Anthropic/Claude options visible in the New CLI appeared to be leftovers from prior bridge experiments rather than a clean intentional provider setup. The goal was to establish a known-good baseline before reintroducing Anthropic in a single deliberate way.
