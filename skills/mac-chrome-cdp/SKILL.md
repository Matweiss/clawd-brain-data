---
name: mac-chrome-cdp
description: Scrape any website (including Cloudflare-protected ones that block the VPS IP) by routing through Mac Chrome via SSH-tunneled CDP port. Use when web_fetch returns 403/blocked, or when you need JS-rendered page content. Requires Mac node connected and SSH tunnel on port 28800.
---

# mac-chrome-cdp

Fetch page content from any URL via the user's Mac Chrome browser, bypassing Cloudflare and other VPS-IP blocks.

## When to use this

- `web_fetch` or `exec curl` returns 403, Cloudflare block, or CAPTCHA
- Site requires JS rendering (SPAs like Regal, CorePower, etc.)
- You need the actual rendered page text, not raw HTML

## Prerequisites

1. **Mac node connected:**
   ```bash
   openclaw nodes status
   ```
   Must show Mat's MacBook Pro as `connected`.

2. **CDP tunnel active** — the SSH reverse tunnel forwards Mac Chrome's CDP port to VPS `127.0.0.1:28800`. Verify:
   ```bash
   curl -s http://127.0.0.1:28800/json | python3 -c "import sys,json; pages=json.load(sys.stdin); print(f'{len(pages)} tabs open')"
   ```

3. **Python 3** — stdlib only, no pip needed.

## Quick usage

```bash
# Fetch any URL and get rendered page text
python3 /root/.openclaw/workspace/skills/mac-chrome-cdp/scripts/cdp-fetch.py "https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483?date=04-05-2026"

# List open Chrome tabs
python3 /root/.openclaw/workspace/skills/mac-chrome-cdp/scripts/cdp-fetch.py --list-tabs
```

## As a library (in other scripts)

```python
import sys
sys.path.insert(0, "/root/.openclaw/workspace/skills/mac-chrome-cdp/scripts")
from cdp_fetch import cdp_get_text

text, err = cdp_get_text("https://www.regmovies.com/...", cdp_port=28800, wait=7)
if err:
    print(f"Failed: {err}")
else:
    print(text[:2000])
```

## How it works

Chrome's DevTools Protocol (CDP) exposes a WebSocket API for each open tab. Normally Python websocket libraries add an `Origin` header that Chrome rejects (403). This skill uses a **raw socket WebSocket handshake** with no Origin header — Chrome accepts it.

The Mac SSH node is configured to reverse-forward Chrome's local CDP port to the VPS, making it available at `127.0.0.1:28800`.

## Known limitations

- Requires Mac node + SSH tunnel (not available if Mac is offline/sleeping)
- Page load wait is configurable but defaults to 7s (SPA render time)
- Only returns `document.body.innerText` — not screenshots or DOM structure
- For screenshots/DOM, use mcporter `mac-chrome` tools instead (when not timing out)

## Error handling

| Error | Meaning | Fix |
|-------|---------|-----|
| Connection refused port 28800 | SSH tunnel down | Mac node may be sleeping; check `openclaw nodes status` |
| 403 on WebSocket handshake | Unexpected origin rejection | Verify raw socket path in script |
| Empty text / short content | Page didn't finish loading | Increase `--wait` seconds |
| No usable tab | All tabs are extensions/blank | Navigate somewhere in Chrome first |

## Files

- `scripts/cdp-fetch.py` — CLI + importable library
- `scripts/regal-cdp-scrape.py` — Regal-specific multi-date scraper (from Pixel)

## SOP: Adding new skills

Per Mat's SOP — every new skill goes in both places:
1. `clawd-brain-data/skills/<skill-name>/` ← this repo
2. Paperclip Skill Marketplace (issue filed: efdd7dbc-cb7c-49b4-891e-fb8adf890fb6)

Agents comment `CLAIM: [agent-name]` on the Paperclip issue to self-select.
