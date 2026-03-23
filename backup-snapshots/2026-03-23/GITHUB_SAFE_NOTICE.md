# GitHub-Safe Snapshot Notice

This repository contains only the GitHub-safe portion of the 2026-03-23 recovery work.

The original restore-grade snapshot included secrets and runtime state, which were intentionally excluded from the GitHub version.

Included here:
- handoff bootstrap instructions
- restore summary/readme
- manifest reference
- memory note about the backup event

Excluded from GitHub:
- openclaw runtime state
- credentials/tokens
- Telegram/account/device identity state
- local secret config
- copied project snapshots
- dirty-worktree state capture

Use a private local or encrypted backup source for the real restore material.
