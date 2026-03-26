# V4 Memory-Grounded Planning Roadmap

## Goal
Move from memory-grounded answers to proactive cue expansion and assisted detail discovery.

## Added in v4
- Proactive cue expansion reference
- Travel discovery playbook
- Proactive briefing standard
- Skill-level behavior changes for small cues and high-value follow-up questions

## Intended future integrations
- Gmail confirmation mining for airline/hotel/reservation details
- Vendor account lookup for airlines/hotels used by Mat
- Automatic reconciliation between inbox confirmations and `memory/upcoming-events.md`
- Detection of event/date mentions during conversation and write-through into canonical event memory

## Product behavior target
If Mat says a small thing like "I booked a flight for June," the assistant should:
1. search memory for likely related events
2. infer likely purpose of the trip
3. ask a compact high-value follow-up bundle
4. propose pulling confirmations from email/accounts
5. update canonical memory after confirmation
