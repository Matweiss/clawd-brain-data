#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ALLOWED_AGENTS = {"bob", "luke", "hermes", "pixel", "sage", "arty", "clawd"}
REQUIRED_FIELDS = {
    "id",
    "title",
    "created_at",
    "updated_at",
    "author",
    "status",
    "assigned_agent",
    "priority",
}
REQUIRED_SECTIONS = [
    "## Objective",
    "## Context",
    "## Task",
    "## Constraints",
    "## Deliverables",
    "## Execution Log",
]


class ValidationError(Exception):
    pass


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        raise ValidationError("missing YAML frontmatter")
    end = text.find("\n---\n", 4)
    if end == -1:
        raise ValidationError("unterminated YAML frontmatter")
    raw = text[4:end]
    body = text[end + 5 :]
    data: dict[str, str] = {}
    for line in raw.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            raise ValidationError(f"invalid frontmatter line: {line}")
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip()
    return data, body


def validate(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)

    missing = sorted(REQUIRED_FIELDS - set(fm.keys()))
    if missing:
        raise ValidationError("missing fields: " + ", ".join(missing))

    agent = fm["assigned_agent"].lower()
    if agent not in ALLOWED_AGENTS:
        raise ValidationError(f"invalid assigned_agent: {fm['assigned_agent']}")

    for section in REQUIRED_SECTIONS:
        if section not in body:
            raise ValidationError(f"missing body section: {section}")

    brief_id = fm["id"]
    if not re.fullmatch(r"[a-z0-9][a-z0-9\-]{5,}", brief_id):
        raise ValidationError("id must be kebab-case and at least 6 chars")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a bridge brief")
    parser.add_argument("path")
    args = parser.parse_args()
    try:
        validate(Path(args.path).expanduser().resolve())
    except ValidationError as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        raise SystemExit(1)
    print("OK")
