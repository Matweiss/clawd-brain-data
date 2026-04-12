# TMW-153 — Launch Calendar Orchestrator

## Goal
Turn Sarah's release workflow into one predictable launch calendar that coordinates:
- product prep
- landing page refreshes
- newsletter early access
- Instagram warmup
- Instagram public launch

## Why this matters
Sarah already launches with a clear pattern:
1. prepare hidden/orphan products
2. give newsletter subscribers first access
3. update landing pages so the right work is shown
4. open the launch on Instagram 24 hours later

The orchestrator makes that sequence reusable so each drop has one timeline instead of scattered reminders.

## Deliverables
- `launch-calendar-orchestrator.mjs` — CLI generator for release timelines
- `launch-calendar-sample.json` — example release input
- `launch-calendar-orchestrator-README.md` — usage notes

## Default timeline
- Day -5: Product prep in Shopify
- Day -3: Landing page review and availability cleanup
- Day 0: Newsletter early access send
- Day 0 evening: Instagram teaser/warmup
- Day +1: Instagram public launch

## Output
The script can output either:
- markdown, for operator planning and sharing
- json, for future automation if this gets wired into a dashboard or scheduler

## Future extension ideas
- Add collector segment recommendations from preference memory
- Add per-release task status tracking
- Add landing-page auto-audit hooks for sold work
- Add newsletter draft checkpoints and asset deadlines
