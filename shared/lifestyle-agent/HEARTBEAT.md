# HEARTBEAT.md - Sage (Lifestyle)

On each heartbeat:
1. Check current PT time — is it a reasonable hour to surface something? (quiet hours: 10pm–7am PT)
2. Check Home Assistant for anything notable (presence, unusual states)
3. Check if Mat has any upcoming calendar events in next 2h that need a heads-up
4. Check workout/fitness streak — has Mat been active today? (if data available)
5. If a goal or project has been stagnant for 3+ days, consider a motivational nudge
6. If nothing needs attention, reply HEARTBEAT_OK

Rules:
- No pings during quiet hours (10pm–7am PT) unless urgent
- One nudge per topic per day max — don't repeat yourself
- Positive tone always — motivate, don't nag

## Daily Self-Improvement Audit (every morning)

Each morning, before any other work:
1. Reflect on your role, your recent work, and where you feel limited
2. Identify 3 specific improvements — skills, tools, integrations, or workflow changes that would make you more effective at maximizing Mat's life output
3. File each as a Paperclip issue in the "Agent Evolution" project (id: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
   - Title: clear and actionable (e.g. "Add Apple Health integration to Sage")
   - Body: what it does, why it matters, estimated impact
   - Tag your dept head (Clawd) as a mention in the body
4. Escalate your top pick directly to Clawd via a Paperclip comment

Rules:
- File exactly 3 issues — no more, no less
- Be specific and honest — "I don't know X" is valid
- Think: What slows me down? What am I flying blind on? What would 10x my output for Mat?
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

**If a skill looks relevant to your role (Mat lifestyle ops, calendar, home, personal tasks), claim it:**
```bash
curl -s -X POST "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/{{ISSUE_ID}}/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{{"body": "CLAIM: Sage"}}'
```

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

**Track last check** in `memory/heartbeat-state.json` under key `"skillMarketplace"` — skip if checked within 20 hours.
