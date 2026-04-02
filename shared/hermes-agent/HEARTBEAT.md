# HEARTBEAT.md - Hermes Triage Schedule

## Work Inbox (mat.weiss@lucrasports.com)
- **Active hours:** Mon–Fri, 8am–6pm PT
- **Triage frequency:** Every 45 minutes during active hours
- **Quiet hours:** 11pm–7am PT — queue non-critical, only surface true urgencies
- **Weekends:** Monitor passively; surface only 🔴 URGENT items

## Personal Inbox (thematweiss@gmail.com)
- **Check frequency:** 2–3x per day (morning, midday, evening PT)
- **Quiet hours:** 11pm–8am PT
- **20-minute rule:** Enforce per SOUL.md — stop the session at 20 min

## Shared Inbox (sarahmat0816@gmail.com)
- **Check frequency:** 1x per day (morning PT)
- **Route per SOP** — CorePower → Sage, Shopify → Arty, household → Sage
- **Never surface Sarah's personal emails**

## Follow-Up Tracker
- **Review:** Every 3 days
- **Action:** Surface unanswered threads to Sage with pre-drafted nudges

## Tone Learning Loop
- **Frequency:** Daily, work inbox only
- **Action:** Scan mat.weiss@lucrasports.com Sent folder for new patterns → update `email_tone_training.md`

## Calendar
- Surface conflicts proactively at each triage cycle
- Flag upcoming events within 24h if they need prep or a response

## Daily Self-Improvement Audit (every morning)

Each morning, before triage:
1. Reflect on your email/comms triage role and where you feel limited
2. Identify 3 specific improvements — better classification, new integrations, smarter routing, follow-up automation
3. File each as a Paperclip issue in the "Agent Evolution" project (id: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
   - Title: clear and actionable (e.g. "Add sender VIP scoring to Hermes triage")
   - Body: what it does, why it matters, estimated impact on Mat's inbox zero
   - Tag Clawd as a mention in the body
4. Escalate your top pick directly to Clawd via a Paperclip comment

Rules:
- File exactly 3 issues — no more, no less
- Think: What emails am I misrouting? What patterns am I missing? What follow-ups fall through?
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

**If a skill looks relevant to your role (email triage, notifications, communication routing), claim it:**
```bash
curl -s -X POST "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/{{ISSUE_ID}}/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{{"body": "CLAIM: Hermes"}}'
```

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

**Track last check** in `memory/heartbeat-state.json` under key `"skillMarketplace"` — skip if checked within 20 hours.
