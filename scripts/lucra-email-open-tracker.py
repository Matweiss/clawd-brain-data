#!/usr/bin/env python3
"""Lucra sent-email open tracker MVP.

Creates recipient-specific tracking pixel snippets, serves a transparent 1x1 GIF,
logs opens, and optionally notifies Mat via Telegram when a prospect-side open is
seen. This script does not send email.

Usage:
  # Create a tracked pixel snippet
  scripts/lucra-email-open-tracker.py create \
    --recipient prospect@example.com --company "Example Co" \
    --subject "Lucra follow-up" --base-url https://your-public-host.example.com

  # Run local endpoint server
  LUCRA_OPEN_TRACKER_PUBLIC_URL=https://your-public-host.example.com \
    scripts/lucra-email-open-tracker.py serve --host 127.0.0.1 --port 8787

  # Send a clearly marked Telegram test alert / dry-run
  scripts/lucra-email-open-tracker.py notify-test --dry-run

  # Run built-in behavior checks
  scripts/lucra-email-open-tracker.py self-test
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import html
import json
import os
import secrets
import sys
import threading
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

WORKSPACE = Path('/root/.openclaw/workspace')
STATE_DIR = WORKSPACE / 'memory/lucra-email-open-tracker'
TOKENS_PATH = STATE_DIR / 'tokens.json'
OPENS_PATH = STATE_DIR / 'opens.jsonl'
NOTIFY_STATE_PATH = STATE_DIR / 'notify-state.json'
ACCOUNT = 'mat.weiss@lucrasports.com'
INTERNAL_DOMAINS = {'lucrasports.com'}
HOT_THRESHOLD = int(os.environ.get('LUCRA_OPEN_HOT_THRESHOLD', '3'))  # opens that mark a lead "hot"
TRANSPARENT_GIF = base64.b64decode('R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==')


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def safe_email(value: str) -> str:
    return (value or '').strip().lower()


def domain_of(email: str) -> str:
    return email.split('@')[-1].lower() if '@' in email else ''


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text())


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + '\n')


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a') as f:
        f.write(json.dumps(row, sort_keys=True) + '\n')


def token_id() -> str:
    return secrets.token_urlsafe(18)


def email_hash(email: str) -> str:
    return hashlib.sha256(safe_email(email).encode()).hexdigest()[:16]


def request_fingerprint(ip: str, ua: str) -> str:
    return hashlib.sha256(f'{ip}|{ua}'.encode()).hexdigest()[:20]


def classify_open(token: dict[str, Any], ip: str, ua: str) -> tuple[str, list[str]]:
    reasons: list[str] = []
    recipient = safe_email(token.get('recipientEmail', ''))
    ua_l = (ua or '').lower()
    if domain_of(recipient) in INTERNAL_DOMAINS:
        reasons.append('tracked_recipient_is_internal')
    if 'googleimageproxy' in ua_l or 'googleusercontent' in ua_l:
        reasons.append('gmail_image_proxy')
    if any(s in ua_l for s in ['bot', 'crawler', 'spider', 'preview', 'scanner', 'security']):
        reasons.append('bot_or_security_scanner_user_agent')
    if token.get('suppressNotifications'):
        reasons.append('token_notifications_suppressed')
    # Gmail proxies hide final opener IP/user-agent. Still notify on first prospect-side
    # load because it is usually the best available signal for Gmail recipients.
    if 'tracked_recipient_is_internal' in reasons or 'token_notifications_suppressed' in reasons:
        return 'noise', reasons
    return 'prospect_open', reasons


def should_notify(token_id_value: str, open_class: str) -> bool:
    # Notify on EVERY prospect-side open (firehose mode — Mat wants every-open insight).
    return open_class == 'prospect_open'


def open_count(token_id_value: str) -> int:
    """How many prospect opens this token has logged so far (incl. the current one)."""
    if not OPENS_PATH.exists():
        return 1
    n = 0
    for line in OPENS_PATH.read_text().splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if row.get('tokenId') == token_id_value and row.get('knownToken') and row.get('class') == 'prospect_open':
            n += 1
    return max(n, 1)


def mark_notified(token_id_value: str) -> None:
    state = load_json(NOTIFY_STATE_PATH, {'notifiedTokens': {}})
    state.setdefault('notifiedTokens', {})[token_id_value] = now_iso()
    write_json(NOTIFY_STATE_PATH, state)


def has_escalated(token_id_value: str) -> bool:
    state = load_json(NOTIFY_STATE_PATH, {})
    return bool(state.get('escalatedTokens', {}).get(token_id_value))


def mark_escalated(token_id_value: str) -> None:
    state = load_json(NOTIFY_STATE_PATH, {})
    state.setdefault('escalatedTokens', {})[token_id_value] = now_iso()
    write_json(NOTIFY_STATE_PATH, state)


def notify_telegram(text: str, dry_run: bool = False) -> dict[str, Any]:
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN') or os.environ.get('LUCRA_OPEN_TRACKER_TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID') or os.environ.get('LUCRA_OPEN_TRACKER_TELEGRAM_CHAT_ID', '8001393940')
    if dry_run or not bot_token:
        return {'ok': False, 'dryRun': dry_run, 'reason': 'missing TELEGRAM_BOT_TOKEN' if not bot_token else 'dry-run'}
    payload = json.dumps({'chat_id': chat_id, 'text': text}).encode()
    req = Request(
        f'https://api.telegram.org/bot{bot_token}/sendMessage',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())


@dataclass
class TokenRecord:
    id: str
    createdAt: str
    account: str
    recipientEmail: str
    recipientHash: str
    company: str
    subject: str
    campaign: str
    notes: str
    suppressNotifications: bool = False


def pixel_html(token_id_value: str, base_url: str = '') -> tuple[str, str]:
    """Return (openUrl, htmlPixel) for a token id. Single source of truth for the pixel markup."""
    base = (base_url or os.environ.get('LUCRA_OPEN_TRACKER_PUBLIC_URL') or '').rstrip('/')
    path = f'/open.gif?{urlencode({"t": token_id_value})}'
    url = f'{base}{path}' if base else path
    pixel = f'<img src="{html.escape(url)}" width="1" height="1" alt="" style="display:none!important;max-height:1px;max-width:1px;opacity:0;overflow:hidden;border:0;" />'
    return url, pixel


def make_token(
    recipient: str,
    company: str = '',
    subject: str = '',
    campaign: str = 'lucra-outreach',
    notes: str = '',
    suppress: bool = False,
) -> dict[str, Any]:
    """Create and persist a recipient token record; returns the stored dict. Reused by the tracked-send tool."""
    recipient = safe_email(recipient)
    if not recipient or '@' not in recipient:
        raise ValueError('recipient must be an email address')
    record = TokenRecord(
        id=token_id(),
        createdAt=now_iso(),
        account=ACCOUNT,
        recipientEmail=recipient,
        recipientHash=email_hash(recipient),
        company=company or '',
        subject=subject or '',
        campaign=campaign or 'lucra-outreach',
        notes=notes or '',
        suppressNotifications=bool(suppress),
    )
    tokens = load_json(TOKENS_PATH, {})
    tokens[record.id] = asdict(record)
    write_json(TOKENS_PATH, tokens)
    return asdict(record)


def create_token(args: argparse.Namespace) -> dict[str, Any]:
    recipient = safe_email(args.recipient)
    if not recipient or '@' not in recipient:
        raise SystemExit('--recipient must be an email address')
    record_dict = make_token(
        recipient,
        company=args.company,
        subject=args.subject,
        campaign=args.campaign,
        notes=args.notes,
        suppress=bool(args.suppress_notifications),
    )
    url, pixel = pixel_html(record_dict['id'], args.base_url)
    result = {
        'ok': True,
        'token': record_dict,
        'openUrl': url,
        'htmlPixel': pixel,
        'usageNote': 'Paste htmlPixel near the bottom of the HTML email. Use one token per recipient for recipient-level attribution.',
    }
    print(json.dumps(result, indent=2))
    return result


def notify_open_async(token_id_value: str, token: dict[str, Any]) -> None:
    subject = token.get('subject') or 'Lucra email'
    company = token.get('company') or domain_of(token.get('recipientEmail', '')) or 'prospect'
    recipient = token.get('recipientEmail') or 'recipient'
    n = open_count(token_id_value)
    label = 'opened' if n == 1 else f'opened (#{n})'
    msg = f'📬 Lucra email {label}\n{company} — {recipient}\nSubject: {subject}'
    try:
        notify_result = notify_telegram(msg)
        if notify_result.get('ok'):
            mark_notified(token_id_value)
        append_jsonl(OPENS_PATH, {'openedAt': now_iso(), 'tokenId': token_id_value, 'notificationResult': notify_result})
        # Hot-lead escalation: fires once when a recipient crosses HOT_THRESHOLD opens.
        if n >= HOT_THRESHOLD and not has_escalated(token_id_value):
            hot = (f'🔥 HOT LEAD — {company} ({recipient}) has opened "{subject}" {n}×.\n'
                   f'Engagement is hot — reply or call now while you\'re top of mind.')
            hot_result = notify_telegram(hot)
            if hot_result.get('ok'):
                mark_escalated(token_id_value)
            append_jsonl(OPENS_PATH, {'openedAt': now_iso(), 'tokenId': token_id_value, 'hotLead': True, 'opens': n})
    except Exception as e:
        append_jsonl(OPENS_PATH, {'openedAt': now_iso(), 'tokenId': token_id_value, 'notificationError': str(e)})


def record_open(token_id_value: str, ip: str, ua: str, headers: dict[str, str]) -> dict[str, Any]:
    tokens = load_json(TOKENS_PATH, {})
    token = tokens.get(token_id_value)
    if not token:
        row = {'openedAt': now_iso(), 'tokenId': token_id_value, 'knownToken': False, 'ipHash': hashlib.sha256((ip or '').encode()).hexdigest()[:16], 'userAgentHash': hashlib.sha256((ua or '').encode()).hexdigest()[:16]}
        append_jsonl(OPENS_PATH, row)
        return row
    open_class, reasons = classify_open(token, ip, ua)
    row = {
        'openedAt': now_iso(),
        'tokenId': token_id_value,
        'knownToken': True,
        'class': open_class,
        'reasons': reasons,
        'recipientEmail': token.get('recipientEmail'),
        'recipientHash': token.get('recipientHash'),
        'company': token.get('company'),
        'subject': token.get('subject'),
        'campaign': token.get('campaign'),
        'ipHash': hashlib.sha256((ip or '').encode()).hexdigest()[:16],
        'userAgentHash': hashlib.sha256((ua or '').encode()).hexdigest()[:16],
        'fingerprint': request_fingerprint(ip, ua),
        'via': headers.get('x-forwarded-for', '').split(',')[0].strip() if headers.get('x-forwarded-for') else '',
    }
    append_jsonl(OPENS_PATH, row)
    if should_notify(token_id_value, open_class):
        threading.Thread(target=notify_open_async, args=(token_id_value, token), daemon=True).start()
    return row


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path in {'/health', '/healthz'}:
            self._json({'ok': True, 'service': 'lucra-email-open-tracker', 'time': now_iso()})
            return
        if parsed.path not in {'/open.gif', '/o.gif', '/pixel.gif'}:
            self.send_response(404); self.end_headers(); return
        qs = parse_qs(parsed.query)
        tid = (qs.get('t') or [''])[0]
        ua = self.headers.get('User-Agent', '')
        ip = self.headers.get('X-Forwarded-For', '').split(',')[0].strip() or self.client_address[0]
        record_open(tid, ip, ua, {k.lower(): v for k, v in self.headers.items()})
        self.send_response(200)
        self.send_header('Content-Type', 'image/gif')
        self.send_header('Content-Length', str(len(TRANSPARENT_GIF)))
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.end_headers()
        self.wfile.write(TRANSPARENT_GIF)

    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def _json(self, data: dict[str, Any]) -> None:
        payload = json.dumps(data).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def serve(args: argparse.Namespace) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(json.dumps({'ok': True, 'listening': f'http://{args.host}:{args.port}', 'health': f'http://{args.host}:{args.port}/health'}, indent=2))
    httpd.serve_forever()


def list_opens(args: argparse.Namespace) -> None:
    rows = []
    if OPENS_PATH.exists():
        lines = OPENS_PATH.read_text().splitlines()[-args.limit:]
        rows = [json.loads(line) for line in lines if line.strip()]
    if args.format == 'text':
        if not rows:
            print('No opens logged yet.')
            return
        for row in rows:
            label = row.get('class') or ('notification' if row.get('notificationSent') else 'unknown')
            recipient = row.get('recipientEmail') or row.get('tokenId') or 'unknown'
            company = row.get('company') or ''
            subject = row.get('subject') or ''
            print(f"{row.get('openedAt')} | {label} | {recipient} | {company} | {subject}".strip())
        return
    print(json.dumps({'ok': True, 'count': len(rows), 'opens': rows}, indent=2))


def notify_test(args: argparse.Namespace) -> None:
    msg = '🧪 TEST: Lucra open tracker Telegram notifications are wired. No prospect email was opened.'
    result = notify_telegram(msg, dry_run=args.dry_run)
    print(json.dumps({'ok': bool(result.get('ok')), 'result': result}, indent=2))


def self_test() -> None:
    test_token = {'recipientEmail': 'prospect@example.com', 'recipientHash': email_hash('prospect@example.com'), 'company': 'Example', 'subject': 'Test'}
    c, reasons = classify_open(test_token, '127.0.0.1', 'Mozilla/5.0')
    assert c == 'prospect_open', (c, reasons)
    c, reasons = classify_open({**test_token, 'recipientEmail': 'brian@lucrasports.com'}, '127.0.0.1', 'Mozilla/5.0')
    assert c == 'noise' and 'tracked_recipient_is_internal' in reasons, (c, reasons)
    c, reasons = classify_open({**test_token, 'suppressNotifications': True}, '127.0.0.1', 'Mozilla/5.0')
    assert c == 'noise' and 'token_notifications_suppressed' in reasons, (c, reasons)
    print(json.dumps({'ok': True, 'tests': ['prospect open classified', 'internal recipient suppressed', 'suppressed token ignored']}, indent=2))


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description='Lucra sent-email open tracker MVP')
    sub = p.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('create')
    c.add_argument('--recipient', required=True)
    c.add_argument('--company', default='')
    c.add_argument('--subject', default='')
    c.add_argument('--campaign', default='lucra-outreach')
    c.add_argument('--notes', default='')
    c.add_argument('--base-url', default='')
    c.add_argument('--suppress-notifications', action='store_true')
    c.set_defaults(func=create_token)
    s = sub.add_parser('serve')
    s.add_argument('--host', default='127.0.0.1')
    s.add_argument('--port', type=int, default=8787)
    s.set_defaults(func=serve)
    l = sub.add_parser('opens')
    l.add_argument('--limit', type=int, default=20)
    l.add_argument('--format', choices=['json', 'text'], default='json')
    l.set_defaults(func=list_opens)
    n = sub.add_parser('notify-test')
    n.add_argument('--dry-run', action='store_true', help='Do not send Telegram; only verify command path/config handling')
    n.set_defaults(func=notify_test)
    t = sub.add_parser('self-test')
    t.set_defaults(func=lambda args: self_test())
    return p


def main() -> int:
    args = build_parser().parse_args()
    args.func(args)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
