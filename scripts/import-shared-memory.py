#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

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

def import_notes(sync_root: Path, vault_root: Path) -> int:
    imported = 0
    skipped = 0

    for folder in sorted(ALLOWED_FOLDERS):
        src_dir = sync_root / folder
        dst_dir = vault_root / folder

        if not src_dir.exists():
            continue

        dst_dir.mkdir(parents=True, exist_ok=True)

        for src in sorted(src_dir.glob("*.md")):
            dst = dst_dir / src.name
            if dst.exists():
                skipped += 1
                print(f"skipped_existing: {src} -> {dst}")
                continue

            shutil.copy2(src, dst)
            imported += 1
            print(f"imported: {src} -> {dst}")

    print(f"Imported: {imported}")
    print(f"Skipped existing: {skipped}")
    return 0

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sync-root", required=True)
    parser.add_argument("--vault-root", required=True)
    args = parser.parse_args()

    sync_root = Path(args.sync_root).expanduser().resolve()
    vault_root = Path(args.vault_root).expanduser().resolve()

    if not sync_root.exists():
        raise SystemExit(f"sync root does not exist: {sync_root}")
    if not vault_root.exists():
        raise SystemExit(f"vault root does not exist: {vault_root}")

    return import_notes(sync_root, vault_root)

if __name__ == "__main__":
    raise SystemExit(main())
