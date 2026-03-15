# 2026-03-15 — Browser coworking breakthrough

After a long debugging session, live browser coworking was successfully established for VPS-hosted OpenClaw + Mac browser.

## Key insights

- Mac extension relay token must match **Mac local gateway token**, not VPS token.
- Node host auth to VPS uses VPS gateway token.
- Two-token model is expected in this architecture.
- Node connectivity (`openclaw nodes status`) is the decisive indicator for whether browser control can be routed to Mac.

## Final working pattern

- Mac Terminal A: SSH local tunnel to VPS gateway 45350
- Mac Terminal B: `openclaw node run --host 127.0.0.1 --port 45350` with `OPENCLAW_GATEWAY_TOKEN` set to VPS token
- Mac local extension: port 18792 + local gateway token
- VPS: connected node with browser cap, then browser actions routed to node

## Outcome

- Successfully opened CorePower from agent side
- Successfully pulled schedule snapshot including visible class list

A full step-by-step runbook was written to:
`handoffs/BROWSER_COWORK_SETUP_2026-03-15.md`
