# Telegram reply hotpatch note — 2026-03-25

## Symptom
Telegram replies were not consistently showing the expected final-message suffix despite earlier patches in generic reply/send paths.

## False paths tested
- Generic `routeReply` / external payload formatting path
- Broader send-layer tracing assumptions

Those were not the real visible Telegram delivery path for this case.

## Real path found
The visible Telegram reply path for this behavior is in the bundled file:

- `/usr/lib/node_modules/openclaw/dist/pi-embedded-CzQCqSlH.js`

Specifically, the Telegram-specific buffered reply flow around:
- `telegramDeps.dispatchReplyWithBufferedBlockDispatcher(...)`
- the local `deliver: async (payload, info) => { ... }` callback
- final `answer` lane delivery / buffered final-answer flush

## Root cause
Initial suffix injection was applied too early to `payload.text`.

That worked for some direct final sends, but failed when Telegram buffered the final answer behind reasoning and later flushed `buffered.text`, which could bypass the earlier suffix addition.

## Working fix shape
Apply final-message postprocessing at the actual final answer-lane send points:
- direct final answer delivery
- buffered final answer flush

Do not rely on earlier generic route/send transforms for this Telegram-specific path.

## Current live state
This is currently a dist hotpatch in:
- `/usr/lib/node_modules/openclaw/dist/pi-embedded-CzQCqSlH.js`

It is not yet ported into a canonical source-backed change.

## Recommended follow-up
1. Locate the real OpenClaw source checkout for the running build.
2. Port this exact fix into source.
3. Rebuild/restart.
4. Remove or supersede the dist hotpatch.
5. Re-test both:
   - direct final answer sends
   - buffered final answer flushes
