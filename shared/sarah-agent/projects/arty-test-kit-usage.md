# Arty Test Kit Usage

## Files
- `arty-live-test-prompt-manychat-v1.md`
- `arty-grading-rubric-v1.md`

## How to use
1. Copy the live prompt into Arty.
2. Capture Arty's full response.
3. Compare the response against the rubric.
4. Mark automatic FAIL if any fail conditions occur.
5. Otherwise score 0-10.

## Recommended first-pass evaluation priorities
1. No loop
2. No debug chatter
3. Uses real ManyChat context
4. Gives a concrete next step

## If Arty fails
Look at which category failed:
- memory grounding
- recommendation quality
- follow-up discipline
- channel hygiene

Then tighten policy/prompting around that specific weakness.
