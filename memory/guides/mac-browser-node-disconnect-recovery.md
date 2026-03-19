# Mac Browser Node Disconnect Recovery Runbook

_Last updated: 2026-03-19_

This is the **do not panic** guide for restoring the Mac ↔ VPS browser coworking path if it disconnects.

## What this setup actually is

Working architecture:
- **VPS** = main OpenClaw gateway
- **Mac** = local browser host
- **Mac → VPS SSH tunnel** = safe local port forward into the VPS gateway
- **Mac node host** = `openclaw node run` connecting through that tunnel

The healthy chain is:
1. SSH tunnel is up on the Mac
2. Mac can reach `127.0.0.1:14535`
3. `openclaw node run` is running on the Mac
4. VPS shows the node as **Connected**

---

# Golden rules

## Do these first
- Start with the **manual two-terminal recovery** before touching LaunchAgents
- Verify each layer before moving to the next one
- Prefer **starting** or **restarting one piece** over unloading everything
- Keep one working shell open while testing the next step

## Do NOT do these first
- Do **not** start by running `launchctl bootout ...` on both services
- Do **not** unload the tunnel before confirming you have another working path
- Do **not** use `openclaw gateway --allow-unconfigured` on the Mac for this setup
- Do **not** point the Mac directly at an insecure public `ws://` endpoint

Why: unloading the tunnel or node service first can drop the exact path you need to recover.

---

# Known-good values

## VPS
- Host: `srv882799.hstgr.cloud`
- SSH user: `root`
- Gateway loopback port on VPS side: `45350`

## Mac local tunnel
- Local forwarded port: `14535`
- Expected local endpoint after tunnel starts: `127.0.0.1:14535`

## Node host
- Display name: `Mat's MacBook Pro`
- Gateway token used by node host: `mat-relay-2026`

## Script paths on Mac
- `~/Documents/obsidian-memory/scripts/ssh-tunnel.sh`
- `~/Documents/obsidian-memory/scripts/run-openclaw-node.sh`

## LaunchAgents on Mac
- `~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist`
- `~/Library/LaunchAgents/com.openclaw.node-host.plist`

## Log files on Mac
- `/tmp/openclaw-ssh-tunnel.log`
- `/tmp/openclaw-ssh-tunnel-error.log`
- `/tmp/openclaw-node-host.log`
- `/tmp/openclaw-node-host-error.log`

---

# Fastest safe recovery: manual mode

Use this first if things are disconnected.

## Terminal 1 on Mac — start the SSH tunnel
```bash
ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new -N -L 14535:127.0.0.1:45350 root@srv882799.hstgr.cloud
```

Expected behavior:
- The command stays running
- It usually prints nothing if healthy
- Leave this terminal open

If it fails immediately:
- check internet access on Mac
- confirm the VPS hostname resolves
- confirm SSH to the VPS still works:

```bash
ssh root@srv882799.hstgr.cloud
```

If SSH login works, exit back out and retry the tunnel command.

## Terminal 2 on Mac — verify the tunnel is alive
```bash
nc -vz 127.0.0.1 14535
```

Expected result:
- success
- open

If this fails, do **not** start the node host yet. Fix the tunnel first.

## Terminal 2 on Mac — start the node host manually
```bash
export OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"
openclaw node run --host 127.0.0.1 --port 14535 --display-name "Mat's MacBook Pro"
```

Expected behavior:
- The command stays running in the foreground
- It should connect without needing `gateway remote` config on the Mac

## On the VPS — verify the node connected
SSH into the VPS and run:

```bash
openclaw nodes status
```

Healthy signs:
- Known: 1
- Paired: 1
- Connected: 1
- Capabilities include browser/system

If the node is connected, browser coworking should be back.

---

# If manual recovery works, only then think about persistence

Once the two-terminal manual method works, you can move to LaunchAgents.

This is important because:
- manual mode proves the architecture works
- LaunchAgent issues are then just service-wrapper problems
- you avoid changing three things at once

---

# Safe LaunchAgent recovery procedure

Use this when you want the Mac to keep the tunnel and node host alive automatically.

## 1) Confirm the files exist on the Mac
```bash
ls -l ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
ls -l ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
ls -l ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
ls -l ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

## 2) Confirm script contents look right
```bash
sed -n '1,200p' ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
sed -n '1,200p' ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
```

Expected key lines:
- tunnel script forwards `14535` → `127.0.0.1:45350`
- node script exports `OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"`
- node script runs `openclaw node run --host 127.0.0.1 --port 14535`

## 3) Make scripts executable
```bash
chmod +x ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
chmod +x ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
```

