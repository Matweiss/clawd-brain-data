#!/usr/bin/env python3
"""Build Mission Control CorePower cache artifacts from a raw schedule text dump.

Primary use:
- consume a saved CorePower body-text dump from raw CDP or browser scrape output
- parse the Main filter schedule for Encino + Sherman Oaks
- write a stable JSON cache for Mission Control and a readable markdown summary

This is intentionally offline-friendly so Pixel can separate scraping from parsing.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import UTC, datetime
from pathlib import Path
from typing import List

ROOT = Path('/root/.openclaw/workspace')
PIXEL = ROOT / 'shared' / 'pixel-agent'
MISSION = ROOT / 'clawd-mission-control-v2'
DEFAULT_INPUT = PIXEL / 'tmp' / 'corepower-body.txt'
JSON_OUT = MISSION / 'data' / 'corepower-schedule.json'
ERROR_OUT = MISSION / 'data' / 'corepower-schedule-error.json'
MD_OUT = MISSION / 'memory' / 'data' / 'corepower-schedule.md'
STUDIOS = {'Encino', 'Sherman Oaks'}
DAY_RE = re.compile(r'^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+[A-Z][a-z]{2}\s+\d{2}$')
TIME_RE = re.compile(r'^\d{1,2}:\d{2}\s+(am|pm)$', re.I)
COUNT_RE = re.compile(r'^\d+ classes$')
SKIP = {
    'PDT', 'BOOK', 'WAITLIST', 'JOIN WAITLIST', 'CANCELLED', 'FULL', 'SOLD OUT',
    'Main', 'Filter (2)', 'Studio', 'Live', 'Class Schedule', 'BOOK A CLASS'
}


@dataclass
class ClassEntry:
    dayLabel: str
    time: str
    className: str
    studio: str
    teacher: str
    status: str = 'open'
    badges: List[str] | None = None


MONTHS = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
}


def normalize_lines(text: str) -> List[str]:
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


def parse_day_label(label: str, fallback_year: int) -> str:
    dow, rest = label.split(', ', 1)
    mon, day = rest.split(' ')
    dt = datetime(fallback_year, MONTHS[mon], int(day))
    return dt.strftime('%Y-%m-%d')


def parse_classes(text: str) -> list[ClassEntry]:
    lines = normalize_lines(text)
    entries: list[ClassEntry] = []
    current_day = None
    i = 0

    while i < len(lines):
        line = lines[i]
        if DAY_RE.match(line):
            current_day = line
            i += 1
            continue
        if not current_day or not TIME_RE.match(line):
            i += 1
            continue

        time_s = line.lower()
        i += 1
        if i < len(lines) and lines[i] == 'PDT':
            i += 1
        if i >= len(lines):
            break

        class_name = lines[i]
        i += 1
        if i >= len(lines):
            break
        studio = lines[i]
        i += 1
        if studio not in STUDIOS:
            continue
        if i >= len(lines):
            break
        teacher = lines[i]
        i += 1

        badges: list[str] = []
        status = 'open'
        while i < len(lines):
            token = lines[i]
            if token == 'BOOK':
                i += 1
                break
            if TIME_RE.match(token) or DAY_RE.match(token):
                break
            if COUNT_RE.match(token) or token in SKIP:
                i += 1
                continue
            badges.append(token)
            i += 1

        if any('CANCEL' in badge.upper() for badge in badges):
            status = 'cancelled'
        elif any('WAITLIST' in badge.upper() for badge in badges):
            status = 'waitlist'
        elif any('FULL' in badge.upper() or 'SOLD OUT' in badge.upper() for badge in badges):
            status = 'full'

        entries.append(ClassEntry(
            dayLabel=current_day,
            time=time_s,
            className=class_name,
            studio=studio,
            teacher=teacher,
            status=status,
            badges=badges or [],
        ))

    return entries


def build_payload(entries: list[ClassEntry], source_path: Path) -> dict:
    if not entries:
        raise ValueError('No CorePower classes parsed from input text')

    day_labels = []
    for entry in entries:
        if entry.dayLabel not in day_labels:
            day_labels.append(entry.dayLabel)

    current_year = datetime.now(UTC).year
    day_map = {label: parse_day_label(label, current_year) for label in day_labels}
    grouped: dict[str, list[dict]] = defaultdict(list)
    for entry in entries:
        date_key = day_map[entry.dayLabel]
        item = asdict(entry)
        item['date'] = date_key
        grouped[date_key].append(item)

    first_date = min(grouped)
    last_date = max(grouped)
    updated = datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    total_classes = sum(len(v) for v in grouped.values())

    return {
        'updatedAt': updated,
        'source': {
            'name': 'CorePower Yoga',
            'filter': 'Main',
            'studios': sorted(STUDIOS),
            'sourceType': 'browser-scrape-direct-cdp',
            'inputFile': str(source_path),
        },
        'window': {
            'start': first_date,
            'end': last_date,
            'days': len(grouped),
        },
        'summary': {
            'classCount': total_classes,
            'dayCount': len(grouped),
        },
        'days': [
            {
                'date': date,
                'label': next(label for label, iso in day_map.items() if iso == date),
                'classCount': len(grouped[date]),
                'classes': grouped[date],
            }
            for date in sorted(grouped)
        ],
    }


def build_markdown(payload: dict) -> str:
    lines = [
        '# CorePower Weekly Cache',
        '',
        f"**Updated:** {payload['updatedAt']}",
        f"**Window:** {payload['window']['start']} to {payload['window']['end']}",
        f"**Studios:** {', '.join(payload['source']['studios'])}",
        f"**Classes:** {payload['summary']['classCount']} across {payload['summary']['dayCount']} days",
        '',
    ]
    for day in payload['days']:
        lines.append(f"## {day['label']} ({day['classCount']} classes)")
        lines.append('')
        for item in day['classes']:
            badge = '' if item['status'] == 'open' else f" [{item['status'].upper()}]"
            lines.append(f"- {item['time']} — {item['className']} — {item['teacher']} — {item['studio']}{badge}")
        lines.append('')
    return '\n'.join(lines).rstrip() + '\n'


def write_error(message: str):
    ERROR_OUT.parent.mkdir(parents=True, exist_ok=True)
    ERROR_OUT.write_text(json.dumps({
        'updatedAt': datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
        'error': message,
    }, indent=2) + '\n')


def main():
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not input_path.exists():
        write_error(f'Input file not found: {input_path}')
        raise SystemExit(1)

    text = input_path.read_text()
    try:
        entries = parse_classes(text)
        payload = build_payload(entries, input_path)
    except Exception as exc:
        write_error(str(exc))
        raise SystemExit(f'FAILED: {exc}')

    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    MD_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(payload, indent=2) + '\n')
    MD_OUT.write_text(build_markdown(payload))
    if ERROR_OUT.exists():
        ERROR_OUT.unlink()
    print(json.dumps({
        'ok': True,
        'json': str(JSON_OUT),
        'markdown': str(MD_OUT),
        'classCount': payload['summary']['classCount'],
        'dayCount': payload['summary']['dayCount'],
    }, indent=2))


if __name__ == '__main__':
    main()
