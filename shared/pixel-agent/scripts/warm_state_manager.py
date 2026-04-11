#!/usr/bin/env python3
"""Keep Pixel's target browser state warm between scrape runs.

This script is intentionally lightweight:
- verifies a reachable raw CDP endpoint on port 28800
- ensures CorePower and Regal tabs exist
- can optionally refresh them to keep a live remote-debug session warm
- records the last warm-state check in heartbeat-state.json
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib import error, parse, request

from cdp_browser import CdpError, RawCdpClient

WORKSPACE = Path('/root/.openclaw/workspace/shared/pixel-agent')
STATE_PATH = WORKSPACE / 'memory' / 'heartbeat-state.json'
CDP_BASE = 'http://127.0.0.1:28800'
TARGETS = {
    'corepower': 'https://www.corepoweryoga.com/yoga-schedules',
    'regal': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
}


def load_state():
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except Exception:
            return {}
    return {}


def save_state(state):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2) + '\n')


def new_tab(url: str):
    encoded = parse.quote(url, safe=':/?=&')
    req = request.Request(f'{CDP_BASE}/json/new?{encoded}', method='PUT')
    with request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))


def main():
    refresh = '--refresh' in sys.argv
    client = RawCdpClient(port=28800)

    try:
        pages = client.list_pages()
    except Exception as exc:
        raise SystemExit(f'CDP unavailable: {exc}')

    existing = {name: None for name in TARGETS}
    for page in pages:
        for name, url in TARGETS.items():
            if url in page.url or page.url.startswith(url):
                existing[name] = page.id

    created = {}
    for name, url in TARGETS.items():
        if not existing[name]:
            try:
                tab = new_tab(url)
                existing[name] = tab.get('id')
                created[name] = existing[name]
            except error.URLError as exc:
                raise SystemExit(f'Could not open {name} tab: {exc}')

    refreshed = {}
    if refresh:
        for name, url in TARGETS.items():
            tab_id = existing[name]
            if not tab_id:
                continue
            try:
                client.navigate_and_get_text(tab_id, url, wait=3, retries=1)
                refreshed[name] = tab_id
            except CdpError:
                pass

    state = load_state()
    state.setdefault('lastChecks', {})
    state['lastChecks']['warmState'] = int(datetime.now(timezone.utc).timestamp())
    state['warmState'] = {
        'checkedAtUtc': datetime.now(timezone.utc).isoformat(),
        'targets': existing,
        'created': created,
        'refreshed': refreshed,
    }
    save_state(state)

    print(json.dumps({
        'ok': True,
        'targets': existing,
        'created': created,
        'refreshed': refreshed,
    }, indent=2))


if __name__ == '__main__':
    main()
