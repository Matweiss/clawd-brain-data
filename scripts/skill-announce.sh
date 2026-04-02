#!/usr/bin/env bash
# skill-announce.sh — Announce a skill to the Paperclip Skill Marketplace
# Usage: bash scripts/skill-announce.sh <skill-name>
# Example: bash scripts/skill-announce.sh mac-chrome-cdp

set -euo pipefail

SKILL_NAME="${1:-}"
if [[ -z "$SKILL_NAME" ]]; then
  echo "Usage: $0 <skill-name>"
  exit 1
fi

WORKSPACE="/root/.openclaw/workspace"
SKILL_FILE="$WORKSPACE/skills/$SKILL_NAME/SKILL.md"
COMPANY="b453f88c-22e0-4521-8843-8427a4e20538"
MARKETPLACE_PROJECT="2b0e7cd6-f654-4dfc-a33e-85580a4f8127"
API_BASE="https://paperclip.thematweiss.com"
TOKEN="${PAPERCLIP_API_KEY:-pcp_beeaa78e48273528acbef95d643fdd855cf267040663ea9d}"

if [[ ! -f "$SKILL_FILE" ]]; then
  echo "ERROR: Skill file not found: $SKILL_FILE"
  exit 1
fi

# Extract name and description from YAML frontmatter
SKILL_DISPLAY_NAME=$(python3 -c "
import re, sys
content = open('$SKILL_FILE').read()
m = re.search(r'^name:\s*(.+)$', content, re.MULTILINE)
print(m.group(1).strip() if m else '$SKILL_NAME')
")

SKILL_DESC=$(python3 -c "
import re, sys
content = open('$SKILL_FILE').read()
# Handle multiline description (indented continuation lines)
m = re.search(r'^description:\s*(.+?)(?=\n\w|\n---)', content, re.MULTILINE | re.DOTALL)
if m:
    desc = re.sub(r'\s+', ' ', m.group(1).strip())
    print(desc[:120])
else:
    print('No description')
")

ISSUE_TITLE="NEW SKILL: $SKILL_DISPLAY_NAME — ${SKILL_DESC:0:80}"

echo "Skill: $SKILL_DISPLAY_NAME"
echo "Title: $ISSUE_TITLE"

# Check for existing issue with this skill name
echo "Checking for existing announcement..."
EXISTING=$(curl -s "$API_BASE/api/companies/$COMPANY/issues?projectId=$MARKETPLACE_PROJECT" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    issues = json.load(sys.stdin)
    for i in issues:
        if 'NEW SKILL: $SKILL_DISPLAY_NAME' in i.get('title','') or 'NEW SKILL: $SKILL_NAME' in i.get('title',''):
            print(i['id'])
            break
except:
    pass
")

if [[ -n "$EXISTING" ]]; then
  echo "Already announced (issue $EXISTING) — skipping"
  exit 0
fi

# Build description body
SKILL_CONTENT=$(cat "$SKILL_FILE")
ISSUE_BODY=$(python3 -c "
import json, sys

skill_content = open('$SKILL_FILE').read()
body = '''## Skill: \`$SKILL_DISPLAY_NAME\`

**Git path:** \`skills/$SKILL_NAME/\`

---

''' + skill_content + '''

---

## How to claim this skill

If this skill is relevant to your role, comment on this issue:

\`\`\`
CLAIM: <your-agent-name>
\`\`\`

Example: \`CLAIM: Pixel\`

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

## How to request a new skill

File a new issue in this project titled: \`SKILL REQUEST: <what you need>\`
Describe what you need it to do. Clawd will assess and build.
'''
print(body)
")

# Create the issue
echo "Creating Paperclip issue..."
RESULT=$(curl -s -X POST "$API_BASE/api/companies/$COMPANY/issues" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json
print(json.dumps({
    'projectId': '$MARKETPLACE_PROJECT',
    'title': '$ISSUE_TITLE',
    'description': open('$SKILL_FILE').read() + '\n\n---\n\n## How to claim\n\nComment \`CLAIM: <your-name>\` on this issue. Clawd processes claims daily and wires the skill into your SOUL.md.\n\n## Request a skill\n\nFile an issue titled \`SKILL REQUEST: <what you need>\`.',
    'status': 'todo',
    'priority': 'medium'
}))
")")

ISSUE_ID=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','ERROR'))")
echo "✅ Announced: issue $ISSUE_ID"
echo "$ISSUE_ID"
