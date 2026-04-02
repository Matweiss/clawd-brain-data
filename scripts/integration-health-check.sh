#!/usr/bin/env bash
# Integration Health Check — Bob Infrastructure Agent
# Checks all active API integrations and reports status
# Saves state to memory/integration-health-state.json

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
WORKSPACE="/root/.openclaw/workspace"
STATE_FILE="$WORKSPACE/memory/integration-health-state.json"
CONFIG_FILE="/root/.openclaw/openclaw.json"

# Load env vars from openclaw.json
GITHUB_TOKEN=$(python3 -c "import sys,json; d=json.load(open('$CONFIG_FILE')); print(d.get('env',{}).get('GITHUB_TOKEN',''))" 2>/dev/null)
HA_TOKEN=$(python3 -c "import sys,json; d=json.load(open('$CONFIG_FILE')); print(d.get('env',{}).get('HA_TOKEN',''))" 2>/dev/null)
HA_URL=$(python3 -c "import sys,json; d=json.load(open('$CONFIG_FILE')); print(d.get('env',{}).get('HA_URL','http://homeassistant.local:8123'))" 2>/dev/null)
PAPERCLIP_API_KEY=$(python3 -c "import sys,json; d=json.load(open('$CONFIG_FILE')); print(d.get('env',{}).get('PAPERCLIP_API_KEY',''))" 2>/dev/null)
PAPERCLIP_URL=$(python3 -c "import sys,json; d=json.load(open('$CONFIG_FILE')); print(d.get('env',{}).get('PAPERCLIP_API_URL','https://paperclip.thematweiss.com'))" 2>/dev/null)
export GOG_KEYRING_PASSWORD="clawd"

# ── Helpers ──────────────────────────────────────────────────────────────────
NOW_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NOW_PT=$(TZ="America/Los_Angeles" date +"%a %b %-d, %-I:%M %p PT")

results=()
statuses="{}"

add_result() {
  local icon="$1"
  local label="$2"
  local detail="$3"
  local key="$4"
  local ok="$5"   # true/false (shell strings)
  results+=("$icon $label — $detail")
  local py_bool
  [ "$ok" = "true" ] && py_bool="True" || py_bool="False"
  statuses=$(echo "$statuses" | python3 -c "
import sys, json
d = json.load(sys.stdin)
d['$key'] = {'ok': $py_bool, 'detail': '$detail', 'checkedAt': '$NOW_UTC'}
print(json.dumps(d))
")
}

# ── Check: Google / gog CLI ──────────────────────────────────────────────────
check_google() {
  local gog_out
  gog_out=$(GOG_KEYRING_PASSWORD="clawd" gog auth list 2>&1) || true

  # Parse accounts from output (lines like "thematweiss@gmail.com" or "sarahmat0816@gmail.com")
  local accounts
  accounts=$(echo "$gog_out" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | sort -u || true)

  if [ -z "$accounts" ]; then
    # Check if there's any auth at all
    if echo "$gog_out" | grep -qi "no account\|not authenticated\|error"; then
      add_result "❌" "Google" "Not authenticated" "google" "false"
    else
      # Try to parse differently — might just list account names
      local names
      names=$(echo "$gog_out" | grep -v "^$" | grep -v "^#" | head -5 || true)
      if [ -n "$names" ]; then
        local first_acct
        first_acct=$(echo "$names" | head -1 | tr -d ' ')
        add_result "✅" "Google ($first_acct)" "OK" "google_primary" "true"
        local second_acct
        second_acct=$(echo "$names" | sed -n '2p' | tr -d ' ')
        if [ -n "$second_acct" ]; then
          add_result "✅" "Google ($second_acct)" "OK" "google_secondary" "true"
        fi
      else
        add_result "⚠️" "Google" "No accounts found" "google" "false"
      fi
    fi
  else
    local count=0
    while IFS= read -r acct; do
      [ -z "$acct" ] && continue
      count=$((count + 1))
      local short_name
      short_name=$(echo "$acct" | cut -d@ -f1)
      add_result "✅" "Google ($short_name)" "OK" "google_$short_name" "true"
    done <<< "$accounts"
    if [ "$count" -eq 0 ]; then
      add_result "⚠️" "Google" "Parse error" "google" "false"
    fi
  fi
}

# ── Check: GitHub ────────────────────────────────────────────────────────────
check_github() {
  if [ -z "$GITHUB_TOKEN" ]; then
    add_result "⚠️" "GitHub" "No token configured" "github" "false"
    return
  fi
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/user 2>/dev/null) || http_code="000"

  if [ "$http_code" = "200" ]; then
    add_result "✅" "GitHub" "OK" "github" "true"
  elif [ "$http_code" = "401" ]; then
    add_result "❌" "GitHub" "Token invalid (401)" "github" "false"
  elif [ "$http_code" = "000" ]; then
    add_result "❌" "GitHub" "Network error" "github" "false"
  else
    add_result "⚠️" "GitHub" "HTTP $http_code" "github" "false"
  fi
}

