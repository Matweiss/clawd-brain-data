# Mission Control Products

## Product split

The dashboard is now split into two distinct product surfaces inside `clawd-mission-control-v2`.

### 1. Mat Mission Control
Routes:
- `/`
- `/mat`

Purpose:
- operator dashboard for Mat
- Lucra workflow
- calendar, email, pipeline, commission, ROI
- agent operations
- home and logistics context

Implementation:
- main experience lives in `src/pages/mat.tsx`
- `src/pages/index.tsx` is now a thin entrypoint that renders Mat Mission Control

### 2. Sarah Dashboard
Route:
- `/sarah`

Purpose:
- Sarah art business workspace
- collector relationships
- launch workflow
- inbox review and approval-safe communication support

Implementation:
- dedicated page at `src/pages/sarah.tsx`
- intentionally separate page composition and branding from Mat's dashboard

## Architecture approach

Shared cards and hooks are still reused where helpful, but the products now diverge at the page level.

This gives us:
- separate branding
- separate layouts
- separate product direction
- less cognitive overload
- cleaner path to separate deploys later

## Recommended next iteration

1. extract shared app shell components explicitly
2. give Sarah product-specific nav, typography, and color decisions
3. wire Sarah-specific APIs / task sources / approvals
4. optionally deploy as separate domains or apps
