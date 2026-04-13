#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${OPENCLAW_WORKSPACE:-/root/.openclaw/workspace}"
BRIEF_ROOT="${BRIEF_ROOT:-$WORKSPACE/shared-memory-sync/briefs}"
DISPATCH="${DISPATCH:-$WORKSPACE/scripts/bridge/dispatch-brief.sh}"

cd "$WORKSPACE"
git pull --rebase origin main

shopt -s nullglob
for brief in "$BRIEF_ROOT"/approved/*.md; do
  name="$(basename "$brief")"
  agent="$(awk -F': ' '/^assigned_agent:/ {print tolower($2); exit}' "$brief")"
  [[ -n "$agent" ]] || { echo "Skipping $name, no assigned_agent" >&2; continue; }

  target_dir="$BRIEF_ROOT/executing/$agent"
  mkdir -p "$target_dir"
  target="$target_dir/$name"

  mv "$brief" "$target"
  git add "$BRIEF_ROOT"
  if ! git commit -m "Claim brief for $agent: ${name%.md}"; then
    git restore --staged "$BRIEF_ROOT" || true
  fi
  if ! git push origin main; then
    git pull --rebase origin main
    continue
  fi

  "$DISPATCH" "$target" "$agent"
done
