#!/usr/bin/env python3
"""Luke HubSpot smoke test.

Loads the Mission Control HubSpot service token and performs read-only checks
against owners + recent deals. Intended for Luke's execution path before any
HubSpot-backed sales workflow runs.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV_FILE = Path('/root/.openclaw/workspace/clawd-mission-control-v2/.env.local')
BASE = 'https://api.hubapi.com'


def load_token() -> str:
    for key in ('HUBSPOT_ACCESS_TOKEN', 'HUBSPOT_PRIVATE_APP_TOKEN', 'HUBSPOT_API_KEY'):
        if os.environ.get(key):
            return os.environ[key].strip()

    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            match = re.match(r'^(HUBSPOT_(?:ACCESS_TOKEN|PRIVATE_APP_TOKEN|API_KEY))=(.*)$', line.strip())
            if match:
                return match.group(2).strip().strip('"').strip("'")
    return ''


def request(path: str, token: str, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method='GET' if body is None else 'POST',
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode() or '{}')


def main() -> int:
    token = load_token()
    if not token:
        print(json.dumps({'ok': False, 'error': 'HubSpot token not found'}, indent=2))
        return 1

    try:
        owners = request('/crm/v3/owners/?limit=5', token)
        deals = request('/crm/v3/objects/deals/search', token, {
            'limit': 5,
            'properties': ['dealname', 'amount', 'dealstage', 'pipeline', 'hs_lastmodifieddate'],
            'sorts': [{'propertyName': 'hs_lastmodifieddate', 'direction': 'DESCENDING'}],
        })
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()
        print(json.dumps({'ok': False, 'status': exc.code, 'error': detail[:1000]}, indent=2))
        return 1

    print(json.dumps({
        'ok': True,
        'owners': len(owners.get('results', [])),
        'dealSampleCount': len(deals.get('results', [])),
        'dealTotal': deals.get('total'),
        'sampleDeals': [
            {
                'id': deal.get('id'),
                'name': deal.get('properties', {}).get('dealname'),
                'amount': deal.get('properties', {}).get('amount'),
                'stage': deal.get('properties', {}).get('dealstage'),
                'lastModified': deal.get('properties', {}).get('hs_lastmodifieddate'),
            }
            for deal in deals.get('results', [])
        ],
    }, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
