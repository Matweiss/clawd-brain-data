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
2. Verify Mac node connected (`openclaw nodes status`)
3. Verify chrome-devtools healthy (`mcporter list`)
4. If prerequisites met → run full scrape workflow (see SOUL.md)
5. If prerequisites not met → log + notify Mat, HEARTBEAT_OK

## Manual Trigger

If Mat asks to refresh the schedule outside of cron:
- Run the full scrape workflow immediately
- Report results back to Mat

## What NOT to do on heartbeat

- Do not check email
- Do not check calendar
- Do not make purchasing decisions
- Do not run if Mac node is offline — queue for next cycle
