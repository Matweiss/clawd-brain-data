# Memory Acceptance Status

_Date: 2026-03-24_

## Goal
Get memory retrieval to an acceptable place before moving attention to Foundry.

## What was changed in this pass
- Added focused anchor docs:
  - `memory/facts-career-core.md`
  - `memory/facts-infra-core.md`
  - `memory/facts-pets-home.md`
- Kept Sarah memory separate from Mat core memory
- Prioritized Theo and Diggy for pet recall
- Moved noisy process docs out of hot memory corpus:
  - `memory/corepower-schedule-process.md` → `docs/reference/processes/corepower-schedule-process.md`
  - `memory/regal-sherman-oaks-process.md` → `docs/reference/processes/regal-sherman-oaks-process.md`
- Reindexed memory

## Acceptance Spot Checks

### 1) Career recall
Query: `Lucra Founding Account Executive start date compensation equity`

Result:
- Top hit: `memory/facts-career-core.md`

Verdict:
- **Pass**

### 2) Pet recall
Query: `Theo Diggy pets home feed action`

Result:
- Top hit: `memory/facts-pets-home.md`
- Second hit: `memory/facts-mat-core.md`

Verdict:
- **Pass**

### 3) Broad infra recall
Query: `GitHub repos CRM dashboard voice browser coworking timezone`

Result:
- `MEMORY.md` appears at top
- remaining top results still include some daily-note operational docs

Verdict:
- **Good enough / not perfect**

## Final Assessment
Memory retrieval is now in an **acceptable working state** for moving on.

It is not perfect, but the most important failures were corrected:
- Lucra recall is anchored
- Theo/Diggy recall is anchored
- Sarah context is separated
- noisy process docs no longer dominate the hot corpus as badly

## Remaining Known Imperfections
- broad mixed-topic queries can still surface daily-note operational context
- retrieval is still better for focused entity queries than broad umbrella queries

## Recommendation
Proceed to Foundry work.
Use the new focused anchor docs as the current stable base.
