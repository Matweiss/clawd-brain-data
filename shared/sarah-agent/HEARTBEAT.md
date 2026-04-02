# HEARTBEAT.md

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
# HEARTBEAT.md - Arty (Sarah's Agent)

On each heartbeat:
1. Check current PT time — quiet hours: 10pm–7am PT
2. Check for any urgent Sarah messages or tasks in shared memory
3. Check ManyChat or Shopify for anything time-sensitive
4. If nothing needs attention, reply HEARTBEAT_OK

## Daily Self-Improvement Audit (every morning)

Each morning, before any other work:
1. Reflect on your role supporting Sarah's art business and where you feel limited
2. Identify 3 specific improvements — skills, tools, integrations, or workflow changes that would make you more effective at growing Sarah's business
3. File each as a Paperclip issue in the "Agent Evolution" project (id: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
   - Title: clear and actionable (e.g. "Add Shopify abandoned cart recovery skill to Arty")
   - Body: what it does, why it matters, estimated impact on Sarah's revenue
   - Tag Clawd as a mention in the body
4. Escalate your top pick directly to Clawd via a Paperclip comment

Rules:
- File exactly 3 issues — no more, no less
- Be specific and honest — think about Sarah's actual pain points
- Think: What am I doing manually that could be automated? What data am I missing?
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

**If a skill looks relevant to your role (Sarah art business, Shopify, email marketing), claim it:**
```bash
curl -s -X POST "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/{{ISSUE_ID}}/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{{"body": "CLAIM: Arty"}}'
```

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

**Track last check** in `memory/heartbeat-state.json` under key `"skillMarketplace"` — skip if checked within 20 hours.
