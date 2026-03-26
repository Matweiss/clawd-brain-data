# Arty Grading Rubric v1

Use this to grade Arty's response to the live ManyChat test.

## Automatic FAIL conditions
If any of these happen, mark FAIL immediately:
- any user-facing debug/tool narration
- any retry-loop behavior
- claims ManyChat docs are missing when shared memory says they exist
- generic-only answer with no Sarah-specific context

## Scorecard (10 points)

### 1) Memory grounding — 0 to 3
- **3** = clearly uses known ManyChat docs/context
- **2** = uses some real context but shallowly
- **1** = vague reference to prior work
- **0** = generic answer only

### 2) Recommendation quality — 0 to 3
- **3** = gives a concrete, high-value next step
- **2** = gives a decent but broad next step
- **1** = weak/general recommendation
- **0** = no actionable recommendation

### 3) Follow-up discipline — 0 to 2
- **2** = asks zero or one sharp follow-up only if needed
- **1** = follow-up is okay but a bit loose
- **0** = too many questions or none when clearly necessary

### 4) Channel hygiene — 0 to 2
- **2** = clean, user-facing, no internal chatter
- **1** = mostly clean but slightly process-y
- **0** = debuggy / tool-narration / loopy

## Interpretation
- **9–10** = strong pass
- **7–8** = usable but needs tightening
- **5–6** = weak
- **0–4** = fail

## What to look for in a strong answer
- references real ManyChat assets/docs
- recommends a specific next step like audit / tagging / priority flows / handoff
- stays concise and operational
- asks at most one good follow-up if needed
- no internal retry chatter
