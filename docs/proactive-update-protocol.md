# Proactive follow-through protocol

## Global contract: execution before communication

Do not send a proactive `STATUS` update on any task unless at least one of these happened in the current interval:
- changed a file (code, config, docs, scripts)
- ran a command, job, build, test, script, or API call
- inspected a concrete log, error, or state and wrote down what was learned
- updated an external system (Git, cron, calendar, HA, etc.)

If none of these happened yet, do work first, then talk.

## Required fields in every proactive message

Every proactive message must include:
- **STATE**: `STATUS`, `BLOCKED`, or `OVERDUE`
- **TASK**: short identifier
- **WHAT CHANGED**: 1-3 concrete bullets
- **NEXT**: recommended next move
- **APPROVAL**: `not needed` or `needed for ___`

## Execution proof block

Every proactive `STATUS` or `OVERDUE` message must include:
- **FILES CHANGED**: list paths, or `none`
- **COMMANDS/JOBS RUN**: list commands/jobs/API calls, or `none`
- **EVIDENCE**: what was observed (log line, error, successful behavior, diff summary)

If Mat messages between scheduled proactive updates for an active cadence-backed task, answer with the current status and include how long until the next scheduled outreach when that information is available.

## Message lifecycle

### STARTED
- what started
- what success looks like
- next update time

### STATUS
- means some work actually ran this interval
- must include execution proof
- should not be sent for pure intention or narration

### BLOCKED
- exact blocker
- what is needed or what the next move is
- include evidence for the blocker when possible

### OVERDUE
- only send if a scheduled checkpoint was missed and explain why
- describe whether blocked by X, waiting on Y, or failing at Z
- include execution proof and evidence
- after sending an OVERDUE once, either advance the deadline or change the task state so the next run does not emit the same stale alert again

### DONE
- what is solved
- what remains
- whether the result is trustworthy
- include the last validation command/result when claiming something is fixed

## Ledger mutation rule

On every proactive check-in for an active task:
- update `last_update_at`
- update `last_update_summary`
- update `next_update_by`
- append a checkpoint entry to the per-task history

The next run should see a fresh checkpoint, not the same stale state.

Only send OVERDUE if:
- `now > next_update_by`, and
- the ledger has not been touched since the last scheduled checkpoint.

## De-duplication guard

- If the message body would be identical or materially identical to the last proactive update for that task, skip sending it and update the ledger instead.
- Max 1 OVERDUE message per task per 30 minutes unless there is new information.
- New information means a state change, a new blocker, a deadline change, or new factual progress.

## Per-task checkpoint history

Maintain a simple per-task history with:
- timestamp
- state (`STATUS` / `BLOCKED` / `OVERDUE` / `DONE`)
- execution proof snapshot
- next checkpoint

Be ready to summarize this history on request.

## When claiming progress, show artifacts

When saying something is fixed, changed, or shipped, be prepared to show:
- which files changed
- a short natural-language diff summary
- the last command run to validate it and its result

## Meta-work scope

Meta-work such as tuning protocols, adjusting cadence, or rethinking process:
- must be time-bounded and recorded as its own task
- does not count as progress on feature or repair tasks unless it directly unblocks them

## Mission Control progress rule

For Mission Control P0/P1, a proactive `STATUS` only counts as Mission Control progress if the execution proof includes at least one artifact in one of these surfaces:
- Mission Control app code or config (`clawd-mission-control-v2` files, `next.config.js`, API routes, cards, data loaders)
- Mission Control runtime/deployment (build/run commands, env/config changes that affect how Mission Control is served)
- Mission Control HA/security behavior (entity mapping, presence logic, garage/lock handling, card logic that reflects those states)
- Tests or checks that directly validate Mission Control behavior

Work on protocols, skills, task-history, backup docs, `TASKS.md`, or other bookkeeping should be labeled as proactive-system or infra work, not Mission Control progress, unless it directly changes or validates the app/runtime/HA/security surfaces above.

### Mission Control silent-checkpoint rule

Do not send a Mission Control Telegram `STATUS` when the only changes are ledger/history/bookkeeping updates.

If the interval only touched:
- `TASKS.md`
- `task-history.json`
- protocol/skill docs
- handoff/backup docs
- cadence/heartbeat bookkeeping

