# Mac Browser Node Recovery — Short AI Handoff Version

Use this when the Mac ↔ VPS browser node is disconnected and you need another AI agent to walk you through recovery **step by step**.

## Goal
Restore this chain:
1. Mac SSH tunnel → VPS gateway
2. Mac local port `127.0.0.1:14535` open
3. Mac node host running
4. VPS shows node as connected

## Important warnings
- Do **not** begin by unloading LaunchAgents
- Do **not** run `launchctl bootout` first
- Do **not** use `openclaw gateway --allow-unconfigured` on the Mac
- Recover manually first, then repair persistence second

## Ground truth values
- VPS host: `srv882799.hstgr.cloud`
- VPS SSH user: `root`
- VPS gateway port: `45350`
- Mac forwarded local port: `14535`
- Node token: `mat-relay-2026`
- Node display name: `Mat's MacBook Pro`

## Step-by-step recovery procedure

### Step 1 — On the Mac, open Terminal window #1 and run:
```bash
ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new -N -L 14535:127.0.0.1:45350 root@srv882799.hstgr.cloud
```

Expected result:
- command stays running
- usually no output
- leave this window open

If it exits or errors:
- test plain SSH first:
```bash
ssh root@srv882799.hstgr.cloud
```
- if SSH works, exit and retry the tunnel command

### Step 2 — On the Mac, open Terminal window #2 and verify the tunnel:
```bash
nc -vz 127.0.0.1 14535
```

Expected result:
- success / open

If this fails:
- stop and fix the tunnel before doing anything else

### Step 3 — In Mac Terminal window #2, start the node host:
```bash
export OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"
openclaw node run --host 127.0.0.1 --port 14535 --display-name "Mat's MacBook Pro"
```

Expected result:
- process stays running in foreground
- no Mac gateway reconfiguration needed

### Step 4 — On the VPS, verify the node:
```bash
ssh root@srv882799.hstgr.cloud
openclaw nodes status
```

Expected healthy result:
- Known: 1
- Paired: 1
- Connected: 1
- browser/system capabilities present

If connected, browser coworking is restored.

---

## If files are missing on the Mac
Run these on the Mac:

```bash
mkdir -p ~/Documents/obsidian-memory/scripts
mkdir -p ~/Library/LaunchAgents
```

```bash
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/ssh-tunnel.sh ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/run-openclaw-node.sh ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/com.openclaw.ssh-tunnel.plist ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
scp root@srv882799.hstgr.cloud:/root/.openclaw/workspace/clawd-mission-control-v2/scripts/com.openclaw.node-host.plist ~/Library/LaunchAgents/com.openclaw.node-host.plist
chmod +x ~/Documents/obsidian-memory/scripts/ssh-tunnel.sh
chmod +x ~/Documents/obsidian-memory/scripts/run-openclaw-node.sh
plutil -lint ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
plutil -lint ~/Library/LaunchAgents/com.openclaw.node-host.plist
```

---

## If manual recovery works and you want to restore LaunchAgents
Run these on the Mac:

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.ssh-tunnel.plist
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.node-host.plist
launchctl kickstart -k gui/$UID/com.openclaw.ssh-tunnel
launchctl kickstart -k gui/$UID/com.openclaw.node-host
```

Then verify:
```bash
nc -vz 127.0.0.1 14535
ssh root@srv882799.hstgr.cloud
openclaw nodes status
```

---

## If LaunchAgents exist but seem broken
Try restart before unload:

```bash
launchctl kickstart -k gui/$UID/com.openclaw.ssh-tunnel
launchctl kickstart -k gui/$UID/com.openclaw.node-host
```

Check logs:
```bash
tail -n 50 /tmp/openclaw-ssh-tunnel.log
tail -n 50 /tmp/openclaw-ssh-tunnel-error.log
tail -n 50 /tmp/openclaw-node-host.log
tail -n 50 /tmp/openclaw-node-host-error.log
```

Only if absolutely necessary, unload/reload **one service at a time**.

---

## One-paragraph briefing to give another AI agent

We have a VPS-hosted OpenClaw gateway and a Mac that should connect as a browser-capable node host through an SSH tunnel. The safe recovery path is manual first: start an SSH tunnel on the Mac from local port `14535` to VPS `127.0.0.1:45350`, verify with `nc -vz 127.0.0.1 14535`, then run `openclaw node run --host 127.0.0.1 --port 14535 --display-name "Mat's MacBook Pro"` with `OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"`, then verify on the VPS with `openclaw nodes status`. Do not start by unloading LaunchAgents or reconfiguring the Mac as a remote gateway. Only after manual recovery works should you bootstrap or restart the LaunchAgents.
