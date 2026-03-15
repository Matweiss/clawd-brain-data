# Skill Install Decisions — 2026-03-15

Repo evaluated: `ArchieIndian/openclaw-superpowers`
Audit method: Full SOP review against `clawd-brain-data/docs/SKILL_SECURITY_AUDIT_SOP.md`
Overall verdict: **CAUTION** (selective install approved)

## Installed now (approved)

1. `skill-vetting` (core)
   - Value: pre-install security scanning
   - Risk: low

2. `prompt-injection-guard` (openclaw-native)
   - Value: external-content injection detection
   - Risk: low-medium

3. `context-budget-guard` (openclaw-native)
   - Value: context overflow prevention
   - Risk: low

4. `cron-hygiene` (openclaw-native)
   - Value: cron efficiency + session mode hygiene
   - Risk: low

5. `dangerous-action-guard` (openclaw-native)
   - Value: explicit confirmation gate for destructive actions
   - Risk: low-medium

## Deferred / not installed

- `workspace-integrity-guardian` (powerful file restore/write capability)
- `workflow-orchestration` (automation blast radius)
- `multi-agent-coordinator` (complex orchestration risk)
- `secrets-hygiene` (broad scanning scope; tune later)
- `channel-context-bridge` (cross-session persistence behavior)
- `obsidian-sync` (not needed currently; writes outside workspace)
- `create-skill` (self-modifying behavior; governance later)

## Technical install path used

Selected skills were copied into workspace skills directory:
`/root/.openclaw/workspace/skills/`

Loaded via OpenClaw as source: `openclaw-workspace`.

## Verification

`openclaw skills list` confirmed all five selected skills are `ready`.
