# Mission Control review against openclaw-nerve

Date: 2026-03-24
Repo reviewed: https://github.com/daggerhashimoto/openclaw-nerve
Local review copy: `/root/.openclaw/workspace/openclaw-nerve-review`
Target app: `/root/.openclaw/workspace/clawd-mission-control-v2`

## Executive summary

Nerve is stronger than the current Mission Control in four specific product areas:

1. **Operational shell / cockpit feel**
   - persistent top bar + bottom status bar
   - connection state, uptime, session count, context pressure, version/update badge
   - denser control-surface feel

2. **Real-time operating model**
   - event-driven updates via SSE/WS with polling only as fallback
   - explicit gateway connection state
   - more confidence about what is stale vs live

3. **Workspace + session ergonomics**
   - resizable panels
   - compact mode / view modes
   - tighter fleet-control mental model

4. **Observability and trust**
   - token/context telemetry
   - clearer logs/events/health state
   - better distinction between healthy, degraded, syncing, and offline

Mission Control is already stronger in a few areas:
- lifestyle/personal-command-center framing
- domain-specific cards (pipeline, yoga, HA, email, Lucra)
- dashboard storytelling / “what matters right now”

Best path is **not** to copy Nerve wholesale.
Best path is to import its **operating-system features** into Mission Control’s more personalized dashboard.

---

## Best features to bring over

## 1) Persistent cockpit status bar

### Why it matters
Mission Control currently has a small reliability strip and now a basic system status bar, but it still lacks a persistent operational heartbeat.

### Borrow from Nerve
- connection state chip
- session count
- gateway uptime
- context/token meter
- version / update status
- compact always-visible telemetry

### Mission Control adaptation
Create a top-or-bottom **Mission Status Rail** with:
- Gateway: Connected / Reconnecting / Offline
- Sessions: count
- Last refresh: relative time
- Context pressure: low / medium / high
- Cost today: optional
- Deploy/version badge
- Warnings count

### Priority
**P1**

---

## 2) Real-time data architecture upgrade

### Current weakness
`useMissionControl.ts` still relies on:
- direct Supabase pulls
- broad `fetchData()` refreshes
- 30 second polling
- no explicit gateway connection state

### Borrow from Nerve
- SSE + WS event subscriptions
- polling only as safety net
- dedicated hook for dashboard data freshness
- connection-aware refresh

### Mission Control adaptation
Refactor data layer into:
- `useMissionControlRealtime()`
- `useSystemHealth()`
- `useGatewayStatus()`

Use:
- event-driven refreshes where available
- smaller targeted refreshes per domain card
- a freshness model per panel instead of one global refresh timestamp

### Priority
**P1**

---

## 3) Better health model: green / yellow / red / syncing

### Current weakness
Current dashboard tends toward binary healthy/error.
That hides partial degradation.

### Borrow from Nerve
Nerve communicates state more like an operating surface than a marketing dashboard.

### Mission Control adaptation
Every subsystem should have:
- **green** = healthy
- **yellow** = degraded / limited / credential issue / zero credits / stale
- **red** = broken
- **blue or pulsing** = syncing
- **gray** = unknown

Use this in:
- integration cards
- hero section
- system bar
- notifications

### Priority
**P1**

---

## 4) Resizable multi-panel layout

### Why it matters
Mission Control is card-heavy and good for overview, but weaker for “operate while inspecting details.”

### Borrow from Nerve
- resizable panes
- control-plane feel
- side-by-side work

### Mission Control adaptation
Introduce desktop layout modes:
- **Dashboard mode** (current default)
- **Ops mode**
  - left: sessions / agent state / integrations
  - center: main dashboard or command center
  - right: logs / notifications / selected detail panel

At minimum, add:
- resizable right-side detail drawer
- persistent selected-item panel for task/email/pipeline details

### Priority
**P2**

---

## 5) View modes: Dashboard / ChatOps / Ops

