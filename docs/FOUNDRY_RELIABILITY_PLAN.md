# Foundry Reliability Plan

_Date: 2026-03-24_

## Goal
Reduce recurring tool-call failures in Foundry, especially:
- `web_search` validation failures
- `sessions_spawn` validation failures
- `read` missing/ENOENT path failures

## What I changed directly in Foundry
### 1. Better error-signature normalization
Patched `~/.openclaw/extensions/foundry-openclaw/index.ts` so Foundry groups recurring failures more reliably by normalizing:
- whitespace
- file paths
- validation prefix noise
- missing parameter variants
- ENOENT path tails

This should help:
- recurring failures cluster correctly
- learned patterns become reusable instead of fragmented
- RISE/crystallization trigger against fewer duplicate signatures

### 2. Reliability guard hook auto-install path
Added logic in Foundry's autonomous overseer to install a persistent hook:
- `reliability_guard.ts`

That hook injects tool-specific guidance before calls to:
- `web_search`
- `sessions_spawn`
- `read`

Guidance includes:
- exact `web_search` argument shape
- valid `sessions_spawn` runtime/model/agent usage
- `read` path/parameter reminders

## Validation note
The local TypeScript environment for the extension is incomplete for a full clean compile because module type dependencies are unavailable in this extension directory.
However, the edited code was syntax-checked far enough to fix template-string breakage introduced during patching.

## Recommendation
Restart the OpenClaw gateway so Foundry reloads the modified extension, then let real usage produce a small sample of new tool calls.
After that, inspect whether the recurring failures drop.

## If reliability improves
Next step:
- crystallize the strongest patterns into permanent hooks/tools

## If reliability does not improve enough
Next step:
- add argument-shape introspection from live tool schemas before Foundry emits guidance
- add explicit per-tool remediation tables inside Foundry
- evolve the web_search and sessions_spawn handling paths further
