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

1. Confirm Arizona return flight details (airline/flight/time/date).
2. Confirm whether 3/14 and 3/18 events are completed and if any additional March events should be added.
3. Confirm current active HA tokens/webhooks post-rotation.

## NYC flight details confirmed (source update)

### Sarah NYC Trip

Outbound — Monday, March 30, 2026
- Flight: United 2127
- Route: LAX → EWR
- Departure: 10:20 AM PT
- Arrival: 6:53 PM ET
- Nonstop

Return — Monday, April 6, 2026
- Flight: United 2679
- Route: EWR → LAX
- Departure: 10:10 AM ET
- Arrival: 1:00 PM PT
- Nonstop

### Mat NYC Trip (from screenshot + user note)

Lodging
- Kimpton Hotel Eventi (user phrased as "Kimpton Aventi").


Outbound — Tue Mar 31 → Wed Apr 1, 2026
- Flight: Delta 915
- Route: LAX → JFK
- Departure: 11:59 PM PT (Tue Mar 31)
- Arrival: 8:30 AM ET (Wed Apr 1)
- Nonstop

Return
- Mat confirmed same return flight as Sarah: United 2679 on Monday, April 6, 2026.

## Arizona bachelor trip details confirmed (partial)

Trip purpose
- Jason Leon ("Leon") bachelor party in Arizona.

Outbound — Thursday, March 26, 2026
- Airline: Southwest
- Flight: 2416
- Route: LAX → PHX
- Departure: 11:15 AM PT
- Arrival: 12:40 PM MT (Arizona)
- Nonstop
- Confirmation code (from screenshot): AJCFXF

Companion notes
- Wes is on same outbound + return flights as Mat.
- David Saunders ("Saunders") is on same outbound flight, different return flight.

Return
- Mat indicated return is on American, but full flight/time details still pending confirmation.

## Recommended next actions

1. Build a normalized March timeline file from confirmed events/flights.
2. Update MEMORY + handoff docs with only validated dates/details.
3. Add a Mission Control "Travel & Events" source card for March reconciliation status.
