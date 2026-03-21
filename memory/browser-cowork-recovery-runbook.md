# Browser Cowork Recovery Runbook

## Correct architecture

For Mac-assisted cowork browsing with a VPS-hosted OpenClaw gateway:

- **VPS** runs the primary OpenClaw gateway
- **Mac** runs Chrome locally
- **Mac** connects to VPS as a **node host**
- Do **not** try to make the Mac gateway itself act like the remote node

## Correct live setup

### Mac terminal 1 — SSH tunnel to VPS gateway
```bash
ssh -N -L 14535:127.0.0.1:45350 root@srv882799.hstgr.cloud
```

### Mac terminal 2 — Node host
```bash
export OPENCLAW_GATEWAY_TOKEN="mat-relay-2026"
openclaw node run --host 127.0.0.1 --port 14535 --display-name "Mat's MacBook Pro"
```

### Verification
On Mac:
```bash
nc -vz 127.0.0.1 14535
```
Expected: success/open

On VPS:
```bash
openclaw nodes status
```
Expected:
- Known: 1
- Paired: 1
- Connected: 1
- Caps include browser/system

## Known anti-patterns (do NOT repeat)

### Wrong: using `openclaw gateway` on Mac as the node
This caused repeated confusion around:
- `gateway.mode=remote`
- `gateway.remote.url`
- token mismatch
- pairing required
- paired but disconnected state

The correct process is **`openclaw node run`**, not `openclaw gateway --allow-unconfigured`.

### Wrong: insecure remote ws:// directly to public host
OpenClaw correctly rejects plaintext non-loopback websocket targets.
Use the SSH tunnel to localhost instead.

## Schedule-pull workflow after browser recovery
1. Verify node connected from VPS
2. Attach browser profile on node
3. CorePower URL:
   - `https://www.corepoweryoga.com/yoga-schedules/studio`
   - use **Main** filter (Encino + Sherman Oaks)
4. Regal URL:
   - `https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483`
5. Write fresh snapshot to:
   - `memory/data/schedule-current.md`
6. Commit/push in `clawd-brain-data`
7. Deploy `clawd-mission-control-v2`

## Regal extraction caveat
Regal movie cards can mix multiple formats/showtime groups on the same visible page, so browser DOM extraction should:
- identify movie card boundaries more strictly
- dedupe showtimes
- avoid cross-card bleed
- preferably use stable data attributes or a hidden JSON payload if available
