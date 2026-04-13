# V1 Operable Status

## What works
- Mac can create draft briefs
- Mac can promote briefs from draft -> review -> approved
- Each transition commits and pushes to GitHub
- VPS poller can pull latest state and claim approved briefs
- Claimed briefs move to executing/<agent>/
- Dispatch hook can complete canary briefs
- Completed briefs move to done/
- Mac can pull final done state successfully

## Current confirmed paths
- Drafts: `shared-memory-sync/briefs/draft/`
- Review: `shared-memory-sync/briefs/review/`
- Approved: `shared-memory-sync/briefs/approved/`
- Executing: `shared-memory-sync/briefs/executing/<agent>/`
- Done: `shared-memory-sync/briefs/done/`

## What is still stubbed
- Dispatch is only proven for canary completion, not real agent execution
- No failure-state automation yet
- No execution result payloads yet
- No automatic promotion from execution output into canonical memory notes yet

## Main weakness
The VPS poller currently assumes a clean git working tree or manual stashing.
This should be hardened before calling the bridge production-ready.

## Next hardening step
Move bridge polling into a dedicated clean worktree or add safe internal stash/pop handling.
