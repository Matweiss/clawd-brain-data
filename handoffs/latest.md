# CLAWD Mission Control - Current State Handoff

**Generated:** March 11, 2026
**Session:** Dashboard Recovery + Google Auth + Card Restoration
**Agent:** CLAWD Prime

---

## 🎯 Current Active Work

### 1. Mission Control Dashboard Recovery 🔄 IN PROGRESS
**Status:** Live at https://clawd-mission-control-v2.vercel.app

The dashboard had drifted away from a richer earlier version. This session restored the richer entrypoint and began rebuilding the desired card set.

### 2. Google OAuth / Google Data Access ✅ UNBLOCKED
**Status:** OAuth flow repaired, refresh token generated, Vercel envs added to the Mission Control project.

### 3. Card Restoration ✅ FIRST PASS COMPLETE
New cards added to the live dashboard code:
- ✅ Home Assistant card
- ✅ Lucra Commission Tracker
- ✅ Lifestyle Goal Tracker
- ✅ Regal Movie Tracker

---

## ✅ Completed This Session

### Code / Deploy Work
- Hardened Google OAuth token flow
- Fixed Google Sheets API syntax issue
- Restored richer dashboard entrypoint into `src/pages/index.tsx`
- Added four new dashboard cards
- Successfully pushed all changes to GitHub

### Important commits
- `7ddcaec` — Harden Google OAuth token flow
- `cf340ad` — Fix Sheets API syntax error
- `eef2d7d` — Restore richer dashboard entrypoint
- `521c581` — Add HA, Lucra, goals, and movie cards

---

## 📋 Current User-Approved Product Direction

Mat wants Mission Control to become a daily operating system that is:
- polished
- information-rich
- agent-operable
- trustworthy about data freshness and health

### Agreed strategy
1. Restore the right cards/features first
2. Improve layout and organization
3. Fix real data/functionality next
4. Build system health + agent-operable surfaces
5. Add deeper views/sidebar afterward

---

## 🧩 Agreed Next Layout

### Column 1 — Operations / system
- Active Agents
- Vault & Restoration
- Integration Status
- Schedule of Operations

### Column 2 — Life / presence
- Recent Events (if distinct from calendar)
- Home Assistant card (absorbs pet tracking)
- Lifestyle Goal Tracker
- Regal Movie Tracker

### Column 3 — Work / execution
- Calendar
- Email
- Sales Pipeline
- Lucra Commission Tracker

### Expected future merges
- Active Agents + Integration Status
- Lifestyle Agent + Goal Tracker
- Sales Pipeline + Lucra Commission

---

## 🏠 Exact Home Assistant Card Requirements
- iPhone battery
- charging status
- location / zone
- focus mode
- steps
- watch battery
- watch charging
- watch worn / on-wrist
- last updated
- Diggy location
- Theo location
- same-room indicator for Diggy + Theo

---

## 💼 Exact Lucra Requirements
Lucra starts **4/1**. The card should not imply underperformance before then.

Track:
- deals in pipeline
- year-to-date commission
- quarter-to-date
- pipeline commission potential
- closed won total
- payout tracker
- target vs actual

Notes:
- monthly quota is not important
- quarterly and annual framing matter more

---

## 🧘 Exact Goal Tracker Requirements
Start with:
- sleep target
- yoga per week
- steps

---

## 🎬 Exact Movie Tracker Requirements
- Regal Unlimited = **$26.95/month**
- billed on the **15th**
- log movies seen
- undo mistaken entries
- monthly total
- yearly total
- watchlist / want-to-see
- move watchlist → seen easily

---

## 🔧 Current Integration State

### Google
Mission Control Vercel project should now have:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

### Home Assistant
- HA APIs exist
- pet locations endpoint exists
- some new HA card values are currently placeholder/fallback values pending fuller real wiring

### Data correctness still pending
- Calendar
- Gmail
- Sheets/pipeline
- commission logic
- movie persistence
- goal persistence

---

## 📁 Most Relevant Files Right Now

### App entrypoint
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/pages/index.tsx`

### New cards from this session
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/components/HomeAssistantCard.tsx`
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/components/LucraCommissionCard.tsx`
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/components/LifestyleGoalTrackerCard.tsx`
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/components/MovieTrackerCard.tsx`

### Related integration/auth files
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/pages/api/auth/google-token.ts`
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/pages/api/auth/refresh-google.ts`
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/lib/sheets-api.ts`
- `/data/.openclaw/workspace/clawd-mission-control-v2/src/pages/api/gmail/import.ts`

---

## 🚨 Immediate Next Steps
1. Rebalance dashboard into the agreed 3-column layout
2. Remove standalone Pet Tracker from dashboard if HA card fully absorbs it
3. Start fixing real data/functionality after layout feels right
4. Add System Health panel soon after
5. Add sidebar / dedicated views after that

---

## 📞 Zero-Context Recovery Note
If a new agent starts cold, the safest first move is:
1. Read this handoff
2. Read `src/pages/index.tsx`
3. Read the four new card components
4. Implement the agreed layout reorganization before deeper feature work

---

*Last updated: March 11, 2026*
