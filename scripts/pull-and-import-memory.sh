#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${1:-/Users/mat/clawd-workspace}"
SYNC_ROOT="${SYNC_ROOT:-$WORKSPACE/shared-memory-sync}"
VAULT_ROOT="${VAULT_ROOT:-/Users/mat/Documents/Clawd-Brain-Vault}"
IMPORTER="${IMPORTER:-$WORKSPACE/scripts/import-shared-memory.py}"

cd "$WORKSPACE"

git pull origin main

python3 "$IMPORTER" \
  --sync-root "$SYNC_ROOT" \
  --vault-root "$VAULT_ROOT"
