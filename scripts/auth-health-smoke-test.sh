#!/usr/bin/env bash
# Lightweight Google auth smoke test for critical gog-backed accounts.
# Fast enough for cron, noisy only on failures unless --verbose is passed.

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
STATE_FILE="$WORKSPACE/memory/auth-health-state.json"
VERBOSE="${1:-}"
export GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-clawd}"

ACCOUNTS=(
  "thematweiss@gmail.com"
  "sarahmat0816@gmail.com"
  "mat.weiss@lucrasports.com"
)

NOW_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NOW_PT=$(TZ="America/Los_Angeles" date +"%a %b %-d, %-I:%M %p PT")

log() {
  if [[ "$VERBOSE" == "--verbose" ]]; then
    echo "$@"
  fi
}

check_account() {
  local account="$1"
  local gmail_ok=false
  local calendar_ok=false
  local gmail_detail=""
  local calendar_detail=""

  if gog gmail messages search 'in:inbox newer_than:14d' --max 1 --account "$account" --json >/tmp/auth-health-gmail.json 2>/tmp/auth-health-gmail.err; then
    gmail_ok=true
    gmail_detail="OK"
  else
    gmail_detail=$(tr '\n' ' ' </tmp/auth-health-gmail.err | sed 's/"/\\"/g' | cut -c1-220)
  fi

  if gog calendar events primary --from "$NOW_UTC" --to "$(date -u -d '+2 days' +"%Y-%m-%dT%H:%M:%SZ")" --account "$account" --json >/tmp/auth-health-cal.json 2>/tmp/auth-health-cal.err; then
    calendar_ok=true
    calendar_detail="OK"
  else
    calendar_detail=$(tr '\n' ' ' </tmp/auth-health-cal.err | sed 's/"/\\"/g' | cut -c1-220)
  fi

  if $gmail_ok && $calendar_ok; then
    echo "✅ $account — Gmail + Calendar OK"
  else
    [[ "$gmail_ok" == true ]] || echo "❌ $account — Gmail failed: $gmail_detail"
    [[ "$calendar_ok" == true ]] || echo "❌ $account — Calendar failed: $calendar_detail"
  fi

  local gmail_py_bool="False"
  local calendar_py_bool="False"
  [[ "$gmail_ok" == true ]] && gmail_py_bool="True"
  [[ "$calendar_ok" == true ]] && calendar_py_bool="True"

  python3 - <<PY
import json, os
state_path = "$STATE_FILE"
now = "$NOW_UTC"
account = "$account"
entry = {
  "gmail": {"ok": $gmail_py_bool, "detail": "$gmail_detail", "checkedAt": now},
  "calendar": {"ok": $calendar_py_bool, "detail": "$calendar_detail", "checkedAt": now},
}
try:
    with open(state_path) as f:
        state = json.load(f)
except Exception:
    state = {}
state.setdefault("accounts", {})[account] = entry
state["lastCheck"] = now
with open(state_path, "w") as f:
    json.dump(state, f, indent=2)
PY

  if ! $gmail_ok || ! $calendar_ok; then
    return 1
  fi
}

failures=0

echo "🔐 Auth Health Smoke Test — $NOW_PT"
echo "──────────────────────────────────────────"
for account in "${ACCOUNTS[@]}"; do
  log "Checking $account"
  if ! check_account "$account"; then
    failures=$((failures + 1))
  fi
done

echo ""
if [[ "$failures" -eq 0 ]]; then
  echo "Auth smoke test passed for all critical accounts."
  exit 0
else
  echo "Auth smoke test found $failures failing account(s)."
  exit 1
fi
