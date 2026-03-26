# V5 Task Checklist — Dual-Account Briefing + Confirmation Mining

## Phase 1 — Connection setup
- [ ] Connect personal Gmail
- [ ] Connect personal Calendar
- [ ] Connect Lucra Gmail
- [ ] Connect Lucra Calendar
- [ ] Verify account labeling / source separation (`personal` vs `lucra`)
- [ ] Confirm read scopes needed for email + calendar retrieval

## Phase 2 — Retrieval behavior
- [ ] Define source-aware inbox search behavior
- [ ] Define source-aware calendar retrieval behavior
- [ ] Confirm default search routing for personal vs work questions
- [ ] Define merged-briefing mode for day/week planning

## Phase 3 — Confirmation mining
- [ ] Airline confirmation extraction
- [ ] Hotel confirmation extraction
- [ ] Reservation extraction (restaurants/events when available)
- [ ] Work travel / meeting extraction from Lucra email/calendar
- [ ] Normalize extracted fields: date, time, location, confirmation code, source, status

## Phase 4 — Memory reconciliation
- [ ] Reconcile extracted travel/event data into `memory/upcoming-events.md`
- [ ] Define write/update rules for event entries
- [ ] Avoid duplicate event creation
- [ ] Preserve source attribution in working notes if needed

## Phase 5 — Reasoning / briefing logic
- [ ] Small-cue expansion from partial user statements
- [ ] Memory + inbox + calendar reconciliation
- [ ] High-value follow-up bundles for unresolved details only
- [ ] Daily briefing format: work + personal + conflicts + prep
- [ ] Travel briefing format: bookings complete / missing / next actions

## Phase 6 — Validation scenarios
- [ ] "I booked a flight for June"
- [ ] "What do I have going on today?"
- [ ] "Did I book the hotel yet?"
- [ ] "How should I pack for this trip?"
- [ ] "What should I focus on today?"
- [ ] Test work/personal separation and merged-view behavior

## Phase 7 — Operational polish
- [ ] Add a memory note documenting v5 behavior after launch
- [ ] Update skill/docs with final dual-account patterns
- [ ] Add pruning/review process for stale past events in `memory/upcoming-events.md`
