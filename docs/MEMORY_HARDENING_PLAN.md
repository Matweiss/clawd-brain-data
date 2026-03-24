# Memory Hardening Plan

_Status: draft / active_

## Goal
Move the memory system from **working** to **reliable, understandable, and maintainable**.

This plan treats the current OpenClaw + Ollama + Tailscale memory search stack as the live semantic backend, while auditing and rationalizing the older/custom memory tooling that still exists in the workspace.

---

## Current Live Architecture

### Semantic recall backend (active)
- **OpenClaw memory provider:** `ollama`
- **Remote embedding endpoint:** `http://100.94.231.120:11434`
- **Embedding model:** `nomic-embed-text:latest`
- **Vector store:** SQLite + `sqlite-vec`
- **Indexed workspaces:**
  - `main` → `/root/.openclaw/workspace`
  - `sarah` → `/root/.openclaw/workspace/shared/sarah-agent`

### Verified healthy signals
- Provider resolves as `ollama`
- Embeddings report `ready`
- Vector store reports `ready`
- Main memory indexed `34/34 files · 126 chunks`
- Sarah memory indexed `2/2 files · 3 chunks`
- In-chat `memory_search` retrieval works

### Operational dependency chain
1. OpenClaw runs on VPS
2. Mac runs Ollama
3. VPS reaches Mac over Tailscale
4. OpenClaw indexes markdown memory into SQLite vector store
5. `memory_search` uses that indexed store for recall

---

## What Is Working Now
- Semantic retrieval is operational
- Basic recall works in chat
- Main and Sarah memory namespaces both index successfully
- The current embeddings path is low-cost and private

---

## What Is Not Yet Finished

### 1) Relevance quality
The first successful recall test worked, but initial top hits included unrelated or weakly related documents before the most relevant personal fact. Backend is healthy; ranking quality still needs tuning.

### 2) Architecture sprawl
There are multiple overlapping memory systems / experiments in the repo:
- OpenClaw native memory indexing (current live semantic backend)
- `memory/scripts/memory-search.cjs`
- `memory/scripts/smart-memory-search.cjs`
- `memory/chroma_db/`
- `memory/store/memories.jsonl`
- `skills/simple-memory/`
- `skills/memory-nlp/`
- `clawd-memory` skill and related dashboard/scripts

This makes it unclear what is authoritative vs experimental vs legacy.

### 3) Runbook gap
There is not yet a single concise operator document covering:
- how memory works now
- what healthy status looks like
- how to reindex
- how to diagnose backend failures
- what files/systems are active versus deprecated

### 4) Validation history
Past failures indicate that some earlier memory problems were not just retrieval-quality issues but tool/config/invocation issues. The backend is now working, but wrapper and ergonomics should still be monitored.

---

## Source-of-Truth Proposal

### Primary sources
- `MEMORY.md` → curated long-term memory
- `memory/YYYY-MM-DD.md` → recent daily continuity
- `memory/projects/*.md` and `memory/archive/projects/*.md` → project continuity
- `shared/sarah-agent/...` → Sarah-specific memory namespace

### Backend source of truth
- OpenClaw native memory index + SQLite vector store

### Secondary / auxiliary tooling
Keep for now, but treat as optional until explicitly adopted:
- dashboard
- smart logger
- calendar integration
- weekly digest scripts
- custom local search scripts

### Likely legacy / experimental items
These should be reviewed for deprecation or archive-only status:
- `memory/chroma_db/`
- `memory/store/memories.jsonl`
- custom search scripts that duplicate native memory search
- any abandoned memory skills not wired into current runtime

---

## Acceptance Test Suite
A memory subsystem is considered hardened only if it passes this suite reliably.

### Personal facts
1. What do you know about Sarah and Theo?
2. What is Mat’s timezone?
3. What are Mat’s active private GitHub repos?

### Career / business facts
4. What do you remember about Lucra?
5. What changed about the CRM setup?
6. What dashboard repo/url is active?

### Infrastructure facts
7. What is the browser coworking architecture?
8. What are the important notes about the Mac node?
9. How is memory search currently configured?

### Project continuity facts
10. What projects were active around March 23?
11. What do you know about the Sarah art assistant work?
12. What did we set up for voice capabilities?

### Expected behavior
- relevant answer returned in one pass
- top results dominated by semantically appropriate sources
- minimal irrelevant hits ahead of clearly relevant files
- citations available when useful
- no cross-contamination between main and Sarah memory

---

## Hardening Workstreams

### Workstream A — Retrieval Quality
- Run the acceptance test suite manually
- Note weak rankings / noisy sources
- Identify whether noise is caused by:
  - poor file naming
n  - broad mixed-topic documents
  - weak metadata / headings
  - too many experimental docs in indexed space
- Improve source clarity before attempting more advanced ranking changes

### Workstream B — Architecture Rationalization
- Inventory every memory-related script, skill, store, and dashboard component
- Mark each as:
  - active
  - optional
  - legacy
  - candidate for archive/removal
- Reduce ambiguity around which system should be used going forward

### Workstream C — Operational Runbook
Document:
- current provider/model/base URL
- how to check memory status
- how to force reindex
- how to validate Ollama endpoint
- how to recognize a healthy memory state
- how to recover from Mac/Tailscale/Ollama outages

### Workstream D — Information Hygiene
- Keep `MEMORY.md` concise and durable
- Keep daily files factual and recent
- Avoid duplicative experimental notes in indexed hot path where possible
- Prefer stable headings and explicit entities in long-lived docs

---

## Immediate Cleanup Candidates
These need review before deletion or archival:
- `memory/chroma_db/` — likely leftover from previous Chroma path
- `memory/store/memories.jsonl` — likely transitional JSONL backend experiment
- `memory/scripts/memory-search.cjs` — duplicates native search concept
- `memory/scripts/smart-memory-search.cjs` — separate search stack with keyword ranking
- `skills/simple-memory/` — unclear active runtime role
- `skills/memory-nlp/` — likely useful only if intentionally adopted

Important: do **not** delete any of these until we label them explicitly and verify no hidden dependency remains.

---

## Definition of Done
Memory hardening is complete when:
1. Semantic memory retrieval remains healthy after restart/reindex
2. Acceptance test suite passes with good relevance
3. Active vs legacy memory components are documented clearly
4. Runbook exists and is trustworthy
5. Source-of-truth locations are obvious to future sessions
6. We can explain the full architecture in under 2 minutes without guessing

---

## Recommended Next Actions
1. Run and score the 12-question acceptance test suite
2. Create a component inventory of all memory-related scripts/skills/stores
3. Label active vs legacy components in writing
4. Write a compact operator runbook (`docs/MEMORY_OPERATIONS.md`)
5. Only after the above: consider source cleanup / archival of legacy paths
