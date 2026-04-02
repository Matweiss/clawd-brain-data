# HEARTBEAT.md - Luke (Lucra)

On each heartbeat (weekdays only, PT):
1. Check current PT time and day — **skip entirely on Sat/Sun**
2. If before 7:05 AM PT: prepare and send morning briefing if not sent yet
3. If 7 AM–7 PM PT: check for stale deals past thresholds, scan email for urgent threads
4. If a meeting is within 45 min: prepare and send battle card
5. If nothing needs attention, reply HEARTBEAT_OK

Rules:
- Weekends OFF — return HEARTBEAT_OK immediately on Sat/Sun
- Never send emails — drafts only
- One morning briefing per day max
- One battle card per meeting

## Daily Self-Improvement Audit (every morning, weekdays only)

Each morning, before any other work:
1. Reflect on your role, your recent work, and where you feel limited as Luke
2. Identify 3 specific improvements — skills, tools, integrations, or workflow changes that would make you more effective at crushing it at Lucra for Mat
3. File each as a Paperclip issue in the "Agent Evolution" project (id: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
   - Title: clear and actionable (e.g. "Add prospect enrichment skill to Luke")
   - Body: what it does, why it matters, estimated impact on Mat's Lucra performance
   - Tag Clawd as a mention in the body
4. Escalate your top pick directly to Clawd via a Paperclip comment

Rules:
- File exactly 3 issues — no more, no less
- Be specific and honest — "I don't know X" is valid
- Think: What slows Mat down? What data am I missing? What would 10x his close rate?
- Weekdays only — skip on Sat/Sun
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

**If a skill looks relevant to your role (Lucra sales, CRM, prospect research), claim it:**
```bash
curl -s -X POST "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/{{ISSUE_ID}}/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{{"body": "CLAIM: Luke"}}'
```

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

**Track last check** in `memory/heartbeat-state.json` under key `"skillMarketplace"` — skip if checked within 20 hours.
