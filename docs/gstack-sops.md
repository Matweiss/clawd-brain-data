# gstack SOPs — How We Use It

gstack (v1.56.0.0, MIT) is Garry Tan's Claude Code toolkit, installed at `~/.claude/skills/gstack`. It gives an AI coding session structured "specialist" roles you invoke as slash commands. This doc is the standard operating procedure for using it in this workspace.

**Invoke:** inside a Claude Code session, type the skill (e.g. `/review`). From OpenClaw/Clawd, spawn a Claude Code session and tell it "Load gstack. Run /<skill>".
**Scope:** use for real code work in `clawd-dashboard`, `clawd-mission-control-v2`, `scripts/`, or any repo. Skip it for typos/one-liners.
**Guardrail:** gstack does not override this workspace's Safety rules — customer-facing, infra, credential, or financial actions stay approval-gated.

---

## The golden path (new feature, end-to-end)
```
/office-hours   → interrogate the idea, sharpen scope before any code
/autoplan       → CEO + design + eng + DX review in one pass; produces a plan
(implement)     → build to the plan
/review         → pre-merge bug hunt (finds what passes CI but breaks in prod)
/qa <url>       → open a real browser, find + fix UX/functional bugs, re-verify
/cso            → OWASP Top 10 + STRIDE security audit (if it touches auth/data/payments)
/ship           → run tests, review, push, open the PR
/land-and-deploy→ merge, wait for CI + deploy, verify prod health
```
Stop at any stage. For a small change, `/review → /ship` is enough.

---

## SOP 1 — Plan before building (high-stakes or fuzzy work)
1. `/office-hours` — describe what you're building; it asks the forcing questions.
2. `/autoplan` — runs CEO review (find the 10-star version), design review, eng review (architecture/edge cases/tests), DX review. **Save the plan, don't implement yet.**
3. Review the plan with Mat if it's a real feature, then implement.
Use when: new product/feature, anything architectural, or when the ask is vague.

## SOP 2 — Build a feature end-to-end
1. `/autoplan` → implement the plan → `/ship`.
2. If it's UI, add `/qa <staging-url>` before `/ship`.
Use when: scoped feature with a clear goal.

## SOP 3 — Review before merge (do this on every branch)
1. `/review` — pre-landing PR review; surfaces production bugs CI won't catch.
2. Optional second opinion: `/codex` (OpenAI Codex review/challenge).
Use when: any branch with changes, before merging.

## SOP 4 — QA a live site
1. `/qa <url>` — opens a real Chromium browser, finds bugs, fixes them, re-verifies.
2. `/qa-only <url>` — same methodology, **report only, no code changes** (use for prod or others' code).
Use when: validating a deploy or a UI change.

## SOP 5 — Security audit
1. `/cso` — OWASP Top 10 + STRIDE audit.
Use when: anything touching auth, user data, payments, webhooks, or before a public launch (e.g. the open-tracker, dashboard, mission-control APIs).

## SOP 6 — Debug a production issue
1. `/investigate` — systematic root-cause; **no fixes until the cause is found.**
2. Then implement the fix → `/review` → `/ship`.
Use when: a bug or incident where you don't yet know the cause.

## SOP 7 — Ship & deploy
1. `/ship` — tests, review, push, open PR (workspace-aware version queue).
2. `/land-and-deploy` — merge, wait for CI + deploy, verify prod health.
3. `/canary` — post-deploy monitoring loop.
4. `/document-release` — update docs to match what shipped.
Use when: ready to release.

## SOP 8 — Design work
- `/design-consultation` — build a design system from scratch.
- `/design-shotgun` — generate multiple design variants + comparison board.
- `/design-review` — live-site visual audit + atomic-commit fix loop.
- `/design-html` — production-quality HTML/CSS.
Use when: new UI, or polishing an existing surface (pairs well with the `impeccable` skill).

## SOP 9 — Safety rails (when doing risky work)
- `/careful` — warn before destructive commands (rm -rf, DROP TABLE, force-push).
- `/freeze <dir>` — hard-lock edits to one directory.
- `/guard` — careful + freeze together. `/unfreeze` removes it.
Use when: working near production data, migrations, or a directory that must not change.

---

## Full skill reference
**Planning:** /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /plan-devex-review, /autoplan, /spec, /design-consultation
**Build & review:** /review, /codex, /investigate, /design-review, /design-shotgun, /design-html, /devex-review, /qa, /qa-only, /scrape, /skillify
**Ship & docs:** /ship, /land-and-deploy, /canary, /landing-report, /document-release, /document-generate, /setup-deploy, /gstack-upgrade
**Memory & quality:** /context-save, /context-restore, /learn, /retro, /health, /benchmark, /benchmark-models, /cso, /setup-gbrain, /sync-gbrain
**Browser:** /browse, /open-gstack-browser, /setup-browser-cookies, /pair-agent
**iOS:** /ios-qa, /ios-fix, /ios-design-review, /ios-clean, /ios-sync
**Safety/utility:** /careful, /freeze, /guard, /unfreeze, /make-pdf

## Notes
- `/browse` is the only browser tool to use in gstack sessions (real Chromium, ~100ms/command). Don't use `mcp__claude-in-chrome__*`.
- Web data: `/scrape` prototypes a pull; `/skillify` codifies it into a fast (~200ms) reusable browser-skill.
- Update: `/gstack-upgrade`. Optional cross-machine memory: `/setup-gbrain`.
- gstack does NOT relax this workspace's approval gates — external/customer-facing/infra/credential/financial actions still require Mat's sign-off.
