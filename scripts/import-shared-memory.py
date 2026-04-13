cat > /root/.openclaw/workspace/scripts/import-shared-memory.py <<'EOF'
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ALLOWED_FOLDERS = {
    "inbox",
    "projects",
    "decisions",
    "people",
    "agents",
    "daily",
    "areas",
    "system",
}

STATE_DIRNAME = ".import-state"
MANIFEST_FILENAME = "manifest.json"


class ImportError(Exception):
    pass


@dataclass
class ImportResult:
    imported: list[str]
    skipped_existing: list[str]
    skipped_manifest: list[str]
    skipped_invalid: list[str]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_manifest(state_dir: Path) -> dict:
    manifest_path = state_dir / MANIFEST_FILENAME
    if not manifest_path.exists():
        return {"imports": {}}
    try:
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception:
        return {"imports": {}}


def save_manifest(state_dir: Path, manifest: dict) -> None:
    ensure_dir(state_dir)
    manifest_path = state_dir / MANIFEST_FILENAME
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")


def iter_candidate_files(sync_root: Path) -> Iterable[Path]:
    for child in sorted(sync_root.iterdir()):
        if not child.is_dir() or child.name not in ALLOWED_FOLDERS:
            continue
        for path in sorted(child.rglob("*.md")):
            if path.is_file():
                yield path


def validate_relative(rel_path: Path) -> bool:
    if not rel_path.parts:
        return False
    return rel_path.parts[0] in ALLOWED_FOLDERS


def import_files(sync_root: Path, vault_root: Path) -> ImportResult:
    state_dir = sync_root / STATE_DIRNAME
    manifest = load_manifest(state_dir)
    imports = manifest.setdefault("imports", {})

    result = ImportResult(imported=[], skipped_existing=[], skipped_manifest=[], skipped_invalid=[])

    for source in iter_candidate_files(sync_root):
        rel_path = source.relative_to(sync_root)
        rel_key = rel_path.as_posix()

        if not validate_relative(rel_path):
            result.skipped_invalid.append(rel_key)
            continue

        source_hash = sha256_file(source)
        target = vault_root / rel_path
        target.parent.mkdir(parents=True, exist_ok=True)

        previous = imports.get(rel_key)
        if previous and previous.get("sourceSha256") == source_hash and target.exists():
            result.skipped_manifest.append(f"{source} -> {target}")
            continue

        if target.exists():
            target_hash = sha256_file(target)
            if target_hash == source_hash:
                imports[rel_key] = {
                    "sourceSha256": source_hash,
                    "target": str(target),
                }
                result.skipped_existing.append(f"{source} -> {target}")
                continue

        shutil.copy2(source, target)
        imports[rel_key] = {
            "sourceSha256": source_hash,
            "target": str(target),
        }
        result.imported.append(f"{source} -> {target}")

    save_manifest(state_dir, manifest)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Import shared memory artifacts into an Obsidian vault.")
    parser.add_argument("--sync-root", required=True)
    parser.add_argument("--vault-root", required=True)
    args = parser.parse_args()

    sync_root = Path(args.sync_root).expanduser().resolve()
    vault_root = Path(args.vault_root).expanduser().resolve()

    if not sync_root.exists() or not sync_root.is_dir():
        raise ImportError(f"Sync root not found: {sync_root}")
    if not vault_root.exists() or not vault_root.is_dir():
        raise ImportError(f"Vault root not found: {vault_root}")

    result = import_files(sync_root, vault_root)

    print(f"Imported: {len(result.imported)}")
    print(f"Skipped existing: {len(result.skipped_existing)}")
    print(f"Skipped manifest: {len(result.skipped_manifest)}")
    print(f"Skipped invalid: {len(result.skipped_invalid)}")

    for label, rows in (
        ("imported", result.imported),
        ("skipped_existing", result.skipped_existing),
        ("skipped_manifest", result.skipped_manifest),
        ("skipped_invalid", result.skipped_invalid),
    ):
        for row in rows:
            print(f"{label}: {row}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
EOF
