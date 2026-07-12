#!/usr/bin/env python3
"""Filesystem-first skill hub resolver for Omnigent/OpenClaw.

No API calls. No model calls. Reads local skill.json/SKILL.md files and emits
compact runtime-specific text for prompt injection.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HUB = ROOT / "omnigent-skill-hub"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def skill_dirs(hub: Path) -> list[Path]:
    skills = hub / "skills"
    if not skills.exists():
        return []
    return sorted(p for p in skills.iterdir() if (p / "skill.json").exists())


def load_skill(path: Path) -> dict[str, Any]:
    meta = load_json(path / "skill.json")
    md = (path / "SKILL.md").read_text(encoding="utf-8") if (path / "SKILL.md").exists() else ""
    meta["_path"] = str(path)
    meta["_markdown"] = md
    return meta


def all_skills(hub: Path) -> list[dict[str, Any]]:
    return [load_skill(p) for p in skill_dirs(hub)]


def matches(skill: dict[str, Any], query: str) -> int:
    q = query.lower()
    fields: list[str] = [
        skill.get("name", ""),
        skill.get("description", ""),
        " ".join(skill.get("triggers", [])),
        skill.get("_markdown", ""),
    ]
    hay = "\n".join(fields).lower()
    score = 0
    for token in [t for t in q.replace("/", " ").replace("-", " ").split() if len(t) > 2]:
        if token in hay:
            score += 1
    if q in hay:
        score += 5
    return score


def compact_markdown(md: str, limit: int) -> str:
    lines = [line.rstrip() for line in md.strip().splitlines()]
    out: list[str] = []
    chars = 0
    for line in lines:
        add = len(line) + 1
        if chars + add > limit:
            out.append("…")
            break
        out.append(line)
        chars += add
    return "\n".join(out).strip()


def cmd_list(args: argparse.Namespace) -> int:
    for s in all_skills(args.hub):
        print(f"{s.get('name')}\t{s.get('version','')}\t{s.get('description','')}")
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    scored = [(matches(s, args.query), s) for s in all_skills(args.hub)]
    scored = [(score, s) for score, s in scored if score > 0]
    scored.sort(key=lambda x: (-x[0], x[1].get("name", "")))
    for score, s in scored[: args.max]:
        print(f"{score}\t{s.get('name')}\t{s.get('description','')}")
    return 0 if scored else 1


def find_skill(hub: Path, name: str) -> dict[str, Any] | None:
    for s in all_skills(hub):
        if s.get("name") == name:
            return s
    return None


def cmd_show(args: argparse.Namespace) -> int:
    s = find_skill(args.hub, args.name)
    if not s:
        print(f"skill not found: {args.name}", file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps({k: v for k, v in s.items() if not k.startswith("_")}, indent=2))
    else:
        print(s.get("_markdown", ""))
    return 0


def cmd_resolve(args: argparse.Namespace) -> int:
    s = find_skill(args.hub, args.name)
    if not s:
        print(f"skill not found: {args.name}", file=sys.stderr)
        return 1
    adapter_path = Path(s["_path"]) / "adapters" / f"{args.runtime}.md"
    adapter = adapter_path.read_text(encoding="utf-8").strip() if adapter_path.exists() else ""
    md = compact_markdown(s.get("_markdown", ""), args.limit)
    safety = s.get("safety", {})
    print(f"# Resolved skill: {s.get('name')} ({args.runtime})")
    print()
    print(f"Description: {s.get('description','')}")
    print()
    if adapter:
        print("## Runtime adapter")
        print(adapter)
        print()
    print("## Skill instructions")
    print(md)
    print()
    print("## Safety metadata")
    print(json.dumps(safety, indent=2))
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    required = {"name", "version", "description", "triggers", "runtimes", "requires", "safety"}
    ok = True
    names: set[str] = set()
    for d in skill_dirs(args.hub):
        try:
            s = load_skill(d)
        except Exception as e:
            print(f"FAIL {d}: {e}", file=sys.stderr)
            ok = False
            continue
        missing = sorted(required - set(k for k in s if not k.startswith("_")))
        if missing:
            print(f"FAIL {d}: missing {missing}", file=sys.stderr)
            ok = False
        name = s.get("name")
        if name in names:
            print(f"FAIL duplicate skill name: {name}", file=sys.stderr)
            ok = False
        names.add(name)
        if not (d / "SKILL.md").exists():
            print(f"FAIL {d}: missing SKILL.md", file=sys.stderr)
            ok = False
    print(f"validated {len(names)} skills")
    return 0 if ok else 1


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Local filesystem skill hub resolver")
    p.add_argument("--hub", type=Path, default=DEFAULT_HUB)
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("list")
    sp.set_defaults(func=cmd_list)

    sp = sub.add_parser("search")
    sp.add_argument("query")
    sp.add_argument("--max", type=int, default=10)
    sp.set_defaults(func=cmd_search)

    sp = sub.add_parser("show")
    sp.add_argument("name")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_show)

    sp = sub.add_parser("resolve")
    sp.add_argument("name")
    sp.add_argument("--runtime", default="omnigent", choices=["openclaw", "omnigent", "claude", "codex"])
    sp.add_argument("--limit", type=int, default=3500)
    sp.set_defaults(func=cmd_resolve)

    sp = sub.add_parser("validate")
    sp.set_defaults(func=cmd_validate)
    return p


def main() -> int:
    args = build_parser().parse_args()
    args.hub = args.hub.resolve()
    if not args.hub.exists():
        print(f"hub not found: {args.hub}", file=sys.stderr)
        return 1
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
