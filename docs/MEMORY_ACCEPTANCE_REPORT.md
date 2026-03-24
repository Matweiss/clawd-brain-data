# Memory Acceptance Report

_Date: 2026-03-24_
_Status: preliminary manual assessment_

## Summary
The live memory backend is **healthy**, but the retrieval layer is **not yet acceptance-grade** for broad natural-language recall.

### Backend verdict
- Embeddings: healthy
- Vector store: healthy
- Indexing: healthy
- In-chat recall: works

### Retrieval-quality verdict
- Strong enough to return some relevant facts when guided or manually interpreted
- Not yet strong enough to trust top-ranked results consistently for arbitrary natural-language questions
- Acceptance suite currently rates as **backend pass / relevance fail**

---

## What Was Tested
Acceptance questions from `docs/MEMORY_HARDENING_PLAN.md`:
1. What do you know about Sarah and Theo?
2. What is Mat’s timezone?
3. What are Mat’s active private GitHub repos?
4. What do you remember about Lucra?
5. What changed about the CRM setup?
6. What dashboard repo and URL are active?
7. What is the browser coworking architecture?
8. What are the important notes about the Mac node?
9. How is memory search currently configured?
10. What projects were active around March 23?
11. What do you know about the Sarah art assistant work?
12. What did we set up for voice capabilities?

---

## Key Findings

### 1) Backend is working for real
This is no longer a broken embeddings problem.
The system successfully:
- indexes memory files
- stores vectors
- returns semantic search results
- supports in-chat retrieval

### 2) Ranking quality is still weak
Example failure mode observed:
- Query: `What do you remember about Lucra?`
- Top hits included unrelated Sarah memory/project documents and general memory system docs before the clearly relevant Lucra entry in `MEMORY.md`

That means the system is operational but not well-tuned for natural-language recall quality.

### 3) Indexed corpus likely contains too much mixed-purpose material
Current indexed memory includes:
- durable personal memory
- daily notes
- Sarah project docs
- memory build summaries
- integration docs
- dashboard docs
- experimental memory infrastructure notes

This broad corpus likely dilutes ranking quality, especially for personal factual questions.

### 4) Foundry/plugin startup noise makes CLI-based acceptance testing awkward
`openclaw memory search --json` output is mixed with plugin startup logs in the CLI path, which complicates scripted evaluation.
This is not the same as memory recall failure, but it does make automation/reporting noisier.

---

## Preliminary Scoring

### Infrastructure / health
- Provider health: **Pass**
- Embedding availability: **Pass**
- Indexing health: **Pass**
- Namespace separation (main + Sarah): **Pass**

### Retrieval quality
- Personal fact retrieval: **Mixed**
- Career/business retrieval: **Mixed to weak**
- Infrastructure retrieval: **Unknown / not yet cleanly scored**
- Project continuity retrieval: **Likely mixed**
- Top-result precision: **Fail**

### Overall
- **Operational readiness:** yes
- **Acceptance-grade semantic recall:** not yet

---

## Likely Root Causes

### Corpus hygiene issue
Too many memory-adjacent but not memory-core files are being indexed together.

### Document structure issue
Some files may be long, mixed-topic, or weakly structured for retrieval.

### Query-to-document mismatch
Natural-language questions may not match headings/entities strongly enough in current notes.

### Scope pollution
Project/build/integration documents may crowd out durable personal memory in top results.

---

## Recommended Fixes (Priority Order)

### Priority 1 — Improve source hygiene
Review which files truly belong in the semantic memory corpus.
Potential candidates for exclusion, archiving, or de-prioritization:
- memory build summaries
- dashboard/integration docs
- stale experimental memory docs
- migration residue

### Priority 2 — Strengthen high-value memory docs
Improve structure of core sources:
- `MEMORY.md`
- daily notes
- important project notes

Use explicit entity-oriented headings and concise factual sections.

### Priority 3 — Separate durable memory from implementation docs
Consider clearer boundaries between:
- human memory
- system build documentation
- project implementation notes
- experimental tooling notes

### Priority 4 — Create a repeatable scored test harness
Because CLI output is noisy, future evaluation may be better done through:
- direct tool invocation in-session
- or a purpose-built test script hitting a cleaner interface

---

## Conclusion
The memory project has crossed the line from **broken backend** to **working subsystem**, but it has **not yet crossed the line to high-confidence semantic recall**.

That is still a meaningful win:
- the hard infra problem is solved
- what remains is quality tuning and corpus design

In short:
- **backend fixed**
- **retrieval quality still needs hardening**

---

## Recommended Next Step
Perform a **corpus hygiene pass** on the indexed memory sources before deeper ranking work.
That is the highest-leverage move for improving actual recall quality.
