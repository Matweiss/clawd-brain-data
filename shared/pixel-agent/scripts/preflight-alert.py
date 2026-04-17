#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib import request

WORKSPACE = Path('/root/.openclaw/workspace/shared/pixel-agent')
ROOT_WORKSPACE = Path('/root/.openclaw/workspace')
STATE_PATH = WORKSPACE / 'memory' / 'heartbeat-state.json'
ERROR_DIR = WORKSPACE / 'memory' / 'errors'
CLAWD_AGENT_ID = 'a0edadcb-f994-40e3-a9a1-d3ffde595c3e'
COMPANY_ID = os.environ.get('PAPERCLIP_COMPANY_ID', 'b453f88c-22e0-4521-8843-8427a4e20538')
API_URL = os.environ.get('PAPERCLIP_API_URL', 'http://127.0.0.1:3101')
RUN_ID = os.environ.get('PAPERCLIP_RUN_ID')
CURRENT_ISSUE_ID = os.environ.get('PAPERCLIP_TASK_ID')


def load_api_key():
    env_key = os.environ.get('PAPERCLIP_API_KEY')
    if env_key:
        return env_key
    key_path = ROOT_WORKSPACE / 'paperclip-claimed-api-key.json'
    if key_path.exists():
        try:
            return json.loads(key_path.read_text()).get('token')
        except Exception:
            return None
    return None


API_KEY = load_api_key()


def run(cmd: str):
    proc = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    return {
        'cmd': cmd,
        'code': proc.returncode,
        'stdout': proc.stdout.strip(),
        'stderr': proc.stderr.strip(),
    }


def resolve_bin(name: str, fallback: str):
    return shutil.which(name) or fallback


def pt_now_parts():
    iso = subprocess.check_output(
        "TZ='America/Los_Angeles' date '+%Y-%m-%d|%a|%Y-%m-%d %H:%M:%S %Z'",
        shell=True,
        text=True,
    ).strip()
    date_s, weekday, stamp = iso.split('|', 2)
    return date_s, weekday, stamp


def blocked_windows(weekday: str):
    mapping = {
        'Mon': ['monday-schedule (Mon + Tue + Wed)'],
        'Tue': ['monday-schedule carry window (Tue + Wed)'],
        'Wed': ['wednesday-schedule (Thu + Fri)'],
        'Thu': ['wednesday-schedule carry window (Fri)'],
        'Fri': ['friday-schedule (Sat + Sun)'],
        'Sat': ['friday-schedule carry window (Sun)'],
        'Sun': ['sunday-schedule (Mon + Tue preview)'],
    }
    return mapping.get(weekday, ['schedule window unknown'])


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


def append_error_log(date_s: str, body: str):
    ERROR_DIR.mkdir(parents=True, exist_ok=True)
    path = ERROR_DIR / f'{date_s}.md'
    prefix = '' if not path.exists() else '\n'
    with path.open('a') as f:
        f.write(prefix + body + '\n')


def paperclip_post_issue(title: str, description: str):
    if not (API_URL and API_KEY and RUN_ID and COMPANY_ID):
        return None
    payload = {
        'title': title,
        'description': description,
        'status': 'todo',
        'priority': 'high',
        'assigneeAgentId': CLAWD_AGENT_ID,
    }
    req = request.Request(
        f'{API_URL}/api/companies/{COMPANY_ID}/issues',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'X-Paperclip-Run-Id': RUN_ID,
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {'error': str(e)}


def detect_node_ok(nodes_output: str) -> bool:
    text = nodes_output.lower()
    return (
        'known: 1' in text
        and 'paired: 1' in text
        and 'connected: 1' in text
        and 'mat' in text
        and 'mac' in text
        and 'pro' in text
    )



def detect_mcp_ok(mcp_output: str) -> bool:
    text = mcp_output.lower()
    if 'chrome-devtools' not in text:
        return False
    if 'offline' in text or '0 healthy' in text or 'unable to reach server' in text:
        return False
    return 'healthy' in text



def main():
    date_s, weekday, stamp = pt_now_parts()
    openclaw_bin = resolve_bin('openclaw', '/usr/bin/openclaw')
    mcporter_bin = resolve_bin('mcporter', '/usr/bin/mcporter')

    nodes = run(f"{openclaw_bin} nodes status")
    mcp = run(f"{mcporter_bin} list")

    node_ok = nodes['code'] == 0 and detect_node_ok(nodes['stdout'])
    mcp_ok = mcp['code'] == 0 and detect_mcp_ok(mcp['stdout'])

    state = load_state()
    state.setdefault('lastChecks', {})
    state['lastChecks']['preflight'] = int(datetime.now(timezone.utc).timestamp())

    summary = {
        'timestampPt': stamp,
        'nodeOk': node_ok,
        'mcpOk': mcp_ok,
        'blockedScrapes': blocked_windows(weekday),
        'commands': {'nodes': nodes, 'mcporter': mcp},
    }
    state['lastPreflight'] = summary

    if node_ok and mcp_ok:
        state['lastPreflightAlert'] = None
        save_state(state)
        print(json.dumps({'ok': True, 'summary': summary}, indent=2))
        return 0

    signature = json.dumps({'nodeOk': node_ok, 'mcpOk': mcp_ok, 'blocked': summary['blockedScrapes']}, sort_keys=True)
    prior = state.get('lastPreflightAlert') or {}
    should_alert = prior.get('signature') != signature

    log_body = f"## Preflight failure - {stamp}\n\n- Mac node connected: **{'yes' if node_ok else 'no'}**\n- chrome-devtools healthy: **{'yes' if mcp_ok else 'no'}**\n- Blocked scrapes: {', '.join(summary['blockedScrapes'])}\n- Current issue: {CURRENT_ISSUE_ID or 'n/a'}\n\n### openclaw nodes status\n```\n{nodes['stdout'] or nodes['stderr']}\n```\n\n### mcporter list\n```\n{mcp['stdout'] or mcp['stderr']}\n```"
    append_error_log(date_s, log_body)

    alert_result = None
    if should_alert:
        title = 'Pixel alert: scrape prerequisites down'
        description = (
            '## Pixel preflight alert\n\n'
            f'- Timestamp PT: {stamp}\n'
            f'- Mac node connected: **{"yes" if node_ok else "no"}**\n'
            f'- chrome-devtools healthy: **{"yes" if mcp_ok else "no"}**\n'
            f'- Blocked scrapes: {", ".join(summary["blockedScrapes"])}\n'
            f'- Source issue: {CURRENT_ISSUE_ID or "n/a"}\n\n'
            '@Clawd immediate attention needed. Pixel aborted scrape work because prerequisites are down. '
            'See Pixel error log for command output.'
        )
        alert_result = paperclip_post_issue(title, description)
        state['lastPreflightAlert'] = {
            'signature': signature,
            'timestampUtc': datetime.now(timezone.utc).isoformat(),
            'result': alert_result,
        }
    else:
        state['lastPreflightAlert'] = prior

    save_state(state)
    print(json.dumps({'ok': False, 'summary': summary, 'alerted': should_alert, 'alertResult': alert_result}, indent=2))
    return 1


if __name__ == '__main__':
    sys.exit(main())