### Why it matters
Nerve is good at switching mental modes.
Mission Control currently mixes overview and control in one page.

### Mission Control adaptation
Add simple top-level modes:
- **Overview** — current dashboard cards
- **Ops** — status, integrations, agents, logs, cron, system
- **Work** — email / pipeline / calendar execution focus

This can be done without a huge rewrite by changing what columns render.

### Priority
**P2**

---

## 6) Context / token telemetry

### Borrow from Nerve
- context meter
- token/cost awareness

### Mission Control adaptation
Add a compact telemetry widget that shows:
- current active session token use
- estimated context pressure
- daily cost or session cost if available
- warning when near limits

This fits well near System Status.

### Priority
**P2**

---

## 7) Event log / activity rail

### Current weakness
Recent activity exists, but it is visually weak and not very operational.

### Borrow from Nerve
- explicit event feed
- logs as first-class UI

### Mission Control adaptation
Create a persistent event rail showing:
- cron runs
- agent completions
- integration failures
- restarts
- warnings
- key user-triggered actions

Should support:
- severity
- timestamp
- source
- click for details

### Priority
**P2**

---

## 8) Better shell polish / operator feel

### Borrow from Nerve
- stronger identity of the app as a cockpit
- denser top bar
- better operational hierarchy

### Mission Control adaptation
Keep Mission Control’s warmer personal feel, but add:
- stronger header hierarchy
- compact chips instead of plain labels
- more consistent “status surfaces”
- fewer dead placeholder states

### Priority
**P3**

---

## What not to copy blindly

## 1) Don’t turn Mission Control into generic OpenClaw admin UI
Mission Control’s strength is that it is *Mat-specific* and action-oriented.
Keep:
- personal operating system framing
- life/work blend
- domain cards
- “Right Now” hero

## 2) Don’t over-index on raw logs everywhere
Nerve can be log-heavy.
Mission Control should keep summaries first, detail on demand.

## 3) Don’t import voice/TTS surface unless there’s a real use case
Nerve’s voice stack is cool but not obviously the highest leverage addition here.

---

## Concrete recommended roadmap

## Phase 1 — high leverage, low rewrite
1. Add persistent **Mission Status Rail**
2. Upgrade health semantics to green/yellow/red/syncing
3. Refactor integration status into explicit degraded states
4. Add event rail / recent system events
5. Replace coarse polling with more targeted refresh patterns where possible

## Phase 2 — operator mode
1. Add top-level view modes: Overview / Ops / Work
2. Add resizable detail drawer or split-pane layout
3. Add context/token telemetry widget
4. Add stronger session/agent operational surfaces

## Phase 3 — structural modernization
1. Introduce gateway/SSE-based live event model
2. Add persistent logs/events/session state
3. Make dashboard sections more composable and rearrangeable

---

## Immediate implementation recommendation

If improving Mission Control in the next 1-2 coding passes, the best sequence is:

### Pass A
- keep current page architecture
- add a **real operator status rail**
- add **system event rail**
- improve health chips / degraded states

### Pass B
- add **Overview / Ops / Work** modes
- add **resizable right detail panel**

That gets ~70% of the value from Nerve without rebuilding the app.

---

## Files reviewed in Nerve
- `src/components/StatusBar.tsx`
- `src/components/TopBar.tsx`
- `src/components/ResizablePanels.tsx`
- `src/hooks/useDashboardData.ts`
- `README.md`

## Key local files to improve in Mission Control
- `src/pages/index.tsx`
- `src/hooks/useMissionControl.ts`
- `src/components/IntegrationStatusPanel.tsx`
- `src/components/QuickStatsBar.tsx`
- `src/components/HeroSection.tsx`

---

## Bottom line

**Best import from Nerve:** the operational shell.

**Best thing to preserve from Mission Control:** the personalized decision dashboard.

So the right move is:
**make Mission Control feel more like a cockpit, without losing its personal command-center DNA.**
