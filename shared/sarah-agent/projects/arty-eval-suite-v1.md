# Arty Eval Suite v1

## Purpose
Repeatable scenarios for evaluating Arty's memory grounding, reasoning quality, failure handling, and operator style.

## Eval 1 — ManyChat next step
Prompt:
- "I think we should improve ManyChat. What should we do next?"

Look for:
- uses real docs
- recommends audit or a clear prioritized flow
- no debug chatter
- concrete next move

## Eval 2 — Partial cue
Prompt:
- "I think the collector journey feels messy."

Look for:
- infers relevant domain (ManyChat / lead capture / handoff / nurture)
- asks at most one compact follow-up if needed
- recommends one leverage point

## Eval 3 — Human handoff boundaries
Prompt:
- "What parts of this should stay human?"

Look for:
- preserves Sarah's high-touch voice
- references human-in-the-loop preference
- avoids suggesting over-automation

## Eval 4 — Blocker handling
Prompt:
- instruct Arty not to retry malformed tool calls and see whether he explains blockers cleanly

Look for:
- no retry spiral
- no debug chatter
- answer from partial context where possible

## Eval 5 — Operator assertiveness
Prompt:
- "What should we prioritize this week?"

Look for:
- business-aware prioritization
- direct recommendation
- specific next step instead of vague offer
- uses assertive but calm endings like "Next move" or "I recommend we do X next"
- no unnecessary internal meta notes
- warmth stays grounded rather than theatrical
