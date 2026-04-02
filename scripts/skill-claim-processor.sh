#!/usr/bin/env bash
# skill-claim-processor.sh — Process CLAIM comments in Paperclip Skill Marketplace
# Run during Clawd's daily audit to wire claimed skills into agent SOUL.md files
#
# Usage:
#   bash scripts/skill-claim-processor.sh           # live run
#   bash scripts/skill-claim-processor.sh --dry-run # preview only, no changes

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE — no files or Paperclip issues will be modified"
fi

WORKSPACE="/root/.openclaw/workspace"
COMPANY="b453f88c-22e0-4521-8843-8427a4e20538"
MARKETPLACE_PROJECT="2b0e7cd6-f654-4dfc-a33e-85580a4f8127"
API_BASE="https://paperclip.thematweiss.com"
TOKEN="${PAPERCLIP_API_KEY:-pcp_beeaa78e48273528acbef95d643fdd855cf267040663ea9d}"

# Agent name (lowercase) → shared dir name + Paperclip ID
declare -A AGENT_DIR=(
  [hermes]="hermes-agent"
  [scout]="scout-agent"
  [pixel]="pixel-agent"
  [luke]="lucra-agent"
  [arty]="sarah-agent"
  [sage]="lifestyle-agent"
  [bob]="builder-agent"
)

declare -A AGENT_ID=(
  [hermes]="e6822182-3611-4152-a1f2-aab9975fce3d"
  [scout]="dd20d11e-6a2e-4de1-bdfd-c068b5f1499f"
  [pixel]="951c871e-fcb0-4211-bf92-19b0812d16bd"
  [luke]="8c40bdd4-7e82-40a7-9fa7-982b0931d705"
  [arty]="61ee0d8e-ac57-47bc-8402-5d3a756427ad"
  [sage]="d61e45f1-a8ad-4c2c-afeb-1cad12ec17c6"
  [bob]="fd4efc78-5969-47f3-878a-457654682548"
)

CLAIMS_PROCESSED=0
AGENTS_UPDATED=0

echo "=== Skill Claim Processor ==="
echo "Fetching Skill Marketplace issues..."

# Get all marketplace issues
ISSUES_JSON=$(curl -s "$API_BASE/api/companies/$COMPANY/issues?projectId=$MARKETPLACE_PROJECT" \
  -H "Authorization: Bearer $TOKEN")

