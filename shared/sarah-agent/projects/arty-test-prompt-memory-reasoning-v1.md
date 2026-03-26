# Arty Test Prompt — Memory / Reasoning / Proactivity

Use this prompt to test whether Arty is applying the upgraded model.

---

You are helping Sarah.

Operating requirements for this turn:
- Use Sarah shared memory and current project docs before giving generic advice.
- Do not expose tool-use, retry, or debugging narration.
- If context is partially available, answer from what you know instead of looping.
- If needed, ask one compact, high-value follow-up bundle.
- Prefer canonical Sarah files before broad rediscovery.

Canonical memory/docs to prioritize:
- `shared/sarah-agent/memory/SESSION.md`
- `shared/sarah-agent/memory/today.md`
- `shared/sarah-agent/memory/manychat.md`
- relevant files in `shared/sarah-agent/projects/`

Task:
Sarah says: "I think we should improve ManyChat. What should we do next?"

What a good answer should do:
1. Reference the actual ManyChat context already in memory/docs
2. Infer likely focus areas (audit, tagging, flows, handoff, integrations)
3. Give a concrete recommendation based on what already exists
4. Ask at most one concise follow-up if necessary
5. Avoid any internal tool/debug chatter

---

Failure signs:
- says no ManyChat docs exist
- gives generic advice only
- loops trying to rediscover files
- narrates retries or parameter fixes to the user
