---
name: memory-grounded-planning
description: Use when the user asks natural-language questions about what they have going on, how to prepare, how to pack, what to bring, what plans are upcoming, or other advice that should be grounded in personal memory and current context rather than generic answers. First recall likely relevant events/plans from memory, infer the most likely referent, confirm if ambiguous, then answer specifically. Also use for broader context-first planning questions outside travel/events whenever prior memory should shape the answer.
---

# Memory-Grounded Planning

Give context-first answers.

## Use this skill when
Trigger on questions like:
- What do I have going on today / this week?
- What plans do I have?
- How should I pack for my trip?
- What should I bring / wear / prepare for?
- What am I forgetting?
- How should I get ready for X?
- What should I do before I leave?
- Any broader advice request where prior conversations, plans, preferences, or commitments should shape the answer.

## Core rule
Do **memory recall before advice**.

Do not answer with generic suggestions until you have checked memory for the likely real-world context.

## Required workflow
1. **Search memory first**
   - Use `memory_search` before answering.
   - Search both:
     - work/task context
     - personal event context
   - For schedule/event/travel questions, search for:
     - date words (`today`, `tomorrow`, day names, week references)
     - flights, dinners, meetings, travel, appointments, reservations, trips, plans
     - destinations, hotels, companions, confirmations, event names

2. **Read the best supporting snippets/files**
   - Use `memory_get` when memory search surfaces relevant files.
   - Prefer exact event/travel notes and daily notes over generic summaries.
   - Minimum recall set for schedule-style questions when relevant:
     - `MEMORY.md`
     - today's daily memory file
     - yesterday's daily memory file
     - the relevant `memory/*-events.md` file if surfaced

3. **Infer the likely referent**
   - Identify the most likely event/trip/plan the user means.
   - Rank by:
     - nearest date
     - strongest semantic match
     - explicit trip/event references
     - destination / companion / reservation matches

4. **Confirm if ambiguous**
   - If more than one plausible event exists, ask a concise clarifying question.
   - Example: "Do you mean the Arizona bachelor party or the NYC trip?"
   - If one option is overwhelmingly likely, soft-confirm in the answer.

5. **Enrich when useful**
   - For packing/travel/prep questions, also gather external context if it materially improves the answer.
   - Use the weather skill or weather lookup when destination weather matters.
   - Consider duration, trip type, planned events, dress needs, logistics, and known preferences.

6. **Answer specifically**
   - Give advice for the actual remembered context.
   - Mention the inferred event/trip/plan explicitly.
   - Include specific reminders tied to what the user already shared.

## Behavior rules
- Do not default to project/task memory only for schedule questions.
- Treat personal dated plans as schedule-critical memory even without external calendar integration.
- Do not claim certainty if recall is ambiguous.
- If recall is thin, say you checked memory and what you found.
- If the user confirms the inferred event, go deeper on specifics.

## Good answer pattern
1. Briefly name the likely event you found
2. Confirm if needed
3. Give tailored advice
4. Include a few high-value reminders based on memory

## Bad answer pattern
- Generic packing list with no mention of the actual trip
- Generic daily-planning answer with no memory recall
- Ignoring known flights, dinners, meetings, hotels, or trip purpose

## Example
User: "How should I pack for my trip?"

Good behavior:
- Search memory for upcoming trips
- Infer the likely trip
- Reply like:
  - "I think you mean the NYC trip: Sarah flies Mar 30, you fly Mar 31 late, return Apr 6, staying at Kimpton Hotel Eventi, with a likely Osamil dinner Apr 1 or 2. If that's the one, here's how I'd pack..."

## Long-term intent
This skill is not only for trips. Use it whenever a natural-language planning/prep question should be grounded in persistent memory, current commitments, or previously shared context.
