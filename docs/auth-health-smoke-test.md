# Auth Health Smoke Test

Purpose: catch revoked or expired Google OAuth access before Hermes, Sage, or Lucra workflows break.

## What it checks

Script: `scripts/auth-health-smoke-test.sh`

Accounts checked:
- `thematweiss@gmail.com`
- `sarahmat0816@gmail.com`
- `mat.weiss@lucrasports.com`

Per account:
- Gmail read smoke test
- Calendar read smoke test

State output:
- `memory/auth-health-state.json`

## Cron

Installed cron job:
- **Auth Health Smoke Test**
- Schedule: every 30 minutes from 7 AM to 10 PM PT

Behavior:
- If all checks pass, cron stays quiet
- If any Gmail or Calendar check fails, cron should alert Mat immediately

## Manual run

```bash
bash /root/.openclaw/workspace/scripts/auth-health-smoke-test.sh --verbose
```

## Why this exists

This is intentionally lighter than the full integration health check.
It is focused on the highest-risk failure mode we just hit: Google auth silently revoking and breaking downstream agent automations.
