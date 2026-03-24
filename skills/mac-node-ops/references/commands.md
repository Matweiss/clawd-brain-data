# Mac Node Ops command catalog

## Core idea

This skill wraps OpenClaw node commands so a paired Mac can be managed from the VPS without ad-hoc SSH.

## Native OpenClaw primitives

- `openclaw nodes status`
- `openclaw nodes describe --node <id>`
- `openclaw nodes run --node <id> --raw "<cmd>"`
- `openclaw nodes notify --node <id> --title "..." --body "..."`

## Suggested safe commands

### Read-only inspection

```bash
bash scripts/mac-node-ops.sh status
bash scripts/mac-node-ops.sh tailscale-status
bash scripts/mac-node-ops.sh ollama-status
bash scripts/mac-node-ops.sh launchagents
bash scripts/mac-node-ops.sh power
```

### Mutating but routine

```bash
bash scripts/mac-node-ops.sh ollama-restart
bash scripts/mac-node-ops.sh notify -- 'Testing Mac notification path'
```

### Escape hatch

```bash
bash scripts/mac-node-ops.sh run -- 'launchctl getenv OLLAMA_HOST'
bash scripts/mac-node-ops.sh run -- 'brew services list'
bash scripts/mac-node-ops.sh run -- 'defaults read com.apple.loginwindow 2>/dev/null | head'
```

## Notes

- The wrapper currently defaults to Mat's Mac node ID and can be overridden with `--node <id>` or `MAC_NODE_ID=<id>`.
- Keep raw commands concise and quote them as a single shell string.
- Prefer `openclaw nodes run` over separate SSH if the node is already paired and connected.
