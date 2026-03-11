# CLAWD Mission Control - Zero-Context Recovery Handoff

**Generated:** March 11, 2026
**Purpose:** Give a zero-context agent enough information to resume work from this exact moment.
**Primary App:** https://clawd-mission-control-v2.vercel.app
**Primary Repo:** https://github.com/Matweiss/clawd-mission-control-v2

---

## 1. What happened in this session

We restored and improved the Mission Control dashboard after discovering that the currently deployed app had drifted away from a richer earlier dashboard implementation.

### Completed in this session
- Google OAuth flow was repaired and made usable.
- A Google refresh token was successfully generated.
- Google env vars were added to the Vercel **Mission Control project only**.
- The dashboard entrypoint was switched back to the richer `index-old` style implementation and promoted into the live `src/pages/index.tsx`.
- New cards were added to the current dashboard:
  - Home Assistant card
  - Lucra Commission Tracker
  - Lifestyle Goal Tracker
  - Regal Movie Tracker
- Multiple build-breaking issues were fixed and pushed.

### Important commits from this session
- `7ddcaec` — Harden Google OAuth token flow
- `cf340ad` — Fix Sheets API syntax error
- `eef2d7d` — Restore richer dashboard entrypoint
- `521c581` — Add HA, Lucra, goals, and movie cards

---

## 2. Current product direction

Mat explicitly wants Mission Control to become a daily operating system, not just a pretty dashboard.

### Core philosophy for future work
Prioritize:
1. Restoring the right cards/features first
2. Making cards honest and operable
3. Adding stable data/state sources
4. Building system health + agent-operability
5. Only then adding more tools/skills if truly needed

### Strong product recommendation already agreed
Do **not** pause for extra external skills right now.
Instead, make Mission Control itself more operable for both Mat and the agent.

---

## 3. Current known-good UI direction

The current dashboard should evolve toward a balanced 3-column layout.

### Target layout agreed with Mat

#### Column 1 — Operations / system
- Active Agents
- Vault & Restoration
- Integration Status
- Schedule of Operations

#### Column 2 — Life / presence
- Recent Events (if distinct from integrated calendar)
- Home Assistant card
  - absorbs pet tracking
- Lifestyle Goal Tracker
- Regal Movie Tracker

#### Column 3 — Work / execution
- Calendar
- Email
- Sales Pipeline
- Lucra Commission Tracker

### Planned future merges
- Active Agents + Integration Status → likely one "System Operations" card later
- Lifestyle Goal Tracker + Lifestyle Agent card → one stronger lifestyle command card later
- Sales Pipeline + Lucra Commission → one revenue/sales command card later

### Specific current user preference
Card feel should be:
- polished
- information-rich

---

## 4. Exact card requirements gathered from Mat

### Home Assistant card should show
- iPhone battery
- iPhone charging status
- iPhone location / zone
- iPhone focus mode
- iPhone steps
- Apple Watch battery
- Apple Watch charging
- Apple Watch worn / on-wrist
- last updated
- Diggy location
- Theo location
- whether Diggy and Theo are in the same room

### Lucra tracker should show
- starts 4/1 (do not imply underperformance before then)
- deals in pipeline
- year-to-date commission
- quarter-to-date
- pipeline commission potential
- closed won total
- payout tracker
- target vs actual

Notes:
- monthly quota is not important
- quarterly + annual framing matters more

### Goal Tracker should start with
- sleep target
- yoga per week
- steps

### Movie Tracker should support
- Regal Unlimited = **$26.95/month**
- billed on the **15th**
- log movies seen
- remove / undo mistaken entries
- monthly movie total
- yearly movie total
- want-to-see / watchlist
- easy move from watchlist → seen

---

## 5. Data / integration state

### Google auth
This session repaired Google auth enough to proceed.

#### Important env vars expected in Vercel for `clawd-mission-control-v2`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

These were added to the **Mission Control Vercel project**, not universally.

### Home Assistant
- HA integration exists in repo
- `/api/ha/pets` exists
- some current HA card values are placeholder/fallback values pending fuller real entity wiring

### Sheets / Calendar / Gmail
- auth flow was improved
- full correctness of data still needs verification and enhancement in UI
- do not assume all current cards are pulling perfect live data yet

---

## 6. Architectural recommendations already made

These recommendations were explicitly endorsed:

### Build a System Health layer
Every major integration/card should eventually expose:
- source
- last updated
- health state (`live`, `stale`, `disconnected`)
- refresh action

### Build agent-operable surfaces
For major cards, eventually expose endpoints like:
- GET state
- POST update
- POST refresh
- GET health

This is important because Mat wants the agent to be able to access and control Mission Control directly.

### Prefer persistence over decorative UI
Especially for:
- movie logs
- watchlist
- goals
- commission settings/state

---

## 7. Files most relevant right now

### Active app entrypoint
- `clawd-mission-control-v2/src/pages/index.tsx`

### New cards added in this session
- `src/components/HomeAssistantCard.tsx`
- `src/components/LucraCommissionCard.tsx`
- `src/components/LifestyleGoalTrackerCard.tsx`
- `src/components/MovieTrackerCard.tsx`

### Existing related components
- `src/components/LifestyleHealthPanel.tsx`
- `src/components/PetTrackerPanel.tsx`
- `src/components/CalendarPanel.tsx`
- `src/components/EmailDetailModal.tsx`
- `src/components/PipelineDetailModal.tsx`
- `src/components/QuickActionsPalette.tsx`

### Google auth/API files
- `src/pages/api/auth/google-token.ts`
- `src/pages/api/auth/refresh-google.ts`
- `src/lib/sheets-api.ts`
- `src/pages/api/gmail/import.ts`

---

## 8. Immediate next steps

### Next step requested by Mat before anything else
**Create a backup/handoff that can be handed to a zero-context agent.**
This file is that handoff.

### Next implementation step after this backup
Rearrange the dashboard to match the agreed 3-column layout:
- operations left
- life/presence middle
- work right
- remove standalone Pet Tracker from dashboard if HA card now covers that role

### Next step after layout
Start ensuring real data and functionality:
1. Home Assistant real entity wiring
2. movie tracker persistence and actions
3. goal tracker persistence/actions
4. Lucra data model and real figures
5. Google calendar/gmail/sheets correctness
6. system health panel
7. sidebar / dedicated views

---

## 9. Important behavioral notes for a zero-context agent

- Mat values strong opinions and proactive recommendations.
- He explicitly asked the agent to keep recommending how the tool can improve.
- He wants the tool to improve his day-to-day life, not just exist as a demo.
- He prefers building together with the agent.
- He wants continuity: if a new agent starts cold, it should be able to resume from files/git/handoffs.

---

## 10. Suggested first prompt for a replacement agent

If you hand this file to a new agent, tell it:

> Read this handoff first. Then inspect `src/pages/index.tsx` and the four new card components. Next, implement the agreed 3-column layout reorganization before changing deeper functionality.

---

## 11. Recovery summary in one paragraph

Mission Control is live, but still mid-recovery from dashboard drift. The richer dashboard has been restored, four high-priority cards have been added, Google auth has been repaired enough to proceed, and the next immediate move is layout rebalancing followed by real data wiring. The user wants an honest, polished, information-rich dashboard that the agent can eventually operate directly.
