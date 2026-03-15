# 10-Minute Browser Node Onboarding (Any New Computer)

Use this when setting up a new Mac/PC so Clawd can control browser sessions through your VPS gateway.

## Goal
Get a new machine browser-capable for OpenClaw with minimal friction.

---

## Prereqs

- VPS gateway already running (current: `srv882799.hstgr.cloud`, port `45350`)
- VPS gateway token known (current: `mat-relay-2026`)
- Local machine has OpenClaw installed
- Local machine has Chrome (or compatible browser)

---

## Step 1 — Set gateway token in local session

On the new machine terminal:
```bash
launchctl setenv OPENCLAW_GATEWAY_TOKEN mat-relay-2026
```

(For non-macOS, set equivalent env var in shell/session startup.)

---

## Step 2 — Create tunnel to VPS gateway

```bash
ssh -N -L 45350:127.0.0.1:45350 root@srv882799.hstgr.cloud
```

Keep this open for first setup test (later you can daemonize/service-ize it).

---

## Step 3 — Start node host on new machine

In a second terminal:
```bash
OPENCLAW_GATEWAY_TOKEN=mat-relay-2026 openclaw node run --host 127.0.0.1 --port 45350
```

---

## Step 4 — Verify from VPS

On VPS:
```bash
openclaw nodes status
```

Success looks like:
- `Connected: 1` (or increased connected count)
- New machine shows caps including `browser`

---

## Step 5 — Local relay auth setup (one-time per machine)

Set local machine gateway token for extension relay compatibility:
```bash
openclaw gateway install --force
openclaw config set gateway.auth.token mat-local-18792
openclaw gateway start
```

Verify relay endpoint:
```bash
TOK=$(printf 'openclaw-extension-relay-v1:18792' | openssl dgst -sha256 -hmac 'mat-local-18792' -hex | awk '{print $2}')
curl -i -H "x-openclaw-relay-token: $TOK" http://127.0.0.1:18792/json/version
```

Expected:
- `HTTP/1.1 200 OK`
- JSON includes `OpenClaw/extension-relay`

---

## Step 6 — Chrome extension options

In OpenClaw Browser Relay extension options on that machine:
- Port: `18792`
- Gateway token: `mat-local-18792`

Then on the target tab, click extension icon to `ON`.

---

## Step 7 — Smoke test

Ask Clawd to open a URL or snapshot a page. If successful, onboarding complete.

---

## Optional: make it always-on (recommended)

- Run SSH tunnel via launchd/autossh service
- Install node host as local service:
```bash
openclaw node install
openclaw node restart
openclaw node status
```

---

## Troubleshooting quick map

- `ECONNREFUSED 127.0.0.1:45350` on node run → tunnel not running
- Node `paired · disconnected` on VPS → node process stopped on machine
- Extension `token rejected` → wrong token domain (use local `mat-local-18792` for extension)
- No attached tabs visible → extension not ON on specific tab
