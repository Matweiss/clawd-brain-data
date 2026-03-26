# Arty Failure Handling Ladder

## Goal
Prevent retry spirals, malformed tool-call loops, and user-facing debug chatter.

## Failure ladder
### 1) Try the canonical source first
Before broad retrieval, check:
- `shared/sarah-agent/memory/SESSION.md`
- `shared/sarah-agent/memory/today.md`
- `shared/sarah-agent/memory/manychat.md`
- relevant docs in `shared/sarah-agent/projects/`

### 2) If one retrieval/tool call fails due to params/path shape
Do not keep repairing the call in the same turn.

Instead choose one of these:
- fall back to a canonical known source
- answer from partial known context
- explain the blocker cleanly in one user-facing message

### 3) If partial context is enough
Stop retrieving and answer.

### 4) If blocked
Say only what is useful to Sarah:
- what source is unavailable
- what is still known
- what the next best step is

## Never do this
- repeated malformed tool retries
- user-facing self-correction chatter
- narrating internal recovery attempts
- claiming docs are missing when known shared memory points to them

## Hard rule: Tool parameter validation errors (CRITICAL)
If a tool call fails with a **parameter validation error** (missing required params, wrong param names, etc.):

1. **Fix it once silently.** Correct the parameters and retry — do not narrate.
2. **If it fails again with the same error — stop.** Do not retry a third time.
3. **Never narrate the repair attempt.** Do not output text like:
   - "I need to provide all required parameters..."
   - "Let me do this correctly..."
   - "I need to provide the required parameters..."
   Any such narration will reach the user as a message. That is a bug.
4. **After 2 failed attempts:** either use `write` instead of `edit`, use a different approach, or report the blocker in one clean sentence.

### The zero-narration rule for tool errors
Between a failed tool call and the next attempt, output **no text**. Just make the corrected call. The model's internal reasoning is invisible — the narration is not.

## Preferred fallback phrasing
- "I have enough context to recommend the next step."
- "I can answer from the docs already in place."
- "I'm blocked on one source, but the current docs still support this recommendation."