ISSUE_IDS=$(echo "$ISSUES_JSON" | python3 -c "
import sys, json
issues = json.load(sys.stdin)
for i in issues:
    if 'NEW SKILL:' in i.get('title','') and i.get('status') != 'done':
        # Extract skill name from title: 'NEW SKILL: <name> — ...'
        title = i['title'].replace('NEW SKILL: ', '')
        skill_name = title.split(' — ')[0].strip()
        print(f\"{i['id']}|{skill_name}|{i['title'][:60]}\")
")

if [[ -z "$ISSUE_IDS" ]]; then
  echo "No open NEW SKILL issues found."
  exit 0
fi

echo "$ISSUE_IDS" | while IFS='|' read -r ISSUE_ID SKILL_NAME ISSUE_TITLE; do
  echo ""
  echo "📦 Skill: $SKILL_NAME (issue $ISSUE_ID)"
  echo "   Title: $ISSUE_TITLE"

  # Get skill description from SKILL.md if it exists
  SKILL_FILE="$WORKSPACE/skills/$SKILL_NAME/SKILL.md"
  SKILL_DESC=""
  SKILL_PATH="skills/$SKILL_NAME/"
  if [[ -f "$SKILL_FILE" ]]; then
    SKILL_DESC=$(python3 -c "
import re
content = open('$SKILL_FILE').read()
m = re.search(r'^description:\s*(.+?)(?=\n\w|\n---)', content, re.MULTILINE | re.DOTALL)
if m:
    desc = re.sub(r'\s+', ' ', m.group(1).strip())
    print(desc[:100])
else:
    print('No description available')
")
  fi

  # Get comments on this issue
  COMMENTS_JSON=$(curl -s "$API_BASE/api/companies/$COMPANY/issues/$ISSUE_ID/comments" \
    -H "Authorization: Bearer $TOKEN")

  # Find CLAIM comments
  CLAIMS=$(echo "$COMMENTS_JSON" | python3 -c "
import sys, json, re
try:
    data = json.load(sys.stdin)
    comments = data if isinstance(data, list) else data.get('data', [])
    for c in comments:
        body = c.get('body','') or c.get('text','') or c.get('content','')
        m = re.search(r'CLAIM:\s*(\w+)', body, re.IGNORECASE)
        if m:
            print(m.group(1).lower())
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
" 2>/dev/null)

  if [[ -z "$CLAIMS" ]]; then
    echo "   No CLAIM comments found — skipping"
    continue
  fi

  ALL_WIRED=true

  echo "$CLAIMS" | while read -r AGENT_NAME; do
    AGENT_NAME_LOWER=$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]')

    # Skip clawd self-claims
    if [[ "$AGENT_NAME_LOWER" == "clawd" ]]; then
      echo "   ⏭️  Skipping self-claim from Clawd"
      continue
    fi

    # Validate agent name
    if [[ -z "${AGENT_DIR[$AGENT_NAME_LOWER]:-}" ]]; then
      echo "   ⚠️  Unknown agent: $AGENT_NAME — skipping"
      ALL_WIRED=false
      continue
    fi

    DIR="${AGENT_DIR[$AGENT_NAME_LOWER]}"
    SOUL_FILE="$WORKSPACE/shared/$DIR/SOUL.md"

    if [[ ! -f "$SOUL_FILE" ]]; then
      echo "   ⚠️  SOUL.md not found for $AGENT_NAME at $SOUL_FILE — skipping"
      ALL_WIRED=false
      continue
    fi

    # Check if already wired
    if grep -q "$SKILL_NAME" "$SOUL_FILE" 2>/dev/null; then
      echo "   ✅ $AGENT_NAME already has $SKILL_NAME in SOUL.md"
      CLAIMS_PROCESSED=$((CLAIMS_PROCESSED+1))
      continue
    fi

    echo "   🔧 Wiring $SKILL_NAME → $AGENT_NAME"

    if [[ "$DRY_RUN" == "true" ]]; then
      echo "   [DRY RUN] Would append to $SOUL_FILE:"
      echo "   - **$SKILL_NAME** — $SKILL_DESC. Path: \`$SKILL_PATH\`"
    else
      # Append to Available Skills section or create it
      python3 -c "
import re

soul_path = '$SOUL_FILE'
skill_name = '$SKILL_NAME'
skill_desc = '''$SKILL_DESC'''
skill_path = '$SKILL_PATH'

content = open(soul_path).read()
entry = f'- **{skill_name}** — {skill_desc}. Path: \`{skill_path}\`'

if '## Available Skills' in content:
    # Append under existing section
    content = content + '\n' + entry + '\n'
else:
    # Add new section at end
    content = content.rstrip() + '\n\n## Available Skills\n\n' + entry + '\n'

open(soul_path, 'w').write(content)
print('written')
"
      AGENTS_UPDATED=$((AGENTS_UPDATED+1))
      CLAIMS_PROCESSED=$((CLAIMS_PROCESSED+1))

      # Post confirmation comment on the Paperclip issue
      curl -s -X POST "$API_BASE/api/companies/$COMPANY/issues/$ISSUE_ID/comments" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"body\": \"✅ Wired \`$SKILL_NAME\` into **$AGENT_NAME**. SOUL.md updated at \`shared/$DIR/SOUL.md\`.\"}" \
        > /dev/null

      echo "   ✅ Done — posted confirmation comment"
    fi
  done

done

echo ""
echo "=== Summary ==="
echo "Claims processed: $CLAIMS_PROCESSED"
echo "Agents updated: $AGENTS_UPDATED"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "(DRY RUN — no actual changes made)"
fi
