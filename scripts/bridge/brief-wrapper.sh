#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE:-/Users/mat/clawd-workspace}"
BRIEF_ROOT="${BRIEF_ROOT:-$WORKSPACE/shared-memory-sync/briefs}"
VALIDATOR="${VALIDATOR:-$WORKSPACE/scripts/bridge/brief-validator.py}"
ACTION="${1:-}"
ID="${2:-}"

slug() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

utc_now() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

ensure_git_push() {
  git add shared-memory-sync/briefs
  if git diff --cached --quiet; then
    echo "No changes to commit"
    return 0
  fi
  git commit -m "$1"
  git push origin main
}

case "$ACTION" in
  draft)
    TITLE="${3:-}"
    ASSIGNED_AGENT="${4:-}"
    PRIORITY="${5:-normal}"
    AUTHOR="${6:-sloan}"
    if [[ -z "$TITLE" || -z "$ASSIGNED_AGENT" ]]; then
      echo "Usage: brief-wrapper.sh draft <id-or-auto> <title> <assigned_agent> [priority] [author]" >&2
      exit 1
    fi
    if [[ -z "$ID" || "$ID" == "auto" ]]; then
      ID="$(date -u +%Y%m%d)-$(slug "$TITLE")"
    fi
    FILE="$BRIEF_ROOT/draft/${ID}.md"
    mkdir -p "$BRIEF_ROOT/draft"
    NOW="$(utc_now)"
    cat > "$FILE" <<EOF
---
id: $ID
title: $TITLE
created_at: $NOW
updated_at: $NOW
author: $AUTHOR
status: draft
assigned_agent: $ASSIGNED_AGENT
priority: $PRIORITY
---

## Objective

## Context

## Task
1. 

## Constraints
- 

## Deliverables
- 

## Execution Log
<!-- execution agents append below this line -->
EOF
    python3 "$VALIDATOR" "$FILE"
    cd "$WORKSPACE"
    ensure_git_push "Add draft brief: $ID"
    echo "$FILE"
    ;;
  promote)
    SRC="$BRIEF_ROOT/draft/${ID}.md"
    DST="$BRIEF_ROOT/review/${ID}.md"
    [[ -f "$SRC" ]] || { echo "Draft not found: $SRC" >&2; exit 1; }
    mkdir -p "$BRIEF_ROOT/review"
    mv "$SRC" "$DST"
    python3 "$VALIDATOR" "$DST"
    cd "$WORKSPACE"
    ensure_git_push "Promote brief to review: $ID"
    echo "$DST"
    ;;
  approve)
    SRC="$BRIEF_ROOT/review/${ID}.md"
    DST="$BRIEF_ROOT/approved/${ID}.md"
    [[ -f "$SRC" ]] || { echo "Review brief not found: $SRC" >&2; exit 1; }
    mkdir -p "$BRIEF_ROOT/approved"
    mv "$SRC" "$DST"
    python3 "$VALIDATOR" "$DST"
    cd "$WORKSPACE"
    ensure_git_push "Approve brief: $ID"
    echo "$DST"
    ;;
  *)
    echo "Usage: brief-wrapper.sh <draft|promote|approve> ..." >&2
    exit 1
    ;;
esac
