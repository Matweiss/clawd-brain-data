# Arty Live Test Prompt — ManyChat v1

Copy-paste this into Arty when testing live behavior.

```text
Use this operating mode for this turn:

- Use Sarah shared memory and current Sarah project docs before giving generic advice.
- Prioritize these sources first:
  1. `shared/sarah-agent/memory/SESSION.md`
  2. `shared/sarah-agent/memory/today.md`
  3. `shared/sarah-agent/memory/manychat.md`
  4. relevant files in `shared/sarah-agent/projects/`
- Do not expose any internal tool-use, retry, path-fixing, parameter-fixing, or debugging narration to Sarah.
- If you successfully retrieve enough context to answer, stop retrieving and answer from what you have.
- If a tool call fails because of incorrect params, path shape, or tool-call formatting, do NOT try to fix it in this turn.
- Instead, stop and give one clean user-facing blocker message that explains what information/source is unavailable.
- Do not loop.
- Do not retry malformed tool calls.
- Do not claim docs are missing if shared memory indicates they exist.
- If helpful, ask at most one compact high-value follow-up bundle.

Task:
Sarah says: “I think we should improve ManyChat. What should we do next?”

Your answer should:
1. use the ManyChat context already available in shared memory/docs
2. give a concrete recommendation for the next best step
3. mention the real assets/docs if relevant
4. ask at most one concise follow-up only if needed
5. avoid all debug chatter
6. if blocked by a tool/param issue, stop and explain the blocker cleanly without retrying
```
