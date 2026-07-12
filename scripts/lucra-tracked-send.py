#!/usr/bin/env python3
"""Create Lucra tracked Gmail drafts or sends.

First shippable path for Mat's request: avoid manually pasting pixels by using
Gmail/gog to create tracked drafts from mat.weiss@lucrasports.com.

Default behavior is safe: create drafts only, track external recipients only,
and refuse ambiguous multi-external-recipient attribution unless --split-external
is used.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable

WORKSPACE = Path('/root/.openclaw/workspace')
TRACKER_SCRIPT = WORKSPACE / 'scripts/lucra-email-open-tracker.py'
sys.path.insert(0, str(WORKSPACE / 'scripts'))
import importlib.util

spec = importlib.util.spec_from_file_location('lucra_email_open_tracker', TRACKER_SCRIPT)
tracker = importlib.util.module_from_spec(spec)
assert spec and spec.loader
sys.modules['lucra_email_open_tracker'] = tracker
spec.loader.exec_module(tracker)

ACCOUNT = 'mat.weiss@lucrasports.com'
DEFAULT_BASE_URL = 'https://lucra-open-tracker.thematweiss.com'
INTERNAL_DOMAINS = {'lucrasports.com', 'playlucra.com'}
# Mat's own verified accounts (from `gog auth list` + memory). Never tracked by default.
OWN_EMAILS = {
    'mat.weiss@lucrasports.com',
    'mat@playlucra.com',
    'thematweiss@gmail.com',
    'lucrasports@gmail.com',
    'sarahmat0816@gmail.com',
}
NOISY_LOCAL_PARTS = {
    'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mailer-daemon',
    'postmaster', 'bounce', 'bounces', 'notifications', 'notification',
    'calendar-notification', 'no_reply',
}
EMAIL_RE = re.compile(r'[^@\s,;<>]+@[^@\s,;<>]+')


def parse_emails(value: str | None) -> list[str]:
    if not value:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for match in EMAIL_RE.findall(value):
        email = match.strip().lower()
        if email not in seen:
            seen.add(email)
            out.append(email)
    return out


def csv_emails(values: Iterable[str]) -> str:
    return ','.join(values)


def domain(email: str) -> str:
    return email.split('@')[-1].lower() if '@' in email else ''


def local(email: str) -> str:
    return email.split('@')[0].lower() if '@' in email else email.lower()


def is_noisy_or_internal(email: str) -> tuple[bool, str]:
    e = email.lower()
    if e in OWN_EMAILS:
        return True, 'own_account'
    if domain(e) in INTERNAL_DOMAINS:
        return True, 'internal_domain'
    if local(e) in NOISY_LOCAL_PARTS or local(e).startswith(('no-reply', 'noreply', 'donotreply')):
        return True, 'system_no_reply'
    return False, ''


def text_to_html(text: str) -> str:
    parts = [html.escape(p) for p in text.split('\n')]
    return '<div>' + '<br>\n'.join(parts) + '</div>'


def html_to_text(html_body: str) -> str:
    """Best-effort plain-text fallback derived from an HTML body (for multipart/alternative)."""
    t = re.sub(r'(?is)<(script|style|head)[^>]*>.*?</\1>', '', html_body)
    t = re.sub(r'(?i)<br\s*/?>', '\n', t)
    t = re.sub(r'(?i)</(p|div|tr|li|h[1-6])>', '\n', t)
    t = re.sub(r'(?i)<li[^>]*>', '- ', t)
    t = re.sub(r'(?s)<[^>]+>', '', t)            # strip remaining tags
    t = html.unescape(t).replace('\xa0', ' ')    # nbsp -> regular space
    t = re.sub(r'[ \t]+\n', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()


def read_body(args: argparse.Namespace) -> tuple[str, str]:
    """Return (html_body, plain_text). Plain text is the multipart/alternative fallback."""
    if args.html_body_file:
        h = Path(args.html_body_file).read_text()
        return h, html_to_text(h)
    if args.body_file:
        raw = Path(args.body_file).read_text()
        return text_to_html(raw), raw
    if args.html_body:
        return args.html_body, html_to_text(args.html_body)
    if args.body:
        return text_to_html(args.body), args.body
    raise SystemExit('Provide --body-file, --html-body-file, --body, or --html-body')


def append_pixel(html_body: str, pixel: str) -> str:
    marker = '\n<!-- lucra-open-tracker -->\n' + pixel + '\n'
    low = html_body.lower()
    idx = low.rfind('</body>')
    if idx != -1:
        return html_body[:idx] + marker + html_body[idx:]
    return html_body.rstrip() + marker


def run_gog(args: list[str], dry_run: bool) -> dict:
    cmd = ['gog', *args]
    if dry_run:
        return {'ok': True, 'dryRun': True, 'cmd': cmd}
    proc = subprocess.run(cmd, text=True, capture_output=True, timeout=60)
    result = {'ok': proc.returncode == 0, 'cmd': cmd, 'returncode': proc.returncode, 'stdout': proc.stdout.strip(), 'stderr': proc.stderr.strip()}
    if proc.returncode != 0:
        raise RuntimeError(json.dumps(result, indent=2))
    return result


def create_one(args: argparse.Namespace, to_list: list[str], cc_list: list[str], bcc_list: list[str], tracked_recipient: str | None, body_html: str, body_text: str) -> dict:
    token = None
    open_url = None
    pixel = ''
    if tracked_recipient:
        token = tracker.make_token(
            tracked_recipient,
            company=args.company or domain(tracked_recipient),
            subject=args.subject,
            campaign=args.campaign,
            notes=args.notes,
            suppress=False,
        )
        open_url, pixel = tracker.pixel_html(token['id'], args.base_url)
    final_html = append_pixel(body_html, pixel) if pixel else body_html
    mode_args = ['gmail']
    if args.send:
        mode_args += ['send']
    else:
        mode_args += ['drafts', 'create']
    # gog accepts HTML as a string via --body-html (there is no --body-html-file).
    # Passing --body (plain) + --body-html builds a multipart/alternative for deliverability.
    mode_args += ['--account', ACCOUNT, '--to', csv_emails(to_list), '--subject', args.subject, '--body-html', final_html]
    if body_text.strip():
        mode_args += ['--body', body_text]
    if cc_list:
        mode_args += ['--cc', csv_emails(cc_list)]
    if bcc_list:
        mode_args += ['--bcc', csv_emails(bcc_list)]
    mode_args += ['--json', '--no-input']
    if args.send:
        # Non-interactive send: skip the confirmation prompt that would otherwise hang.
        mode_args += ['--force']
    if args.gog_dry_run:
        mode_args += ['--dry-run']
    result = run_gog(mode_args, dry_run=args.dry_run)
    return {
        'to': to_list,
        'cc': cc_list,
        'bcc': bcc_list,
        'trackedRecipient': tracked_recipient,
        'tokenId': token['id'] if token else None,
        'openUrl': open_url,
        'action': 'send' if args.send else 'draft',
        'gog': result,
    }


def self_test() -> int:
    # Guardrail classification
    assert is_noisy_or_internal('brian@lucrasports.com') == (True, 'internal_domain')
    assert is_noisy_or_internal('mat.weiss@lucrasports.com')[0] is True
    assert is_noisy_or_internal('thematweiss@gmail.com') == (True, 'own_account')
    assert is_noisy_or_internal('mat@playlucra.com')[0] is True
    assert is_noisy_or_internal('no-reply@calendar.google.com')[0] is True
    assert is_noisy_or_internal('notifications@slack.com')[0] is True
    assert is_noisy_or_internal('jane@acmegolf.com') == (False, '')
    # Email parsing dedupes + lowercases
    assert parse_emails('A@x.com, b@y.com; a@x.com') == ['a@x.com', 'b@y.com']
    assert parse_emails('Jane <jane@acmegolf.com>') == ['jane@acmegolf.com']
    # Plain text -> HTML
    h = text_to_html('Hi Jane,\nLine two')
    assert '<div>' in h and 'Hi Jane,' in h and '<br>' in h
    # Pixel insertion before </body> when present, else appended
    out = append_pixel('<html><body><p>x</p></body></html>', '<img src="PIX">')
    assert out.index('<img src="PIX">') < out.index('</body>')
    out2 = append_pixel('<div>x</div>', '<img src="PIX">')
    assert out2.rstrip().endswith('<img src="PIX">')
    # HTML -> plain-text fallback strips tags + decodes entities, no pixel leakage
    txt = html_to_text('<p>Hi&nbsp;Jane,</p><p>Line<br>two</p><img src="PIX">')
    assert 'Hi Jane,' in txt and 'Line\ntwo' in txt and 'PIX' not in txt and '<' not in txt
    print(json.dumps({'ok': True, 'tests': [
        'internal/own/noisy recipients flagged',
        'external recipient trackable',
        'email parsing dedupes/lowercases/strips display name',
        'plain text -> html',
        'pixel inserted before </body>',
        'pixel appended when no </body>',
        'html->text fallback strips tags, no pixel leakage',
    ]}, indent=2))
    return 0


def main() -> int:
    if sys.argv[1:2] == ['self-test']:
        return self_test()
    p = argparse.ArgumentParser(description='Create/send Lucra Gmail messages with open tracking inserted automatically')
    p.add_argument('--to', required=True, help='Comma-separated To recipients')
    p.add_argument('--cc', default='', help='Comma-separated CC recipients')
    p.add_argument('--bcc', default='', help='Comma-separated BCC recipients')
    p.add_argument('--subject', required=True)
    p.add_argument('--body-file')
    p.add_argument('--html-body-file')
    p.add_argument('--body')
    p.add_argument('--html-body')
    p.add_argument('--company', default='')
    p.add_argument('--campaign', default='lucra-outreach')
    p.add_argument('--notes', default='')
    p.add_argument('--base-url', default=DEFAULT_BASE_URL)
    p.add_argument('--send', action='store_true', help='Actually send instead of creating a Gmail draft. Use carefully.')
    p.add_argument('--track-internal', action='store_true', help='Override guardrails and track internal/noisy recipients too')
    p.add_argument('--split-external', action='store_true', help='For multiple external recipients, create/send one individualized message per tracked recipient')
    p.add_argument('--allow-shared-tracking', action='store_true', help='Allow one shared pixel for a multi-external-recipient message; attribution will be ambiguous')
    p.add_argument('--dry-run', action='store_true', help='Do not call gog; print planned operations and create tokens only if --create-tokens-on-dry-run is set')
    p.add_argument('--create-tokens-on-dry-run', action='store_true')
    p.add_argument('--gog-dry-run', action='store_true', help='Pass --dry-run to gog (gog validates but makes no change)')
    args = p.parse_args()

    to_list = parse_emails(args.to)
    cc_list = parse_emails(args.cc)
    bcc_list = parse_emails(args.bcc)
    if not to_list:
        raise SystemExit('--to must include at least one email')

    all_recipients = to_list + cc_list + bcc_list
    classified = []
    external = []
    suppressed = []
    for e in all_recipients:
        noisy, reason = is_noisy_or_internal(e)
        if noisy and not args.track_internal:
            suppressed.append({'email': e, 'reason': reason})
        else:
            external.append(e)
        classified.append({'email': e, 'trackable': (not noisy or args.track_internal), 'reason': reason})

    if not external:
        raise SystemExit('No trackable recipients after guardrails. Use --track-internal to override.')

    if len(external) > 1 and not args.split_external and not args.allow_shared_tracking:
        raise SystemExit('Multiple trackable recipients found. Use --split-external for recipient-level attribution, or --allow-shared-tracking for ambiguous shared tracking.')

    body_html, body_text = read_body(args)
    planned = []

    if args.dry_run and not args.create_tokens_on_dry_run:
        for tracked in (external if args.split_external else [external[0]]):
            if args.split_external:
                planned.append({'to': [tracked], 'cc': [], 'bcc': [], 'trackedRecipient': tracked, 'action': 'send' if args.send else 'draft', 'dryRun': True})
            else:
                planned.append({'to': to_list, 'cc': cc_list, 'bcc': bcc_list, 'trackedRecipient': tracked, 'action': 'send' if args.send else 'draft', 'dryRun': True})
    elif args.split_external:
        # First shippable split: make each tracked external recipient the sole To recipient.
        # CC/BCC are intentionally dropped to preserve attribution/thread clarity.
        for tracked in external:
            planned.append(create_one(args, [tracked], [], [], tracked, body_html, body_text))
    else:
        planned.append(create_one(args, to_list, cc_list, bcc_list, external[0], body_html, body_text))

    output = {
        'ok': True,
        'account': ACCOUNT,
        'mode': 'send' if args.send else 'draft',
        'guardrails': {'suppressed': suppressed, 'classified': classified},
        'warning': 'Shared tracking is attribution-ambiguous.' if args.allow_shared_tracking and len(external) > 1 else '',
        'operations': planned,
    }
    print(json.dumps(output, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
