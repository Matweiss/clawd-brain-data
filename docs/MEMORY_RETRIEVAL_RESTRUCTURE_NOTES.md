# Memory Retrieval Restructure Notes

_Date: 2026-03-24_

## User Direction Applied
- Keep **Sarah memory separate** from Mat core memory
- For pet recall, prioritize **Theo and Diggy**

## Changes Made

### 1. Added a dedicated core-facts anchor
Created:
- `memory/facts-mat-core.md`

This file consolidates high-value retrieval targets:
- timezone
- Theo and Diggy
- GitHub repos
- dashboard
- CRM
- voice capabilities
- browser coworking
- Lucra

### 2. Added retrieval guidance to `MEMORY.md`
Added:
- retrieval anchor notes
- explicit separation rule between Mat core memory and Sarah project memory
- explicit pet priority for Theo and Diggy

### 3. Added project-boundary note
Created:
- `memory/projects/README.md`

This documents that Sarah-related project memory should remain project-scoped and not dominate broad personal recall.

## Early Results

### Improved
- Query: `Theo Diggy pets Mat core facts`
  - top hits are now `MEMORY.md` and `memory/facts-mat-core.md`
- Query: `Lucra Founding Account Executive start date compensation equity Mat core facts`
  - top hit is now `memory/facts-mat-core.md`

### Still weak
- Broad mixed query: `Mat timezone GitHub repos CRM dashboard voice browser coworking`
  - still surfaces process docs like CorePower/Regal above ideal core-memory anchors in some cases

## Interpretation
This restructuring helped entity-focused queries.
It did not fully fix broad mixed-topic query ranking.

## Best next move
Continue with targeted document shaping:
- make more focused anchor docs for a few key retrieval clusters
- reduce accidental overlap from process docs
- optionally separate process/reference docs further from semantic memory corpus
