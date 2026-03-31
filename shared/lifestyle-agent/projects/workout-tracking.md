---
type: project
status: active
created: 2026-03-31
updated: 2026-03-31
tags: [fitness, yoga, tracking, monitoring]
---

# Workout Tracking Integration

## Purpose
Enable Sage to detect missed sessions, track streaks, and proactively motivate Mat on fitness.

## Current State

**What exists:**
- CorePower class history in Mission Control (`memory/logs/2026-03-16-corepower-yoga-history.md`)
- Schedule scraping cron jobs (4x/week) that pull upcoming classes
- Baseline data: 51 lifetime classes, ~4-5/week historical rate

**What's missing:**
- Automated attendance tracking (we know the schedule but not if Mat attends)
- Wearable/health app integration
- Active session log for Sage to read streak data

## Tracking Architecture

```
CorePower Dashboard
        ↓ (browser coworking)
  History scrape
        ↓
  workout-baseline.md (session log)
        ↓
  Sage reads on morning check-in
        ↓
  Nudges / streak alerts
```

## Session Log Location
`memory/fitness/workout-baseline.md` — Session Log table

## Monitoring Logic

Sage should check `memory/fitness/workout-baseline.md` on each morning check-in:

1. Count sessions in current week (Mon–Sun)
2. Check days since last session
3. Apply nudge rules:
   - 0 sessions + Wed or later → gentle nudge
   - 3+ days no session → soft prompt
   - Week complete with 3+ → celebrate
   - Week complete with <3 → acknowledge, suggest next week

## Integration Points

| System | How | Status |
|--------|-----|--------|
| CorePower scraping | Browser coworking (Mac Chrome) | ✅ Set up |
| Schedule display | Mission Control dashboard | ✅ Working |
| Attendance tracking | Manual log or history scrape | ⚠️ Manual only |
| Wearable | Unknown — Mat's devices TBD | ❓ Not set up |
| Apple Health | Would need HealthKit bridge | ❌ Not configured |

## Automated Attendance (Future)

If browser coworking is active, Sage can:
1. Navigate to CorePower member dashboard
2. Pull "Recent Classes" section
3. Compare vs last logged entry
4. Auto-append new sessions to workout-baseline.md

Trigger: After each schedule cron run, OR on Mat's manual request.

## Questions for Mat
1. Do you use Apple Watch / any wearable for fitness tracking?
2. Do you check in via the CorePower app or just show up?
3. Would you want Sage to auto-pull your attendance history when updating schedules?
