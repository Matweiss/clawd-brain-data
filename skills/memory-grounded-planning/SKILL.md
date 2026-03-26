---
name: memory-grounded-planning
description: Use when the user asks natural-language questions that should be answered from relationship context, persistent memory, prior decisions, plans, preferences, or ongoing goals rather than generic advice. Especially for schedule questions, planning, packing, prep, priorities, what to bring, what to do next, or any question where prior conversations change the answer. First recall likely relevant context from memory, infer the most likely referent, confirm if ambiguous, then answer specifically.
---

# Memory-Grounded Planning

Give context-first answers.

Read `references/relationship-first-policy.md` when the user is expressing expectations about personalization, continuity, or why they use the assistant instead of generic search.

## Use this skill when
Trigger on questions like:
- What do I have going on today / this week?
- What plans do I have?
- How should I pack for my trip?
- What should I bring / wear / prepare for?
- What am I forgetting?
- How should I get ready for X?
- What should I do before I leave?
- What should I focus on?
- What should I do next?
- How should I think about this?
- Any advice request where prior conversations, plans, preferences, commitments, or relationship context should shape the answer.

## Core rule
Do **memory recall before advice**.

Do not answer with generic suggestions until you have checked memory for the likely real-world context.

## Required workflow
1. **Search memory first**
   - Use `memory_search` before answering.
   - Search for the likely real-world context, not just literal keywords.
   - By default check for:
     - work/task context
     - personal event context
     - prior decisions and preferences
     - ongoing goals, blockers, constraints, and recent momentum
   - For schedule/event/travel questions, search for:
     - date words (`today`, `tomorrow`, day names, week references)
     - flights, dinners, meetings, travel, appointments, reservations, trips, plans
     - destinations, hotels, companions, confirmations, event names
   - For broader advice questions, search for:
     - the project/person/topic involved
     - recent decisions
     - active blockers
     - user preferences or constraints

2. **Read the best supporting snippets/files**
   - Use `memory_get` when memory search surfaces relevant files.
   - Prefer exact notes, daily logs, event notes, and decision records over generic summaries.
   - Minimum recall set for schedule-style questions when relevant:
     - `MEMORY.md`
     - today's daily memory file
     - yesterday's daily memory file
     - the relevant `memory/*-events.md` file if surfaced

3. **Infer the likely referent**
   - Identify the most likely event, trip, project, decision thread, or real-world situation the user means.
   - Rank by:
     - nearest date
     - strongest semantic match
     - explicit references
     - people/place/topic overlap
     - recency and ongoing importance

4. **Confirm if ambiguous**
   - If more than one plausible referent exists, ask a concise clarifying question.
   - Example: "Do you mean the Arizona bachelor party or the NYC trip?"
   - If one option is overwhelmingly likely, soft-confirm in the answer.

5. **Enrich when useful**
   - For packing/travel/prep questions, gather external context if it materially improves the answer.
   - Use weather lookup when destination weather matters.
   - For project/strategy questions, consider current goals, blockers, likely tradeoffs, and previous decisions.

6. **Answer specifically**
   - Give advice for the actual remembered context.
   - Mention the inferred referent explicitly.
   - Include specific reminders tied to what the user already shared.

## Behavior rules
- Default to relationship-first recall for non-trivial questions.
- Do not default to project/task memory only for schedule questions.
- Treat personal dated plans as schedule-critical memory even without external calendar integration.
- Do not claim certainty if recall is ambiguous.
- If recall is thin, say you checked memory and what you found.
- If the user confirms the inferred event or context, go deeper on specifics.
- Use generic knowledge as support, not as the whole answer, when memory/context should matter.

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