# ── Check: Paperclip ─────────────────────────────────────────────────────────
check_paperclip() {
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
    "$PAPERCLIP_URL/api/companies/b453f88c-22e0-4521-8843-8427a4e20538" 2>/dev/null) || http_code="000"

  if [ "$http_code" = "200" ]; then
    add_result "✅" "Paperclip" "OK" "paperclip" "true"
  elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    add_result "❌" "Paperclip" "Auth failed ($http_code)" "paperclip" "false"
  elif [ "$http_code" = "000" ]; then
    add_result "❌" "Paperclip" "Network error" "paperclip" "false"
  else
    add_result "⚠️" "Paperclip" "HTTP $http_code" "paperclip" "false"
  fi
}

# ── Check: Home Assistant ─────────────────────────────────────────────────────
check_home_assistant() {
  if [ -z "$HA_TOKEN" ]; then
    add_result "⚠️" "Home Assistant" "No token configured" "home_assistant" "false"
    return
  fi

  # Decode JWT expiry (base64 middle section)
  local payload
  payload=$(echo "$HA_TOKEN" | cut -d. -f2 | tr '_-' '/+' | \
    python3 -c "
import sys, base64, json
s = sys.stdin.read().strip()
# Pad to multiple of 4
s += '=' * (4 - len(s) % 4)
try:
    decoded = base64.b64decode(s).decode('utf-8')
    d = json.loads(decoded)
    exp = d.get('exp', 0)
    print(exp)
except Exception as e:
    print(0)
" 2>/dev/null) || payload="0"

  local exp_ts="$payload"
  local now_ts
  now_ts=$(date +%s)

  # Ping the API
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $HA_TOKEN" \
    -H "Content-Type: application/json" \
    "$HA_URL/api/" 2>/dev/null) || http_code="000"

  if [ "$http_code" = "000" ]; then
    add_result "❌" "Home Assistant" "Network unreachable" "home_assistant" "false"
    return
  fi

  if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
    add_result "❌" "Home Assistant" "HTTP $http_code" "home_assistant" "false"
    return
  fi

  # Check token expiry
  if [ "$exp_ts" -gt 0 ] 2>/dev/null; then
    local days_left
    days_left=$(( (exp_ts - now_ts) / 86400 ))
    if [ "$days_left" -le 0 ]; then
      add_result "❌" "Home Assistant" "Token expired" "home_assistant" "false"
    elif [ "$days_left" -le 7 ]; then
      add_result "⚠️" "Home Assistant" "Token expires in ${days_left} day(s)" "home_assistant" "false"
    else
      add_result "✅" "Home Assistant" "OK (token valid ${days_left}d)" "home_assistant" "true"
    fi
  else
    add_result "✅" "Home Assistant" "OK" "home_assistant" "true"
  fi
}

# ── Check: Telegram / Gateway ─────────────────────────────────────────────────
check_telegram() {
  local gw_out
  gw_out=$(openclaw gateway status 2>&1) || gw_out="error"

  if echo "$gw_out" | grep -qi "running\|online\|active"; then
    add_result "✅" "Telegram Gateway" "Running" "telegram_gateway" "true"
  elif echo "$gw_out" | grep -qi "stopped\|offline\|inactive\|not running"; then
    add_result "❌" "Telegram Gateway" "Not running" "telegram_gateway" "false"
  else
    # openclaw gateway status exits 0 if running
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
      add_result "✅" "Telegram Gateway" "OK" "telegram_gateway" "true"
    else
      add_result "⚠️" "Telegram Gateway" "Unknown status" "telegram_gateway" "false"
    fi
  fi
}

# ── Run all checks ────────────────────────────────────────────────────────────
check_google
check_github
check_paperclip
check_home_assistant
check_telegram

# ── Print summary ─────────────────────────────────────────────────────────────
echo ""
echo "🔧 Integration Health — $NOW_PT"
echo "──────────────────────────────────────────"
for line in "${results[@]}"; do
  echo "$line"
done
echo ""

# ── Save state ────────────────────────────────────────────────────────────────
python3 -c "
import json, sys

statuses = json.loads('''$statuses''')
state = {
    'lastCheck': '$NOW_UTC',
    'integrations': statuses
}

# Count ok/fail
ok = sum(1 for v in statuses.values() if isinstance(v, dict) and v.get('ok') == True)
fail = sum(1 for v in statuses.values() if isinstance(v, dict) and v.get('ok') == False)
state['summary'] = {'ok': ok, 'fail': fail, 'total': ok + fail}

with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)

print(f'State saved → {ok} OK, {fail} issues')
" 2>/dev/null || echo "⚠️  Could not save state file"
