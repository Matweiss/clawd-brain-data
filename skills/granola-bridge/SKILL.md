---
name: granola-bridge
description: Shared read-only Granola meeting access for VPS agents (Clawd and Luke). Reads from a synced local cache of the Mac Granola app data. Provides search_meetings, recent_meetings, get_meeting_details, get_meeting_notes, and health_check. Use when any agent needs meeting context, transcripts, or follow-up data from Granola.
---

# Granola Bridge

Shared read-only Granola integration for Clawd and Luke. Bridges the Mac-local Granola app to VPS agents via periodic cache sync — no hosted OAuth required.

## Architecture

```
Mac (Granola app)
  ~/Library/Application Support/Granola/cache-v6.json
         │
         │  granola-sync-push.sh (runs on Mac, cron or manual)
         │  rsync / scp over Tailscale
         ▼
VPS (this workspace)
  skills/granola-bridge/data/granola-cache.json
         │
         │  granola-query.py  ←── agents call this
         ▼
  stdout JSON results → Clawd / Luke
```

**Why this approach:**
- Hosted Granola MCP OAuth is blocked (invalid_scope on `mcp:tools`).
- Local Mac Granola path is proven: cache-v6.json is populated, `uvx granola-mcp-server` works in Claude Desktop.
- VPS agents cannot reach the Mac live (Tailscale offline / no persistent SSH tunnel).
- Cache sync is durable and concurrency-safe for multiple agents.

## Quick Start

```bash
# Health check
bash skills/granola-bridge/scripts/granola-health-check.sh

# Recent meetings (default 10)
python3 skills/granola-bridge/scripts/granola-query.py recent --limit 5

# Search
python3 skills/granola-bridge/scripts/granola-query.py search "DraftKings"

# Meeting details
python3 skills/granola-bridge/scripts/granola-query.py get <meeting-id>

# Meeting notes
python3 skills/granola-bridge/scripts/granola-query.py notes <meeting-id>

# Transcript
python3 skills/granola-bridge/scripts/granola-query.py transcript <meeting-id>
```

## Mac Setup (One-time, required to activate the bridge)

On Mat's Mac (run once, then optionally add to crontab):

```bash
# Push Granola cache to VPS
bash ~/openclaw-workspace/skills/granola-bridge/scripts/granola-sync-push.sh
```

Or from the VPS, trigger a push via OpenClaw notify:

```bash
openclaw nodes notify --node faea6e83a7e54cf758b8de36dfaf0db8284f7959718c2dbe86c8b2bf2d39ad6b \
  --title "Granola Sync" --body "Run: bash ~/path/to/granola-sync-push.sh"
```

To set up automatic syncing on the Mac (every 30 min):
```bash
# Add to Mac crontab
*/30 * * * * bash ~/openclaw-workspace/skills/granola-bridge/scripts/granola-sync-push.sh >> ~/Library/Logs/granola-sync.log 2>&1
```

## Health Check Interpretation

| Output | Meaning |
|--------|---------|
| `status: healthy` | Cache exists, ≤24h old, has meetings |
| `status: stale` | Cache exists but >24h old |
| `status: missing` | Cache not yet synced from Mac |
| `status: degraded` | Cache exists but empty/corrupt |

## Agent Usage Pattern

```python
import subprocess, json

def granola_recent(limit=10):
    r = subprocess.run(
        ["python3", "skills/granola-bridge/scripts/granola-query.py", "recent", "--limit", str(limit)],
        capture_output=True, text=True, cwd="/root/.openclaw/workspace"
    )
    return json.loads(r.stdout) if r.returncode == 0 else {"error": r.stderr}

def granola_search(query):
    r = subprocess.run(
        ["python3", "skills/granola-bridge/scripts/granola-query.py", "search", query],
        capture_output=True, text=True, cwd="/root/.openclaw/workspace"
    )
    return json.loads(r.stdout) if r.returncode == 0 else {"error": r.stderr}

def granola_health():
    r = subprocess.run(
        ["bash", "skills/granola-bridge/scripts/granola-health-check.sh"],
        capture_output=True, text=True, cwd="/root/.openclaw/workspace"
    )
    return json.loads(r.stdout) if r.returncode == 0 else {"status": "error", "detail": r.stderr}
```

## Known Limitations

- Read-only. No write/create/update operations.
- Cache freshness depends on Mac sync frequency (target: every 30 min during work hours).
- If Mac is off or Tailscale is down, last synced cache is served with `stale` health status.
- Transcript availability depends on whether Granola processed the meeting.
- Cache format may evolve as Granola updates the app; version is `cache-v6`.

## Future: MCP Proxy Upgrade Path

When the Mac is reliably reachable via Tailscale SSH:
1. Run `uvx granola-mcp-server` on Mac as a persistent service
2. Create SSH tunnel: `ssh -L 8765:localhost:8765 mat@100.94.231.120`
3. Update `granola-query.py` to hit `http://localhost:8765` instead of cache file
4. Health check detects which mode is active

## Files

- `scripts/granola-query.py` — query interface (recent, search, get, notes, transcript)
- `scripts/granola-health-check.sh` — freshness/availability check
- `scripts/granola-sync-push.sh` — Mac-side push script (run on Mac)
- `data/granola-cache.json` — synced cache (populated by push script)
- `data/.cache-meta.json` — sync metadata (timestamp, record count)
