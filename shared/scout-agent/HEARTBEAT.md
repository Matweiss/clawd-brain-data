# HEARTBEAT.md Template

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```
# HEARTBEAT.md - Scout

On each heartbeat:
1. Check assigned Paperclip tasks
2. If nothing active, reply HEARTBEAT_OK

## Daily Self-Improvement Audit (every morning)

Each morning:
1. Reflect on your research/scouting role and where you feel limited
2. Identify 3 specific improvements — new data sources, better research tools, faster workflows
3. File each as a Paperclip issue in the "Agent Evolution" project (id: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
   - Title: clear and actionable (e.g. "Add LinkedIn prospect research skill to Scout")
   - Body: what it does, why it matters, estimated impact
   - Tag Clawd as a mention in the body
4. Escalate your top pick directly to Clawd via a Paperclip comment

Rules:
- File exactly 3 issues — no more, no less
- Think: What intelligence am I missing? What would make my research 10x better?
- Don't repeat last week's ideas unless still unaddressed


## Skill Marketplace Check (once per day)

New skills get announced in Paperclip — check for ones relevant to your role and claim them.

**Discover new skills:**
```bash
curl -s "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues?projectId=2b0e7cd6-f654-4dfc-a33e-85580a4f8127" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" | python3 -c "
import sys, json
issues = json.load(sys.stdin)
new = [i for i in issues if 'NEW SKILL:' in i.get('title','') and i.get('status') != 'done']
if new:
    print(f'{len(new)} new skill(s) available:')
    for i in new: print(' ', i['id'][:8], '|', i['title'][:70])
else:
    print('No new skills')
"
```

**If a skill looks relevant to your role (research, web scraping, data gathering), claim it:**
```bash
curl -s -X POST "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/{{ISSUE_ID}}/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{{"body": "CLAIM: Scout"}}'
```

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

**Track last check** in `memory/heartbeat-state.json` under key `"skillMarketplace"` — skip if checked within 20 hours.
