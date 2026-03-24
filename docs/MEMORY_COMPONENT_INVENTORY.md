# Memory Component Inventory

## Active / Live

### OpenClaw native semantic memory
- Status: **active**
- Role: live semantic recall backend
- Signals:
  - `openclaw memory status --deep` healthy
  - provider=`ollama`
  - model=`nomic-embed-text:latest`
  - vector store ready

### Core memory content
- `MEMORY.md`
- `memory/YYYY-MM-DD.md`
- `memory/projects/*.md`
- `memory/archive/projects/*.md`
- `shared/sarah-agent/...`

These are the main knowledge sources currently worth preserving and improving.

---

## Active but Secondary / Optional

### Clawd memory skill scaffolding
- Path: `~/.openclaw/skills/clawd-memory/`
- Role: conceptual / workflow guidance for logging, projects, digest, media archive
- Status: useful, but not the primary semantic retrieval engine

### Memory dashboard
- Paths:
  - `memory/dashboard/api-server.cjs`
  - `memory/dashboard/index.html`
- Role: UI/visibility layer
- Status: optional

### Project / archive / digest scripts
- Examples:
  - `memory/scripts/project-tracker.cjs`
  - `memory/scripts/media-archiver.cjs`
  - `memory/scripts/conversation-logger.cjs`
  - `memory/scripts/weekly-digest.cjs`
  - `memory/scripts/proactive-reminders.cjs`
- Role: operational helpers
- Status: optional until intentionally wired into daily workflow

---

## Experimental / Overlapping

### Custom search scripts
- `memory/scripts/memory-search.cjs`
- `memory/scripts/smart-memory-search.cjs`
- `memory/scripts/search.cjs`
- Role: alternate search paths
- Concern: overlap with native `memory_search`
- Recommendation: keep for now, but mark as legacy candidates unless a specific use case remains

### NLP / natural-language memory skills
- `skills/memory-nlp/`
- `skills/simple-memory/`
- Role: alternate interfaces / experiments
- Concern: unclear runtime importance vs native tool path
- Recommendation: audit before keeping active

---

## Likely Legacy / Transitional

### Chroma remnants
- `memory/chroma_db/`
- Role: previous vector backend experiment
- Recommendation: likely archive/remove candidate after dependency check

### JSONL store
- `memory/store/memories.jsonl`
- Role: transitional/local memory backend experiment
- Recommendation: likely archive/remove candidate after dependency check

---

## Open Questions
1. Which custom memory scripts are still called by hooks, skills, or heartbeat flows?
2. Is the dashboard intended to become part of Mission Control or remain standalone?
3. Are JSONL and Chroma remnants still needed for any fallback or migration path?
4. Which memory files should be excluded from semantic indexing, if any?

---

## Recommendation
Treat the system as:
- **native OpenClaw memory backend = production semantic search**
- **custom scripts/dashboard = optional auxiliary tooling**
- **Chroma/JSONL remnants = migration residue until proven otherwise**