## 4) Validate the plist files before loading
```bash
plutil -lint ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
plutil -lint ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

Both should report `OK`.

## 5) Bootstrap carefully
If these agents are not already loaded, use:

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

Then kick them explicitly:

```bash
launchctl kickstart -k gui/$UID/com.openclaw.ssh-tunnel
launchctl kickstart -k gui/$UID/com.openclaw.node-host
```

## 6) Check logs
```bash
tail -n 50 /tmp/openclaw-ssh-tunnel.log
tail -n 50 /tmp/openclaw-ssh-tunnel-error.log
tail -n 50 /tmp/openclaw-node-host.log
tail -n 50 /tmp/openclaw-node-host-error.log
```

## 7) Re-verify the chain
On Mac:
```bash
nc -vz 127.0.0.1 14535
```

On VPS:
```bash
openclaw nodes status
```

---

# If LaunchAgents already exist and may be stale

Do **not** begin by unloading both.

Use this order instead.

## Option A — just restart the node host first
If the tunnel appears healthy but the node is not connected:

```bash
launchctl kickstart -k gui/$UID/com.openclaw.node-host
```

Then check:
```bash
tail -n 50 /tmp/openclaw-node-host-error.log
openclaw nodes status
```

## Option B — restart the tunnel, then the node host
If `nc -vz 127.0.0.1 14535` fails:

```bash
launchctl kickstart -k gui/$UID/com.openclaw.ssh-tunnel
sleep 2
nc -vz 127.0.0.1 14535
launchctl kickstart -k gui/$UID/com.openclaw.node-host
```

This is safer than unloading both services outright.

## Option C — only if labels are wedged, bootout + bootstrap one at a time
Use this only if `kickstart` does not recover the service.

### Tunnel service
```bash
launchctl bootout gui/$UID/com.openclaw.ssh-tunnel 2>/dev/null || true
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
launchctl kickstart -k gui/$UID/com.openclaw.ssh-tunnel
```

Then confirm:
```bash
nc -vz 127.0.0.1 14535
```

### Node host service
Only after tunnel success:
```bash
launchctl bootout gui/$UID/com.openclaw.node-host 2>/dev/null || true
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.node-host.plist
launchctl kickstart -k gui/$UID/com.openclaw.node-host
```

Then confirm on VPS:
```bash
openclaw nodes status
```

---

# If files need to be recopied from the VPS

Run these on the **Mac**.

## Ensure target folders exist
```bash
mkdir -p ~/Documents/obsidian-memory/scripts
mkdir -p ~/Library/LaunchAgents
```

## Copy scripts from VPS to Mac
```bash
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/ssh-tunnel.sh ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/run-openclaw-node.sh ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
```

## Copy LaunchAgents from VPS to Mac
```bash
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/com.openclaw.ssh-tunnel.plist ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/com.openclaw.node-host.plist ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

## Re-check after copy
```bash
chmod +x ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
chmod +x ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
plutil -lint ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
plutil -lint ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

---

# VPS-side commands to know

SSH to the VPS:
```bash
ssh root@srv882799.hstgr.cloud
```

## Check whether OpenClaw is healthy on the VPS
```bash
openclaw status
```

## Check node visibility
```bash
openclaw nodes status
```

## If the gateway itself needs a restart
```bash
openclaw gateway restart
```

After gateway restart:
- reconnect the SSH tunnel on the Mac
- restart the node host on the Mac
- verify `openclaw nodes status` again

---

# Quick diagnosis matrix

## Symptom: SSH tunnel command exits immediately
Likely causes:
- no network
- bad SSH auth
- VPS unreachable
- remote port/path unavailable

Check:
```bash
ssh root@srv882799.hstgr.cloud
```

## Symptom: SSH works, but `nc -vz 127.0.0.1 14535` fails
Likely causes:
- tunnel command not actually running
- tunnel bound failed
- local port conflict

Check:
```bash
lsof -iTCP:14535 -sTCP:LISTEN -n -P
```

If another process owns 14535, stop that process or choose the expected tunnel script path.

## Symptom: tunnel is open, but node host will not connect
Likely causes:
- wrong token
- `openclaw` missing from PATH for LaunchAgent
- wrong command path

Check:
```bash
which openclaw
/opt/homebrew/bin/openclaw --version
tail -n 100 /tmp/openclaw-node-host-error.log
```

## Symptom: node host runs on Mac, but VPS still shows disconnected
Likely causes:
- gateway issue on VPS
- token mismatch
- stale node session after restart

Check on VPS:
```bash
openclaw status
openclaw nodes status
```

Then restart in this order:
1. VPS gateway if needed
2. Mac tunnel
3. Mac node host

---

# The minimum command set to memorize

## Mac
```bash
ssh -N -L 14535:127.0.0.1:45350 root@srv882799.hstgr.cloud
```

```bash
nc -vz 127.0.0.1 14535
```

```bash
export OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"
openclaw node run --host 127.0.0.1 --port 14535 --display-name "Mat's MacBook Pro"
```

## VPS
```bash
openclaw nodes status
```

---

# Recommended recovery order every time

1. **Do not unload anything yet**
2. On Mac, manually start the SSH tunnel
3. On Mac, verify `nc -vz 127.0.0.1 14535`
4. On Mac, manually start `openclaw node run`
5. On VPS, run `openclaw nodes status`
6. Only after manual recovery works, fix LaunchAgents/persistence

That order minimizes self-inflicted disconnects.

---

# Follow-up improvement to implement later

Once this is stable, improve the service wrappers so recovery is less manual:
- add a one-shot `recover-browser-node.sh`
- add a `status-browser-node.sh`
- possibly add safer LaunchAgent maintenance commands to a dedicated SOP

But for now, the two-terminal manual method is the most reliable break-glass path.
