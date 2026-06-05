#!/usr/bin/env python3
"""Fetch a YouTube transcript via the Supadata API (works from the VPS — no IP block).

Key resolution order:
  1. env SUPADATA_API_KEY
  2. file scripts/.secrets/supadata.env  (line: SUPADATA_API_KEY=...)

Usage:
  scripts/yt-transcript.py <youtube_url_or_id> [--lang en] [--json]
"""
from __future__ import annotations
import argparse, json, os, re, sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = 'https://api.supadata.ai/v1/youtube/transcript'
KEY_FILE = Path(__file__).resolve().parent / '.secrets' / 'supadata.env'


def load_key() -> str:
    if os.environ.get('SUPADATA_API_KEY'):
        return os.environ['SUPADATA_API_KEY'].strip()
    if KEY_FILE.exists():
        for line in KEY_FILE.read_text().splitlines():
            m = re.match(r'^\s*SUPADATA_API_KEY\s*=\s*(.+)$', line)
            if m:
                return m.group(1).strip().strip('"').strip("'")
    return ''


def fetch(url_or_id: str, lang: str, key: str) -> dict:
    params = {'lang': lang}
    if re.match(r'^[A-Za-z0-9_-]{11}$', url_or_id):
        params['videoId'] = url_or_id
    else:
        params['url'] = url_or_id
    req = Request(f'{BASE}?{urlencode(params)}', headers={
        'x-api-key': key,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    })
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('video')
    p.add_argument('--lang', default='en')
    p.add_argument('--json', action='store_true')
    args = p.parse_args()

    key = load_key()
    if not key:
        print('ERROR: no Supadata API key. Set SUPADATA_API_KEY or write scripts/.secrets/supadata.env', file=sys.stderr)
        return 2
    try:
        data = fetch(args.video, args.lang, key)
    except HTTPError as e:
        body = e.read().decode()[:500]
        print(f'ERROR {e.code}: {body}', file=sys.stderr)
        if e.code == 429:
            print('(Supadata free-tier credits may be exhausted — 100/month.)', file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(data.get('content', '') or json.dumps(data))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
