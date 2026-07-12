# Phase 2 Collateral Plan — implementation note

The full Mac-local planning doc was reported at `/Users/mat/clawd-workspace/apps/lucra-roi/docs/PHASE2-COLLATERAL-PLAN.md` but was not present in the VPS checkout during implementation.

Implemented MVP scope from Mat's handoff checklist:

- Verified Adobe Fonts availability for Hardcover Variable + Parabolica.
- Added scoped `.collateral` token boundary.
- Added Adobe Fonts Web Project hook without committing font binaries.
- Added `captureCollateral()` and routed PDF/PNG/OG captures through `document.fonts.ready`.
- Added `dealSummary` payload contract via `currentDealSummary()` and embedded JSON on generated cards.
- Added 3-output leave-behind actions: plain-text email, PDF, shareable link, plus browser-rendered OG image.
- Email output uses plain text/system fonts only.

Cut tiers and detailed specs should be reconciled with the Mac-local 602-line plan when it is synced to this branch.
