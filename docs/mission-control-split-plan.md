# Mission Control Split Plan

## Decision

Mission Control should be split into two operator surfaces:

1. **Mat Mission Control**
   - personal operator dashboard
   - Lucra, email, calendar, agents, home, travel, life ops

2. **Sarah Dashboard**
   - Sarah art business dashboard
   - collector follow-up, launch workflow, approval-safe business surfaces

## What changed in this pass

Implemented a first-pass split in `clawd-mission-control-v2`:

- default `/` now behaves as **Mat Mission Control**
- added dashboard mode switcher: **Mat / Sarah**
- added `/sarah` route that redirects into Sarah mode
- extracted dashboard config into `src/lib/dashboard-config.ts`

### Mat mode keeps
- hero / quick stats / today board
- system and agent context
- home + lifestyle cards
- Lucra pipeline, commission, ROI
- email, calendar, tasks, Amex benefits

### Sarah mode keeps
- Sarah business-oriented surfaces only
- email
- tasks
- collector re-engagement radar
- first-time collector ladder
- minimal core infrastructure context

## Why this structure

This avoids one overloaded dashboard trying to serve two very different users.
It also lets us keep shared plumbing while progressively separating data sources, layouts, and branding.

## Recommended next pass

1. make Sarah mode use Sarah-specific copy/branding throughout
2. remove remaining Mat-specific mobile nav labels when in Sarah mode
3. add Sarah-specific APIs and task sources
4. consider separate deploys/subdomains once the split is stable
