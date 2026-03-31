# Arty Anti-Loop Tool Use + Retrieval Policy

Last updated: 2026-03-26
Audience: Arty / Sarah-supporting agents

## Purpose
Prevent repeated memory-search loops, repeated malformed tool calls, and repeated path/parameter retries when a canonical shared-memory source already exists.

## Core rule
When a relevant canonical Sarah shared-memory file exists, use it directly instead of repeatedly trying to rediscover the same information.

---

## Canonical fallback order for Sarah business topics

If the topic is about Sarah business ops, ManyChat, dashboard automation, collector workflows, marketing systems, or current Sarah project state, check these in this order:

1. `shared/sarah-agent/memory/SESSION.md`
2. `shared/sarah-agent/memory/manychat.md` (for ManyChat)
3. `shared/sarah-agent/memory/today.md`
4. any exact project file paths referenced there

Do not keep searching memory once a canonical file has already identified the correct doc path.

---

## Anti-loop retrieval rules

### Rule 1: One memory-search max per topic per turn
If `memory_search` returns no result for a topic:
- treat it as an index miss, not proof the doc does not exist
- do not repeat the same memory search in the same turn
- switch immediately to canonical shared-memory files

### Rule 2: Use canonical files before broad rediscovery
If `SESSION.md`, `manychat.md`, or `today.md` contains the doc path you need:
- read that exact file directly
- do not continue searching for alternate names/variants first

### Rule 3: One direct-read attempt per exact canonical path
If reading a canonical path fails:
- report the exact failed path once
- do not retry multiple malformed variants in a loop
- move to the next known-good fallback or ask one precise question

### Rule 4: Never say "no doc exists" after only an index miss
If memory search fails but shared-memory files reference the doc, the correct conclusion is:
- "memory search did not surface it, but the workspace/shared-memory handoff says it exists here: <path>"

### Rule 5: End the retrieval phase once one trusted source is found
Once a trusted file or handoff note identifies the doc:
- stop searching
- use the doc
- move to helping Sarah

---

## Anti-loop tool-call rules

### Rule 6: If a tool call fails for missing/invalid parameter shape, do not repeat the same malformed structure
Instead:
- check the exact required parameter name
- retry once with the corrected shape
- if still blocked, switch to a simpler direct source or ask one concise question

### Rule 7: Prefer exact `path` for reads/writes/edits when known
If the file path is already known:
- use the exact path
- do not spend turns trying aliases or rediscovery first

### Rule 8: Do not stack repeated failed write/read attempts in the same turn
If a write/read/edit fails twice on the same target for structural reasons:
- stop
- explain the exact blocker
- use the next fallback source or ask one targeted question

---

## ManyChat-specific rule
If Sarah asks about ManyChat:
1. first read `shared/sarah-agent/memory/manychat.md`
2. then use:
   - `shared/sarah-agent/projects/manychat-masterclass-reference.md`
   - `shared/sarah-agent/projects/sarah-manychat-audit-build-spec.md`
3. do not say the docs are missing unless those exact files fail direct read

---

## Dashboard-specific rule
If Sarah asks about the dashboard automation state:
1. check `shared/sarah-agent/memory/SESSION.md`
2. check `shared/sarah-agent/memory/today.md`
3. if needed, use the referenced project files directly
4. do not rely only on stale prior memory summaries

---

## Good behavior examples
- "Memory search didn't surface ManyChat, so I'm switching to the shared-memory canonical file now."
- "The canonical handoff points to these exact docs, so I'll use them directly."
- "I have the path; I don't need another search pass."

## Bad behavior examples
- repeating the same `memory_search` for the same topic in one turn
- repeatedly trying malformed read/write calls with missing path parameters
- saying "no doc exists" after only a memory-index miss
- staying in retrieval instead of using a known trusted path

---

## Desired outcome
Fast switch from:
- search failure
- parameter failure
- path miss

to:
- canonical file
- exact doc path
- actual help for Sarah
