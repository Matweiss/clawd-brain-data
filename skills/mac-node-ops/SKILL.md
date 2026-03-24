---
name: mac-node-ops
description: Manage a paired macOS OpenClaw node from the VPS using `openclaw nodes run` and related node commands. Use when the user wants direct Mac administration, Ollama/Tailscale checks, LaunchAgent management, notifications, Homebrew/service diagnostics, or repeatable remote shell actions on a connected Mac node. Prefer this skill over ad-hoc SSH guidance when operating on a paired Mac node through OpenClaw.
---

# Mac Node Ops

Use this skill to operate a connected macOS node through OpenClaw's node CLI.

## Quick start

1. Confirm the node is connected:

```bash
openclaw nodes status
```

2. Prefer the bundled wrapper script for repeatable commands:

```bash
bash scripts/mac-node-ops.sh status
bash scripts/mac-node-ops.sh ollama-status
bash scripts/mac-node-ops.sh run -- 'uname -a'
```

3. Use high-level actions first. Use raw shell only when needed.

## Default node targeting

- The wrapper auto-detects the first connected node whose name contains `MacBook`, `Mac`, or `macOS`.
- Override target explicitly with `--node <id>` when multiple Macs exist.
- Discover details with:

```bash
openclaw nodes status
openclaw nodes describe --node <id>
```

## High-level actions

Use these first because they are safer and easier to reason about than arbitrary shell.

### Connectivity / identity

```bash
bash scripts/mac-node-ops.sh status
bash scripts/mac-node-ops.sh tailscale-status
bash scripts/mac-node-ops.sh notify -- 'Hello from OpenClaw'
```

### Ollama

```bash
bash scripts/mac-node-ops.sh ollama-status
bash scripts/mac-node-ops.sh ollama-restart
bash scripts/mac-node-ops.sh ollama-bind-check
```

### LaunchAgents / login env

```bash
bash scripts/mac-node-ops.sh launchagents
bash scripts/mac-node-ops.sh ollama-env
```

### Power / reliability

```bash
bash scripts/mac-node-ops.sh power
```

## Raw command escape hatch

When a high-level action does not exist, use:

```bash
bash scripts/mac-node-ops.sh run -- '<shell command>'
```

Examples:

```bash
bash scripts/mac-node-ops.sh run -- 'launchctl getenv OLLAMA_HOST'
bash scripts/mac-node-ops.sh run -- 'pgrep -fl Ollama || true'
bash scripts/mac-node-ops.sh run -- 'brew services list | sed -n "1,40p"'
```

## Safety rules

- Treat raw shell as privileged. Explain sensitive actions before using them.
- Avoid destructive commands unless the user explicitly asks.
- Prefer inspection/status commands before mutation.
- For persistent config, prefer `~/Library/LaunchAgents` over one-off shell state.
- Keep network exposure private; for Ollama prefer Tailscale/private interfaces, not public binds.

## Common workflows

### Diagnose Ollama on the Mac

1. `bash scripts/mac-node-ops.sh ollama-status`
2. `bash scripts/mac-node-ops.sh ollama-bind-check`
3. `bash scripts/mac-node-ops.sh ollama-env`
4. If needed: `bash scripts/mac-node-ops.sh ollama-restart`

### Verify post-reboot reliability

1. `bash scripts/mac-node-ops.sh ollama-env`
2. `bash scripts/mac-node-ops.sh launchagents`
3. `bash scripts/mac-node-ops.sh power`
4. `bash scripts/mac-node-ops.sh tailscale-status`

## Resource map

- `scripts/mac-node-ops.sh` — wrapper around `openclaw nodes run|notify|status`
- `references/commands.md` — command catalog and examples
