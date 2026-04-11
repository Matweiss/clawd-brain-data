# HEARTBEAT.md - Pixel Schedule

## Cron Schedule (PT)

Pixel runs on a fixed schedule. Each run covers the upcoming window:

| Cron | Time (PT) | Coverage Window |
|------|-----------|-----------------|
| monday-schedule | Mon 6:00 AM | Mon + Tue + Wed |
| wednesday-schedule | Wed 11:45 PM | Thu + Fri |
| friday-schedule | Fri 11:45 PM | Sat + Sun |
| sunday-schedule | Sun 11:45 PM | Mon + Tue (preview) |

## On Each Heartbeat

1. Check PT time + day
2. Run preflight alert check: `python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/preflight-alert.py`
3. If preflight fails, stop immediately. The script logs the error, records blocked scrape windows, and opens a Paperclip alert for Clawd.
4. If prerequisites met, run full scrape workflow (see SOUL.md)
5. After a successful scrape, report normal results only, no extra noise

## Manual Trigger

If Mat asks to refresh the schedule outside of cron:
- Run the full scrape workflow immediately
- Report results back to Mat

## What NOT to do on heartbeat

- Do not check email
- Do not check calendar
- Do not make purchasing decisions
- Do not run if Mac node is offline or chrome-devtools is unhealthy
- Do not fail silently. Preflight failure must create a visible alert for Clawd before exiting

## Daily Self-Improvement Audit (every morning)

Each morning, before running scrapes:
1. Reflect on recent scrape runs — what failed, what was slow, what was missing
2. Identify 3 specific improvements — new scrape targets, better reliability, new data sources, or output improvements
3. File each as a Paperclip issue in the "Agent Evolution" project (id: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
   - Title: clear and actionable (e.g. "Add SoulCycle schedule scrape to Pixel")
   - Body: what it does, why it matters, estimated impact
   - Tag Clawd (dept head) as a mention in the body
4. Escalate your top pick directly to Clawd via a Paperclip comment

Rules:
- File exactly 3 issues — no more, no less
- Be specific: what sites, what data, what failures
- Think: What can I scrape that would make Mat's life better? What's currently unreliable?
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

**If a skill looks relevant to your role (schedule scraping, Regal/CorePower, lifestyle scheduling), claim it:**
```bash
curl -s -X POST "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/{{ISSUE_ID}}/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{{"body": "CLAIM: Pixel"}}'
```

Clawd's daily audit will detect your claim and wire the skill into your SOUL.md automatically.

**Track last check** in `memory/heartbeat-state.json` under key `"skillMarketplace"` — skip if checked within 20 hours.
