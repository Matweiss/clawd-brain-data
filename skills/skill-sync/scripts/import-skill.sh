#!/bin/bash
# import-skill.sh — Import a skill into Paperclip registry and announce it
# Usage: import-skill.sh <skill-path> "<description>"

set -e

SKILL_PATH="${1:?Usage: import-skill.sh <skill-path> '<description>'}"
DESCRIPTION="${2:-}"
API_URL="https://paperclip.thematweiss.com"
COMPANY_ID="b453f88c-22e0-4521-8843-8427a4e20538"
SM_PROJECT_ID="2b0e7cd6-f654-4dfc-a33e-85580a4f8127"
CLAWD_ID="a0edadcb-f994-40e3-a9a1-d3ffde595c3e"
API_KEY=$(python3 -c "import json; d=json.load(open('/root/.openclaw/openclaw.json')); print(d['env']['PAPERCLIP_API_KEY'])")

SKILL_NAME=$(basename "$SKILL_PATH")
SKILL_MD="$SKILL_PATH/SKILL.md"

if [ ! -f "$SKILL_MD" ]; then
  echo "ERROR: No SKILL.md found at $SKILL_MD"
  exit 1
fi

# Extract description from SKILL.md frontmatter if not provided
if [ -z "$DESCRIPTION" ]; then
  DESCRIPTION=$(python3 -c "
import re, sys
content = open('$SKILL_MD').read()
m = re.search(r'description:\s*(.+?)(?:\n[a-z]|\n---)', content, re.DOTALL)
if m:
    desc = m.group(1).strip().replace('\n', ' ')
    print(desc[:200])
else:
    print('No description')
")
fi

echo "Importing skill: $SKILL_NAME"
echo "Description: $DESCRIPTION"

# Import skill into Paperclip registry
IMPORT_RESULT=$(curl -s -X POST "$API_URL/api/companies/$COMPANY_ID/skills" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"key\": \"clawd/$SKILL_NAME\",
    \"name\": \"$SKILL_NAME\",
    \"description\": $(python3 -c "import json; print(json.dumps('$DESCRIPTION'))"),
    \"source\": \"local\",
    \"path\": \"$SKILL_PATH\"
  }" 2>/dev/null)

SKILL_ID=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','ERROR'))" 2>/dev/null)
echo "Skill registry ID: $SKILL_ID"

# Post announcement issue in Skill Marketplace
ANNOUNCE=$(curl -s -X POST "$API_URL/api/companies/$COMPANY_ID/issues" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"[NEW SKILL] $SKILL_NAME\",
    \"projectId\": \"$SM_PROJECT_ID\",
    \"assigneeAgentId\": \"$CLAWD_ID\",
    \"priority\": \"normal\",
    \"body\": \"# New Skill Available: $SKILL_NAME\n\n## What it does\n$DESCRIPTION\n\n## How to claim\nComment: \`CLAIM: your-agent-name\`\nClawd will assign it on your next heartbeat.\n\n## Skill path\n\`$SKILL_PATH\`\"
  }" 2>/dev/null)

ISSUE_ID=$(echo "$ANNOUNCE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','ERROR'))" 2>/dev/null)
echo "Announcement issue: $ISSUE_ID"
echo "Done. Agents will see this on their next heartbeat."
