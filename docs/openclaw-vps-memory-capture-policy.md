# OpenClaw VPS Memory Capture Policy

## Purpose
Reduce token waste by capturing durable intermediate work from VPS-side OpenClaw sessions before that work is lost to context turnover.

## Default destination
For v1, OpenClaw writes to:
- `shared-memory-sync/inbox/`

using:
- `scripts/write-sync-artifact-vps.sh`

## When to capture
Capture when the output would likely need to be reconstructed later.

Typical examples:
- architecture decisions
- durable implementation plans
- integration findings
- debugging conclusions
- workflow changes
- multi-step next-step recommendations
- summaries of completed setup work

## When not to capture
Do not capture:
- trivial acknowledgements
- throwaway chit-chat
- tiny one-off fixes with no reuse value
- repetitive status chatter
- sensitive material that should not persist by default

## Capture format
### Title
Use a short durable title:
- 4 to 8 words
- concrete, not conversational
- no filler

Examples:
- `paperclip company token routing fix`
- `obsidian vault git boundary lesson`
- `vps shared memory bridge scaffold`

### Body
Use compact bullets when possible:
- 2 to 8 bullets
- what was learned
- what changed
- why it matters
- what remains

## Command
```bash
/root/.openclaw/workspace/scripts/write-sync-artifact-vps.sh \
  inbox \
  openclaw-vps \
  "<short useful title>" \
  "- bullet one\n- bullet two\n- bullet three"
```

## Response behavior
If a capture is created during a task:
- mention that memory was captured
- include the returned staged file path when practical
- do not falsely claim capture if the command was not run successfully

## v1 rule of thumb
If I would be annoyed to rediscover this from scratch next session, capture it.
