# March Recon Pass — 2026-03-15

Sources reviewed:
- `/root/.openclaw/media/inbound/result---42635483-9237-4c3f-bd3e-c58d1c76d115.json`
- `/tmp/mat_sync/photos/photos/*` (63 images; filenames/timestamps reviewed)
- `/tmp/mat_sync/voice/voice_messages/*` (14 voice notes transcribed)

## New-to-memory (high signal)

1. March travel/event context confirmed in history:
   - Arizona bachelor party trip (Jason Leon)
   - NYC trip context with Sarah
   - Multiple NYC social/professional touchpoints planned

2. March lifestyle/social dated items explicitly referenced:
   - 3/14 evening sushi making class (Mat + Sarah)
   - 3/18 family/finance dinner gathering

3. Pet/home logistics during NYC trip:
   - Diggy and Theo planned to stay with Mat's parents

4. HA naming preference and usage context:
   - Mat will refer to Home Assistant as "HA"

5. Work/life operating preferences (reconfirmed in history):
   - Core work window: ~9–5 PT
   - Priority emphasis: energy/mental health, relationships, focus/time

## Voice-message extraction summary

Key transcribed intents from voice messages:
- Repeated "going to yoga / handle when back"
- Requests to start work while en route to yoga (P5 mentions)
- STT test prompts ("testing can you hear this")
- Prompt to install additional skills
- Prompt asking which API keys are needed
- Request for task/todo functionality in Mission Control

## Potentially stale/risky items discovered

- Historical tokens/keys and webhook values appear in old chat export. Treat as compromised and rotate if still active.
- Prior Kimi setup history includes failed auth loops and older model-routing states that may no longer be current.

## Clarifications needed (to finalize clean handoff)

1. Confirm exact March trip dates for:
   - Arizona bachelor trip (depart/return)
   - NYC trip (depart/return)
2. Confirm final flight details to store as source-of-truth (airline/flight number/times).
3. Confirm whether 3/14 and 3/18 events are completed and if any additional March events should be added.
4. Confirm current active HA tokens/webhooks post-rotation.

## Recommended next actions

1. Build a normalized March timeline file from confirmed events/flights.
2. Update MEMORY + handoff docs with only validated dates/details.
3. Add a Mission Control "Travel & Events" source card for March reconciliation status.
