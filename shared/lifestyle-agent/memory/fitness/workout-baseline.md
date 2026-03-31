---
type: fitness-baseline
created: 2026-03-31
updated: 2026-03-31
tags: [yoga, corepower, fitness, tracking, baseline]
---

# Workout Tracking Baseline — Mat Weiss

## Tracking Method

**Primary:** CorePower Yoga app/website (manual check via browser coworking)
**Secondary:** Mission Control dashboard (`/api/yoga/stats`)
**Data source:** CorePower member dashboard — attended class history

No wearable device tracking configured (Apple Watch, Garmin, Whoop, etc. — unknown).
No third-party fitness app detected (Strava, Apple Health, etc. — unknown).

## Baseline Data (as of March 16, 2026)

- **Total lifetime classes:** 51
- **Membership:** All Access
- **Primary studio:** Encino
- **Preferred class:** YS - Yoga Sculpt
- **Preferred time:** 4:15pm
- **Preferred days:** Sun, Mon, Tue, Thu, Fri

## Recent History (March 2025)

| Date    | Class | Teacher     | Time   |
|---------|-------|-------------|--------|
| Mar 16  | YS    | Linnie S    | 4:15pm |
| Mar 15  | YS    | Danielle S  | 4:15pm |
| Mar 14  | C2    | Kylie B     | 4:15pm |
| Mar 13  | YS    | Danielle S  | 4:15pm |
| Mar 10  | YS    | Jacqueline M| 4:15pm |
| Mar 9   | YS    | Kylie B     | 4:15pm |

## Challenges Completed
- Live Your Power Challenge (Jan 2026) — 10 classes ✅

## Goals
- **Target:** 3+ sessions/week (SOUL.md spec: "target 3+ sessions/week")
- **Historical rate:** ~4-5 classes/week (March baseline)

## Session Log

Track sessions here as they occur. Format: `YYYY-MM-DD | Class | Teacher | Notes`

| Date | Class | Teacher | Notes |
|------|-------|---------|-------|
| (log sessions here) | | | |

## Streak Tracking

| Week of | Sessions | Target | Status |
|---------|----------|--------|--------|
| Mar 9   | 2        | 3+     | ⚠️ under |
| Mar 16  | 4        | 3+     | ✅ |
| (update weekly) | | | |

## Monitoring Protocol

Sage checks this file during:
- Morning check-in (7:30am PT weekdays)
- Weekly review (Sunday evening PT)

**Missed session detection:**
- If no session logged in 3+ days → gentle nudge
- If week ends with <3 sessions → acknowledge + encourage
- Never shame, always forward-looking

## Data Sources Available

1. **CorePower browser scraping** — via schedule-scraper skill (mcporter/Chrome DevTools)
   - Can pull Mat's class history from CorePower dashboard when browser coworking is active
2. **Manual logging** — Mat or agent logs sessions directly into this file
3. **Mission Control** — `/api/yoga/stats` endpoint reads from history log

## Next Steps (for future enhancement)
- [ ] Automate session detection: scrape CorePower history after each cron run
- [ ] Add Apple Health / HealthKit integration if Mat uses iPhone fitness tracking
- [ ] Connect to Home Assistant (Mat leaving/returning could infer gym visits)
