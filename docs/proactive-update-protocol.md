# Proactive Update Protocol

## Why this exists

Mat should not have to "watch the tank" to know whether work is actually happening.

This protocol exists to prevent three failure modes:
- promising background work that was never durably started
- missing an ETA and going silent
- doing work without proactive status reach-outs

## Required lifecycle for non-trivial tasks

For tasks expected to take more than 10 minutes:

1. **STARTED**
   - confirm work has begun
   - include next update time
   - include success criteria

2. **STATUS**
   - send by the promised checkpoint even if incomplete
   - state what changed, what remains, and revised ETA if needed

3. **BLOCKED**
   - send immediately when a blocker appears
   - include exact blocker and next step

4. **OVERDUE**
   - if an ETA is missed, send an overdue update without waiting to be asked

5. **DONE**
   - describe what is solved, what remains, and whether the result is trustworthy

## Unattended work rule

A task only counts as unattended/background work if at least one of these is true:
- it is actively running in a persistent worker/session
- it is scheduled for heartbeat follow-up
- it is recorded in a task ledger with a next update time

Otherwise, do not represent it as in progress.

## Task ledger

Maintain `/data/.openclaw/workspace/TASKS.md` with:
- owner
- status
- started time
- next update deadline
- success criteria
- notes

## Relationship/context loops

Proactivity is not just project execution. Also maintain useful recurring prompts, especially when they improve future support.

Examples:
- yoga attendance and class details
- sleep / energy check-ins
- upcoming calendar pressure
- other recurring habits where lightweight data creates future insight
