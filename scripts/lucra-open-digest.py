#!/usr/bin/env python3
"""Daily Lucra outreach digest -> Telegram.

Summarizes the last 24h of email opens (who opened, counts), flags hot leads
(>= HOT_THRESHOLD total opens), and is meant to run once a day via cron.

Reads the same state the open-tracker writes; pulls Telegram creds from the
tracker env file so it works headless.
"""
from __future__ import annotations
import json, os, re
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, urlopen

STATE = Path('/root/.openclaw/workspace/memory/lucra-email-open-tracker')
OPENS = STATE / 'opens.jsonl'
TOKENS = STATE / 'tokens.json'
ENV_FILE = Path('/etc/lucra-open-tracker.env')
HOT_THRESHOLD = int(os.environ.get('LUCRA_OPEN_HOT_THRESHOLD', '3'))


def creds() -> tuple[str, str]:
    tok = os.environ.get('TELEGRAM_BOT_TOKEN') or os.environ.get('LUCRA_OPEN_TRACKER_TELEGRAM_BOT_TOKEN', '')
    chat = os.environ.get('TELEGRAM_CHAT_ID') or os.environ.get('LUCRA_OPEN_TRACKER_TELEGRAM_CHAT_ID', '')
    if (not tok or not chat) and ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            m = re.match(r'^\s*([A-Z_]+)\s*=\s*(.+)$', line.strip())
            if not m:
                continue
            k, v = m.group(1), m.group(2).strip().strip('"').strip("'")
            if 'BOT_TOKEN' in k and not tok:
                tok = v
            if 'CHAT_ID' in k and not chat:
                chat = v
    return tok, chat or '8001393940'


def send(text: str) -> None:
    tok, chat = creds()
    if not tok:
        print('no telegram token; digest:\n' + text)
        return
    data = json.dumps({'chat_id': chat, 'text': text}).encode()
    req = Request(f'https://api.telegram.org/bot{tok}/sendMessage', data=data,
                  headers={'Content-Type': 'application/json'}, method='POST')
    with urlopen(req, timeout=15) as r:
        r.read()


def main() -> int:
    if not OPENS.exists():
        send('📊 Lucra outreach digest: no opens logged yet.')
        return 0
    tokens = json.loads(TOKENS.read_text()) if TOKENS.exists() else {}
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    today = defaultdict(int)
    total = defaultdict(int)
    for line in OPENS.read_text().splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if not (row.get('knownToken') and row.get('class') == 'prospect_open'):
            continue
        rec = tokens.get(row.get('tokenId'), {}).get('recipientEmail', '')
        if not rec or rec.endswith('@example.com'):
            continue
        total[rec] += 1
        try:
            ts = datetime.fromisoformat(row['openedAt'].replace('Z', '+00:00'))
            if ts >= cutoff:
                today[rec] += 1
        except Exception:
            pass

    lines = [f'📊 Lucra outreach — last 24h ({datetime.now(timezone.utc):%b %d})']
    if today:
        lines.append('\nOpened in last 24h:')
        for rec, n in sorted(today.items(), key=lambda x: -x[1]):
            hot = '  🔥' if total[rec] >= HOT_THRESHOLD else ''
            lines.append(f'• {rec}: {n} today ({total[rec]} total){hot}')
    else:
        lines.append('\nNo opens in the last 24h.')

    hot = [(r, c) for r, c in total.items() if c >= HOT_THRESHOLD]
    if hot:
        lines.append('\n🔥 Hot leads (3+ opens — act while warm):')
        for rec, n in sorted(hot, key=lambda x: -x[1]):
            lines.append(f'• {rec}: {n} opens')
    send('\n'.join(lines))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
