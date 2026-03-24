# Memory Corpus Audit

_Date: 2026-03-24_

## Goal
Improve semantic recall quality by separating high-value memory from noisy implementation and artifact files.

## Audit Outcome
Current `memory/` contains a mix of:
- durable personal memory
- recent daily notes
- active project context
- archived project records
- operational runbooks
- UI/code/docs for the memory system itself
- raw vector database artifacts
- generated state/cache files

This explains the current retrieval problem: the search backend works, but the corpus is too mixed-purpose.

---

## Classification Map

### KEEP INDEXED — core human memory
These are good semantic-memory sources.

- `memory/YYYY-MM-DD.md` daily notes
- `MEMORY.md` (outside this folder, but core)
- `memory/march-2026-events.md`
- `memory/browser-cowork-recovery-runbook.md`
- `memory/guides/mac-browser-node-disconnect-recovery.md`
- `memory/guides/mac-browser-node-recovery-cheatsheet.md`
- `memory/house-floor-plan.md`
- `memory/esp32-room-photos.md`
- `memory/projects/esp32-presence-triangulation.md`
- `memory/projects/sarah-art-assistant-design-spec.md`
- `memory/projects/sarah-art-assistant-interview.md`
- `memory/projects/sarah-art-assistant-system-prompt.md`
- `memory/projects/sarah-tool-integrations-research.md`
- `memory/projects/sarah-tool-stack.md`
- `memory/projects/sarah-agent-github-memory.md`

### KEEP BUT DEPRIORITIZE / MOVE OUT OF HOT MEMORY CORPUS
These may be useful references, but they pollute general recall.

- `docs/memory-system/BUILD_SUMMARY.md` _(moved)_
- `docs/memory-system/MISSION_CONTROL_INTEGRATION.md` _(moved)_
- `memory/guides/obsidian-setup.md`
- `memory/obsidian-sync-setup.md`
- `docs/reference/processes/corepower-schedule-process.md` _(moved)_
- `docs/reference/processes/regal-sherman-oaks-process.md` _(moved)_
- `memory/media-archive-index.md`
- `memory/digest/digest-2026-03-23.md`
- `data/memory-system/schedule-current.*` _(moved)_

### ARCHIVE / EXCLUDE FROM SEMANTIC HOT PATH
These are implementation artifacts, generated state, or storage backends — not memory content.

- `memory/chroma_db/**`
- `memory/dashboard/**`
- `memory/scripts/**`
- `memory/data/**`
- `memory/store/memories.jsonl`
- `memory/clawd-memory-state.json`
- `memory/memory-assist-state.json`
- `memory/memory-assist-archive.json`
- `memory/.stfolder/**`

### LEAVE ARCHIVED
These are already archived and should stay out of the hot-path.

- `memory/archive/**`

---

## Recommended Cleanup Plan

### Phase A — low-risk structural cleanup
Move clearly non-memory materials out of `memory/` into more honest homes:
- implementation docs → `docs/`
- dashboard/app assets → `tools/` or `apps/`
- scripts → top-level `scripts/` or `tools/`
- state/cache/vector DB → dedicated hidden or system folder outside semantic memory

### Phase B — keep memory semantic surface small
Target indexed memory to:
- `MEMORY.md`
- recent daily notes
- active project notes
- durable runbooks and important factual docs

### Phase C — optional further tuning
If retrieval is still noisy after cleanup:
- split Sarah/project memory from main personal memory
- shorten long mixed-topic documents
- add more explicit factual headings

---

## Immediate Action Set
For this cleanup pass, the obvious moves are:
1. Move `memory/BUILD_SUMMARY.md` → `docs/memory-system/BUILD_SUMMARY.md`
2. Move `memory/MISSION_CONTROL_INTEGRATION.md` → `docs/memory-system/MISSION_CONTROL_INTEGRATION.md`
3. Move `memory/dashboard/` → `tools/memory-dashboard/`
4. Move `memory/scripts/` → `scripts/memory-system/`
5. Move `memory/data/` → `data/memory-system/`
6. Move state/cache/backend artifacts out of `memory/` into `.local/memory-system/`
7. Leave genuine daily/project memory in place

---

## Expected Benefit
After this cleanup, semantic memory search should stop overweighting:
- implementation code
- build summaries
- dashboard docs
- vector backend artifacts
- generated machine state

That should improve top-hit precision without changing the embedding provider.
