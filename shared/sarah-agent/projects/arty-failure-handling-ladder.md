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

## Preferred fallback phrasing
- "I have enough context to recommend the next step."
- "I can answer from the docs already in place."
- "I’m blocked on one source, but the current docs still support this recommendation."
