#!/usr/bin/env python3
"""Create or append structured notes in an Obsidian vault."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Optional

ALLOWED_TYPES = {
    "inbox": "inbox",
    "project": "projects",
    "decision": "decisions",
    "person": "people",
    "agent": "agents",
    "daily": "daily",
    "area": "areas",
    "system": "system",
}

ALLOWED_VISIBILITY = {"shared", "mat-private", "sarah-private", "agent-internal"}
ALLOWED_STATUS = {"draft", "active", "paused", "done", "archived"}
SOURCE_FALLBACK = "clawd"


class NoteError(Exception):
    pass


@dataclass
class NoteTarget:
    note_type: str
    title: str
    slug: str
    note_date: str
    path: Path


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    if not value:
        raise NoteError("Could not derive a slug from the provided title.")
    return value


def titleize_slug(slug: str) -> str:
    words = [word for word in slug.replace("_", "-").split("-") if word]
    if not words:
        raise NoteError("Could not derive a title from the provided slug.")
    return " ".join(word.capitalize() for word in words)


def validate_date(raw: Optional[str]) -> str:
    if not raw:
        return date.today().isoformat()
    try:
        return date.fromisoformat(raw).isoformat()
    except ValueError as exc:
        raise NoteError(f"Invalid date '{raw}'. Use YYYY-MM-DD.") from exc


def default_status(note_type: str) -> str:
    return "draft" if note_type == "inbox" else "active"


def resolve_title_and_slug(title: Optional[str], slug: Optional[str]) -> tuple[str, str]:
    if not title and not slug:
        raise NoteError("Provide at least one of --title or --slug.")
    if title and not slug:
        slug = slugify(title)
    elif slug and not title:
        title = titleize_slug(slug)
    assert title is not None and slug is not None
    return title.strip(), slugify(slug)


def build_target(vault: Path, note_type: str, title: str, slug: str, note_date: str) -> NoteTarget:
    folder = ALLOWED_TYPES[note_type]
    if note_type == "daily":
        filename = f"{note_date}.md"
        title = note_date
        slug = note_date
    elif note_type == "decision":
        filename = f"{note_date}-{slug}.md"
    elif note_type == "inbox":
        filename = f"{note_date}-{slug}.md"
    else:
        filename = f"{slug}.md"
    path = vault / folder / filename
    return NoteTarget(note_type=note_type, title=title, slug=slug, note_date=note_date, path=path)


def read_body(args: argparse.Namespace) -> str:
    if args.body and args.body_file:
        raise NoteError("Use either --body or --body-file, not both.")
    if args.body_file:
        body_path = Path(args.body_file).expanduser()
        if not body_path.exists() or not body_path.is_file():
            raise NoteError(f"Body file not found: {body_path}")
        return body_path.read_text(encoding="utf-8")
    return args.body or ""


def render_frontmatter(note_type: str, title: str, status: str, today: str, source: str, visibility: str) -> str:
    lines = [
        "---",
        f"type: {note_type}",
        f"title: {title}",
        f"status: {status}",
        f"created: {today}",
        f"updated: {today}",
        "tags: []",
        f"source: {source}",
        f"visibility: {visibility}",
        "---",
        "",
    ]
    return "\n".join(lines)


def split_frontmatter(text: str) -> tuple[Optional[list[str]], str]:
    if not text.startswith("---\n"):
        return None, text
    parts = text.split("\n")
    closing_index = None
    for idx in range(1, len(parts)):
        if parts[idx] == "---":
            closing_index = idx
            break
    if closing_index is None:
        return None, text
    frontmatter = parts[: closing_index + 1]
    body = "\n".join(parts[closing_index + 1 :])
    return frontmatter, body


def update_frontmatter(frontmatter_lines: list[str], *, updated: str, source: Optional[str]) -> str:
    new_lines = []
    saw_updated = False
    saw_source = False
    for line in frontmatter_lines:
        if line.startswith("updated:"):
            new_lines.append(f"updated: {updated}")
            saw_updated = True
        elif source and line.startswith("source:"):
            new_lines.append(f"source: {source}")
            saw_source = True
        else:
            new_lines.append(line)
    if not saw_updated and len(new_lines) >= 2:
        new_lines.insert(-1, f"updated: {updated}")
    if source and not saw_source and len(new_lines) >= 2:
        new_lines.insert(-1, f"source: {source}")
    return "\n".join(new_lines)


def append_note(target: NoteTarget, body: str, source: str, today: str) -> None:
    if target.path.exists():
        existing = target.path.read_text(encoding="utf-8")
        frontmatter, existing_body = split_frontmatter(existing)
        if frontmatter is None:
            raise NoteError(f"Existing note lacks valid frontmatter: {target.path}")
        updated_frontmatter = update_frontmatter(frontmatter, updated=today, source=source)
        pieces = [updated_frontmatter, ""]
        existing_body = existing_body.rstrip("\n")
        if existing_body:
            pieces.append(existing_body)
        if body:
            if len(pieces) > 2:
                pieces.append("")
            pieces.append(body.rstrip("\n"))
        content = "\n".join(pieces).rstrip() + "\n"
    else:
        content = build_new_note_content(target, body, source, today, default_status(target.note_type))
        target.path.parent.mkdir(parents=True, exist_ok=True)
    target.path.write_text(content, encoding="utf-8")


def build_new_note_content(target: NoteTarget, body: str, source: str, today: str, status: str) -> str:
    frontmatter = render_frontmatter(
        note_type=target.note_type,
        title=target.title,
        status=status,
        today=today,
        source=source,
        visibility=args_visibility,
    )
    if body:
        return frontmatter + body.rstrip("\n") + "\n"
    return frontmatter


args_visibility = "shared"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or append structured Obsidian notes.")
    parser.add_argument("--vault", required=True, help="Path to the Obsidian vault root")
    parser.add_argument("--type", required=True, choices=sorted(ALLOWED_TYPES.keys()))
    parser.add_argument("--title")
    parser.add_argument("--slug")
    parser.add_argument("--create", action="store_true")
    parser.add_argument("--append", action="store_true")
    parser.add_argument("--body")
    parser.add_argument("--body-file")
    parser.add_argument("--status")
    parser.add_argument("--source")
    parser.add_argument("--visibility")
    parser.add_argument("--date")
    return parser.parse_args()


def main() -> int:
    global args_visibility
    try:
        args = parse_args()
        if args.create == args.append:
            raise NoteError("Choose exactly one mode: --create or --append.")

        vault = Path(args.vault).expanduser().resolve()
        if not vault.exists() or not vault.is_dir():
            raise NoteError(f"Vault path is not a directory: {vault}")

        note_type = args.type
        note_date = validate_date(args.date)
        title, slug = resolve_title_and_slug(args.title, args.slug)
        visibility = args.visibility or "shared"
        if visibility not in ALLOWED_VISIBILITY:
            raise NoteError(f"Invalid visibility '{visibility}'.")
        args_visibility = visibility

        status = args.status or default_status(note_type)
        if status not in ALLOWED_STATUS:
            raise NoteError(f"Invalid status '{status}'.")

        source = (args.source or SOURCE_FALLBACK).strip() or SOURCE_FALLBACK
        body = read_body(args)
        target = build_target(vault, note_type, title, slug, note_date)

        if args.create:
            if target.path.exists():
                raise NoteError(f"Target note already exists: {target.path}")
            target.path.parent.mkdir(parents=True, exist_ok=True)
            content = build_new_note_content(target, body, source, note_date, status)
            target.path.write_text(content, encoding="utf-8")
        else:
            append_note(target, body, source, note_date)

        print(target.path)
        return 0
    except NoteError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
