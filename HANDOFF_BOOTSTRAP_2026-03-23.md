# New Agent Handoff Bootstrap — 2026-03-23

Use this when spinning up a fresh OpenClaw agent after recreating the VPS/container.

## Goal
Restore Mat's current OpenClaw state with minimal loss of memory, identity, projects, Telegram connectivity, Sarah agent state, and Foundry learnings.

## Source of truth
Primary recovery snapshot:
- `backup-snapshots/2026-03-23/`

Most important files:
- `backup-snapshots/2026-03-23/README-RESTORE.md`
- `backup-snapshots/2026-03-23/SNAPSHOT_SUMMARY.md`
- `backup-snapshots/2026-03-23/manifests/file-manifest.json`
- `backup-snapshots/2026-03-23/openclaw-state/openclaw.json`
- `backup-snapshots/2026-03-23/openclaw-state/credentials/`
- `backup-snapshots/2026-03-23/openclaw-state/telegram/`
- `backup-snapshots/2026-03-23/openclaw-state/identity/`
- `backup-snapshots/2026-03-23/openclaw-state/foundry/`
- `backup-snapshots/2026-03-23/openclaw-state/sarah-agent-bridge/`
- `backup-snapshots/2026-03-23/memory/`
- `backup-snapshots/2026-03-23/clawd-mission-control-v2/`
- `backup-snapshots/2026-03-23/clawd-brain-data/`
- `backup-snapshots/2026-03-23/dirty-worktree/` (latest loose/uncommitted state capture)

## Required restore behavior
The agent should:
1. Read the restore docs first.
2. Restore files from `backup-snapshots/2026-03-23/openclaw-state/` back into `~/.openclaw/` preserving paths.
3. Ensure workspace continuity files are present (`SOUL.md`, `USER.md`, `MEMORY.md`, `memory/`, `handoffs/`, `docs/`, `scripts/`).
4. Restore project trees, especially `clawd-mission-control-v2/`.
5. Restore Sarah bridge extension and verify Sarah-related state exists.
6. Restart OpenClaw gateway.
7. Verify Telegram/main account, Sarah account, cron jobs, local skills, Foundry hooks, and memory DB load successfully.
8. Report any missing secrets or environment dependencies instead of guessing.

## Validation checklist
- OpenClaw starts cleanly
- `openclaw.json` restored
- Telegram state restored
- device identity restored
- Foundry learnings/hooks restored
- Sarah agent bridge restored
- Memory files available
- Mission Control repo present
- Cron definitions present

## Operator note
This repo contains sensitive credentials and personal memory context. Keep it private.
