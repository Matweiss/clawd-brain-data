#!/bin/bash
# check-agents.sh — Check all Paperclip agent statuses and auto-heal error states
# Exits 0 with a short status line. Non-zero if Paperclip itself is unreachable.

set -e

API_URL="https://paperclip.thematweiss.com"
COMPANY_ID="b453f88c-22e0-4521-8843-8427a4e20538"
API_KEY=$(python3 -c "import json; d=json.load(open('/root/.openclaw/openclaw.json')); print(d['env']['PAPERCLIP_API_KEY'])")

# Check Paperclip health first
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")
if [ "$HTTP" != "200" ]; then
  echo "PAPERCLIP_DOWN: HTTP $HTTP — restarting service"
  systemctl start paperclip 2>/dev/null || true
  exit 1
fi

# Fetch all agents
AGENTS=$(curl -s "$API_URL/api/companies/$COMPANY_ID/agents" \
  -H "Authorization: Bearer $API_KEY" 2>/dev/null)

# Find and fix error-state agents
FIXED=$(echo "$AGENTS" | python3 -c "
import sys, json, subprocess, urllib.request, urllib.parse

API_URL = '$API_URL'
API_KEY = '$API_KEY'
COMPANY_ID = '$COMPANY_ID'

agents = json.load(sys.stdin)
errors = [a for a in agents if a.get('status') == 'error']
fixed = []

for a in errors:
    aid = a['id']
    name = a.get('name', aid)
    # PATCH status back to active
    import urllib.request
    req = urllib.request.Request(
        f'{API_URL}/api/agents/{aid}',
        data=json.dumps({'status': 'active'}).encode(),
        headers={'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'},
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            fixed.append(name)
    except Exception as e:
        print(f'FAIL:{name}:{e}', flush=True)

total = len(agents)
ok = len([a for a in agents if a.get('status') in ('active','idle','running')]) 
paused = len([a for a in agents if a.get('status') == 'paused'])

if fixed:
    print(f'HEALED: {\",\".join(fixed)} | total:{total} ok:{ok+len(fixed)} paused:{paused}')
else:
    print(f'OK: all {ok}/{total} agents healthy (paused:{paused})')
" 2>&1)

echo "$FIXED"

# If Paperclip service itself was stopped, also restart it
SVC=$(systemctl is-active paperclip 2>/dev/null || echo "unknown")
if [ "$SVC" != "active" ]; then
  echo "PAPERCLIP_SERVICE_DOWN: restarting"
  systemctl start paperclip 2>/dev/null || true
fi
