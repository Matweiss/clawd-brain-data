# V5 Project — Dual-Account Briefing + Confirmation Mining

## Target window
First week of April 2026, when Lucra work email and calendar are available.

## Goal
Upgrade Clawd from memory-grounded planning into a source-aware personal/work briefing system that can:
- operate across **personal Gmail + Calendar** and **Lucra Gmail + Calendar**
- mine confirmations and schedule signals from both accounts
- reconcile those findings with memory
- proactively ask high-value follow-up questions only when needed
- generate stronger daily, travel, and prep briefings

## Account model
### Personal account
Use for:
- flights
- hotels
- restaurants / reservations
- personal events
- family/social logistics
- personal travel planning
- personal inbox management

### Lucra work account
Use for:
- work email
- work calendar
- onboarding
- customer meetings
- recruiting / internal meetings
- work travel
- task and schedule visibility related to Lucra

## Core behavior target
When Mat gives a small cue, the system should:
1. search memory for likely context
2. search the appropriate connected account(s)
3. infer likely event/trip/meeting purpose
4. reconcile details into one clean operational picture
5. ask only the smallest set of unresolved, high-value questions
6. update canonical memory where appropriate

## High-value use cases
### Travel confirmation mining
- airline confirmation emails
- hotel confirmations
- restaurant reservations
- event tickets / registrations
- travel changes / delays

### Daily / weekly briefings
- combine personal plans + Lucra calendar
- separate personal vs work by source, but allow merged briefing when useful
- surface conflicts, missing logistics, and prep needs

### Small-cue expansion
Example:
- "I booked a flight for June"

Desired behavior:
- check memory for June weddings/trips/events
- search personal Gmail for airline confirmations
- infer destination/dates/return/hotel if possible
- ask only unresolved questions
- update `memory/upcoming-events.md`

## Memory reconciliation target
Canonical event memory remains:
- `memory/upcoming-events.md`

System should reconcile:
- memory
- personal Gmail
- personal Calendar
- Lucra Gmail
- Lucra Calendar

## Safety / separation
Keep source labels explicit:
- personal
- lucra

Do not silently merge work and personal contexts into one unlabeled blob.

## Deliverables
- dual-account Gmail/Calendar connection plan
- source-aware briefing logic
- confirmation mining workflow
- event reconciliation workflow
- update/writeback rules for `memory/upcoming-events.md`
- follow-up question policy for unresolved gaps only