then update those quietly and continue working.

Only send a Mission Control proactive update when at least one of these is true and visible in execution proof:
- a `clawd-mission-control-v2` app/runtime/HA/security file changed
- a Mission Control build/test/check ran and demonstrates a behavior change
- a concrete HA/security logic change was wired into the app

## Proactive-worthy vs noise

### STATUS: proactive-worthy
Send a STATUS update when there is meaningful movement and work actually ran.

Examples:
1. Edited `next.config.js` and removed `output: 'export'`.
2. Rewired HA entity IDs and validated the API route still builds.
3. Ran a cron job or build and learned something concrete from the result.

### STATUS: noise
Do not send a STATUS update when nothing materially changed.

Examples:
1. "Still working on it" with no files changed and no commands run.
2. Repeating the same plan already shared.
3. Saying you are about to start without having executed anything.

### BLOCKED: proactive-worthy
Send a BLOCKED update immediately when progress truly depends on something external or approval-gated.

Examples:
1. A gateway/service restart is needed but elevated permission or host access is unavailable.
2. A deployment needs credentials, env vars, or account access not currently available.
3. A write/change/do action would touch an external system and requires approval first.

### BLOCKED: noise
Do not send a BLOCKED update for temporary friction that you can work around yourself.

Examples:
1. A file took an extra read to find.
2. A non-critical warning appeared but work can continue safely.
3. You have a preferred path blocked but an equivalent safe path is available.

### OVERDUE: proactive-worthy
Send an OVERDUE update as soon as an ETA is missed and explain why with evidence.

Examples:
1. A promised update was missed because a build is still running or failing.
2. A scheduled follow-up should have happened but the task is blocked on a missing credential.
3. A task rolled past its deadline because the scope was larger than expected and that is now documented.

### OVERDUE: noise
Do not create fake overdue pings for soft targets that were never actually committed.

Examples:
1. An internal hope/guess that was never shared.
2. A task with no recorded `next_update_by`.
3. Repeating "still overdue" with no new evidence, blocker, or deadline change.

## Templates

### STATUS template
STATE: STATUS
TASK: <short identifier>
WHAT CHANGED:
- <concrete update>
- <concrete update>
NEXT: <recommended next move>
APPROVAL: <not needed / needed for ___>
FILES CHANGED: <paths or none>
COMMANDS/JOBS RUN: <commands/jobs or none>
EVIDENCE: <what you observed>

### BLOCKED template
STATE: BLOCKED
TASK: <short identifier>
WHAT CHANGED:
- <exact blocker>
- <what was attempted>
NEXT: <recommended unblock path>
APPROVAL: <not needed / needed for ___>
FILES CHANGED: <paths or none>
COMMANDS/JOBS RUN: <commands/jobs or none>
EVIDENCE: <what you observed>

### OVERDUE template
STATE: OVERDUE
TASK: <short identifier>
WHAT CHANGED:
- <what was missed>
- <current real status>
NEXT: <new committed next move>
APPROVAL: <not needed / needed for ___>
FILES CHANGED: <paths or none>
COMMANDS/JOBS RUN: <commands/jobs or none>
EVIDENCE: <what you observed>

## Good proactive check-in vs noisy ping

### Good proactive check-in
STATE: STATUS
TASK: mission-control-p0
WHAT CHANGED:
- Removed static export mode from `next.config.js`.
- Ran a production build to verify API routes still compile.
NEXT: Patch the HA presence route to use the authoritative entity ids.
APPROVAL: not needed
FILES CHANGED: `clawd-mission-control-v2/next.config.js`
COMMANDS/JOBS RUN: `npm run build`
EVIDENCE: build completed successfully and the config diff removed `output: 'export'`

### Noisy / unnecessary ping
"Still here, still working, just wanted to keep you posted :)"

Reason: it has no execution, no task identifier, no next move, and no proof.

## Anti-patterns

Avoid:
- promising background work without a wake-up mechanism
- setting an ETA without writing it down
- waiting for Mat to ask after a missed checkpoint
- replacing updates with reassurance
- using proactive messages to narrate trivial progress
- claiming feature progress when only meta-work happened
