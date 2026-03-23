# OpenClaw Recovery Snapshot — 2026-03-23

This snapshot is intended to restore Mat's OpenClaw state after deleting/recreating the VPS container with minimal context loss.

## Included

- `memory/` — daily notes, digests, chroma DB, dashboard state, archives
- `handoffs/` — recovery handoffs and operational notes
- `docs/` — project and deployment documentation
- `scripts/` — local recovery and memory tooling
- `config/` — workspace config used by tools
- `clawd-mission-control-v2/` — main mission control project
- `clawd-brain-data/` — historical brain/backup repo copy
- `openclaw-state/` — critical runtime state copied from `~/.openclaw/`

## openclaw-state contents

- `sarah-agent-bridge/` extension
- `foundry/` learnings, hooks, metrics, manifest
- `skills/` installed custom/local skills
- `cron/` scheduled job definitions and run logs
- `subagents/` subagent run registry
- `openclaw.json` and backup variants
- `node.json`
- `devices/`
- `telegram/`
- `credentials/`
- `identity/`
- `main.sqlite`

## Important note on secrets

This snapshot may contain sensitive tokens, bot credentials, device identity, and personal memory context. Treat the repo as highly sensitive.

## Restore outline

1. Recreate the VPS / container.
2. Clone this repo into `/root/.openclaw/workspace`.
3. Copy `backup-snapshots/2026-03-23/openclaw-state/*` back into `~/.openclaw/` preserving paths.
4. Restore key workspace directories (`memory`, `handoffs`, `docs`, `scripts`, `config`) if not already present from the repo clone.
5. Restore project directories as needed:
   - `clawd-mission-control-v2/`
   - `clawd-brain-data/`
6. Restart OpenClaw gateway.
7. Verify Telegram, cron, skills, Foundry hooks, and Sarah bridge extension load correctly.

## Priority restore targets

If doing a minimal restore first, start with:

1. `openclaw-state/openclaw.json`
2. `openclaw-state/credentials/`
3. `openclaw-state/telegram/`
4. `openclaw-state/identity/`
5. `openclaw-state/devices/`
6. `openclaw-state/foundry/`
7. `memory/`
8. `clawd-mission-control-v2/`
9. `openclaw-state/sarah-agent-bridge/`

## Validation checklist

- OpenClaw starts without config errors
- Telegram responds on `main` and `sarah` accounts if configured
- Memory files and digest history are present
- Foundry learnings and hooks are present
- Sarah bridge extension exists
- Mission Control repo opens and builds
- Cron jobs appear in scheduler config
