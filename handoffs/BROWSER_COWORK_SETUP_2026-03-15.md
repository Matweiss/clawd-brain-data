# Browser Cowork Setup Runbook (VPS Gateway + Mac Browser)

Date: 2026-03-15  
Owner: Clawd + Mat  
Status: ✅ Working (verified)

---

## Goal
Enable live browser coworking from OpenClaw running on VPS to Mat's Mac browser tab (CorePower verified).

---

## Final architecture that worked

- VPS runs OpenClaw Gateway (port `45350`)
- Mac runs OpenClaw node host, connected to VPS through SSH local tunnel
- Chrome extension relay runs locally on Mac (`127.0.0.1:18792`)
- Agent browser control is routed through connected Mac node

**Critical realization:**
- Extension relay token on Mac must match **Mac local gateway token** (for relay auth check), not VPS token.
- Node-to-VPS auth uses **VPS gateway token**.

---

## Canonical working tokens/ports in this session

### VPS
- Gateway port: `45350`
- Browser control port: `45352`
- VPS gateway token used for node auth: `mat-relay-2026`

### Mac local
- Local gateway ports observed: `18789` (gateway), `18791` (browser ctl), `18792` (relay)
- Local relay auth token source: Mac `~/.openclaw/openclaw.json` gateway token
- Local token confirmed working for relay: `mat-local-18792`

---

## Exact recovery procedure (terminal-by-terminal)

## Terminal A (Mac) — tunnel to VPS gateway
```bash
ssh -N -L 45350:127.0.0.1:45350 root@srv882799.hstgr.cloud
```
Keep this terminal open.

## Terminal B (Mac) — node host to VPS gateway
```bash
OPENCLAW_GATEWAY_TOKEN=mat-relay-2026 openclaw node run --host 127.0.0.1 --port 45350
```
Keep this terminal open.

## VPS shell — confirm node connected
```bash
openclaw nodes status
```
Expected:
- `Connected: 1`
- node shows caps including `browser`

## Terminal D (Mac) — ensure local gateway/relay auth is healthy
If needed, reinstall local gateway service and set local token:
```bash
openclaw gateway install --force
openclaw config set gateway.auth.token mat-local-18792
openclaw gateway start
openclaw gateway status
```

Verify local relay auth:
```bash
TOK=$(printf 'openclaw-extension-relay-v1:18792' | openssl dgst -sha256 -hmac 'mat-local-18792' -hex | awk '{print $2}')
curl -i -H "x-openclaw-relay-token: $TOK" http://127.0.0.1:18792/json/version
```
Expected:
- `HTTP/1.1 200 OK`
- JSON includes `"Browser":"OpenClaw/extension-relay"`

## Chrome extension options (Mac)
Set:
- Port: `18792`
- Gateway token: `mat-local-18792`

Then on desired tab:
- click extension icon until badge shows `ON`

---

## Validation checks that indicate success

1) VPS:
```bash
openclaw nodes status
```
Shows connected browser-capable node.

2) Agent browser call from VPS session can open page on node:
- Opened CorePower URL successfully during session.

3) Snapshot from node returns schedule content:
- CorePower classes visible (Encino schedule captured).

---

## Common failure modes and fixes

### 1) `Gateway token rejected` in extension
Cause: using wrong token domain.
Fix:
- Extension token must match **Mac local gateway token** (not VPS token).

### 2) Node connect `ECONNREFUSED 127.0.0.1:45350`
Cause: Mac tunnel terminal not running.
Fix:
- Restart Terminal A SSH tunnel to 45350.

### 3) Node shows `paired · disconnected` on VPS
Cause: Terminal B stopped/crashed.
Fix:
- Restart node run command in Terminal B.

### 4) Relay auth 401 despite expected token
Cause: stale/embedded service config or wrong local token source.
Fix:
- `openclaw gateway install --force`
- reset local token
- restart local gateway
- re-test curl with derived relay token.

### 5) Confusion between control API vs relay API
- `http://127.0.0.1:45352/` (VPS browser control) returning JSON 200 is good, but this is **not** extension relay tab state.
- Extension relay validation is against local `18792` `/json/version` with derived relay token header.

---

## Security + hygiene

- Tokens were shared in chat during setup; rotate as needed.
- Keep relay and gateway bindings loopback/tunneled only.
- Prefer explicit per-surface tokens (local vs VPS) to avoid accidental cross-use.

---

## Proven outcome from this session

✅ Node connected to VPS (`Connected: 1`)  
✅ Browser-capable node available  
✅ CorePower tab/page opened via browser tool  
✅ Class schedule snapshot retrieved in-session

This is now a repeatable runbook.
