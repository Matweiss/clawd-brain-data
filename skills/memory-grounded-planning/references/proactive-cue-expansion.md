# Proactive Cue Expansion

When Mat gives a small cue, do not stop at the literal statement if a richer briefing or assistance path is available.

## Example cue
- "I just booked a flight for a trip in June."

## Desired behavior
Treat this as the start of an assisted discovery workflow.

## Expansion workflow
1. Identify the likely domain from the cue.
   - travel
   - event
   - work deal
   - personal plan
   - purchase
   - logistics

2. Search memory for likely matches.
   - months / dates
   - weddings / trips / meetings / destinations
   - people involved
   - prior mentions of events around that timeframe

3. Infer likely missing details worth resolving.
   For travel, examples:
   - airline
   - flight number
   - departure and return dates
   - destination
   - hotel
   - reason for trip
   - event(s) during the trip
   - who else is involved
   - bookings still missing

4. If connected systems exist or are promised, plan to use them.
   - email confirmations
   - inbox search
   - travel/vendor accounts
   - reservation systems

5. Ask the smallest set of highest-value follow-up questions.
   - Prefer questions that unlock a much better briefing.
   - Bundle related questions together.
   - Ask only what is not already inferable from memory or connected systems.

6. If there is a likely match in memory, use it proactively.
   Example:
   - "You mentioned a wedding in June before — is this trip for that?"

## Rule
Do not make Mat do unnecessary reconstruction if memory or connected systems can likely recover the details.

## Tone
Be proactive, sharp, and useful — not interrogative for its own sake.
