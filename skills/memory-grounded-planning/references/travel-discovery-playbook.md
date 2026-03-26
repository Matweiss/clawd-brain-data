# Travel Discovery Playbook

Use this when the user mentions a flight, trip, hotel, travel dates, or a future journey with incomplete details.

## Trigger examples
- I booked a flight
- I think I'm traveling in June
- I need to plan this trip
- Did I book the hotel yet?
- What do I still need for this trip?

## Workflow
1. Search memory for likely travel/event matches.
2. Check canonical event memory (`memory/upcoming-events.md`).
3. Look for related event context:
   - weddings
   - dinners
   - meetings
   - family/social events
   - prior destination mentions
4. Infer a likely trip hypothesis.
5. Ask a compact high-value follow-up bundle.

## High-value follow-up bundle
For a partially-known trip, aim to resolve:
- destination
- dates
- reason/purpose
- flight details
- hotel/lodging status
- major events during the trip
- missing bookings or decisions

## Example follow-up
"Got it. I can help turn that into a full trip brief. I’m going to treat this as a June travel cue.

A few fast confirmations so I can complete it:
- where are you going?
- is this for the wedding we talked about, or something else?
- did you only book the flight, or also hotel?
- is there a return booked yet?

Once email is connected, I should also pull airline/hotel confirmations directly instead of making you reconstruct them."

## Connected-system enrichment
If email or account access is available, prefer:
- search inbox for airline/hotel confirmations
- infer booking details from confirmations
- reconcile details against memory
- ask only unresolved questions
