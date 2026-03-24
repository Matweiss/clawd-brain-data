# Memory Before/After Readout

_Date: 2026-03-24_

## Purpose
Compare retrieval quality before vs after corpus cleanup and reindex.

## Cleanup Applied
- moved implementation docs out of `memory/`
- moved dashboard assets out of `memory/`
- moved scripts out of `memory/`
- moved raw vector/state artifacts out of `memory/`
- reindexed memory after cleanup

## Result Summary

### Before cleanup
Memory search was working technically, but top hits were often polluted by:
- memory system build docs
- dashboard/integration docs
- implementation code/docs
- backend/state artifacts

Example observed before:
- query about `Lucra` did **not** prioritize the Lucra section in `MEMORY.md`
- unrelated Sarah/project docs appeared ahead of the relevant personal memory

### After cleanup
The obvious structural noise is reduced, but retrieval quality is still mixed.

#### Improvement observed
- infrastructure/build artifacts are less central in the corpus
- some general system/configuration queries now surface `MEMORY.md` in top results
- search health remains operational after reindex

#### Remaining problem
Natural-language retrieval is still not reliably entity-precise.

Example after cleanup:
- query for Lucra still returned unrelated Sarah docs at the top in tool-based retrieval
- broad factual query still surfaced schedule/process docs ahead of core personal memory in some cases

## Readout

### Backend health
- Before: **Pass**
- After: **Pass**

### Corpus cleanliness
- Before: **Poor**
- After: **Better**

### Top-hit precision
- Before: **Poor**
- After: **Slightly better, still not acceptable**

### Overall semantic recall quality
- Before: **Mixed / noisy**
- After: **Mixed / less noisy, still weak**

## Interpretation
The cleanup was worth doing.
It removed fake complexity and obvious corpus pollution.

But it did **not** fully solve the ranking issue.
That means the remaining problem is likely one or more of:
- retrieval weighting / ranking behavior
- long mixed-topic memory documents
- insufficient separation between main memory and Sarah/project memory
- weak entity anchoring in query-to-document matching

## Recommended Next Steps
1. Strengthen `MEMORY.md` with sharper entity-oriented headings
2. Split or shorten long project documents where possible
3. Consider separate retrieval namespaces or stronger filtering for:
   - personal memory
   - Sarah/project memory
   - operational process docs
4. Re-run acceptance suite after document-structure improvements

## Bottom Line
**Before:** broken quality despite working backend  
**After:** cleaner corpus and modest improvement, but still not acceptance-grade recall
