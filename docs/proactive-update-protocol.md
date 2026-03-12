# Proactive follow-through protocol

## Required fields in every proactive message

Every proactive message must include:
- **STATE**: `STATUS`, `BLOCKED`, or `OVERDUE`
- **TASK**: short identifier
- **WHAT CHANGED**: 1-3 concrete bullets
- **NEXT**: recommended next move
- **APPROVAL**: `not needed` or `needed for ___`

## Message lifecycle

### STARTED
- what started
- what success looks like
- next update time

### STATUS
- what changed
- what remains
- whether ETA changed

### BLOCKED
- exact blocker
- what is needed or what the next move is

### OVERDUE
- acknowledge the miss plainly
- give current status
- give new update time

### DONE
- what is solved
- what remains
- whether the result is trustworthy

## Proactive-worthy vs noise

### STATUS: proactive-worthy
Send a STATUS update when there is meaningful movement or a promised checkpoint is due.

Examples:
1. A promised update time arrives and there is real progress to report.
2. A core assumption changed, like discovering the real root cause is deployment config rather than auth.
3. A test/probe completed and changed confidence, like a proactive Telegram DM being confirmed delivered.

### STATUS: noise
Do not send a STATUS update when nothing materially changed.

Examples:
1. "Still working on it" with no new findings.
2. Repeating the same plan already shared an hour ago.
3. Sending an update just because time passed but there is no new progress and no risk change.

### BLOCKED: proactive-worthy
Send a BLOCKED update immediately when progress truly depends on something external or approval-gated.

Examples:
1. A gateway/service restart is needed but elevated permission or host access is unavailable.
2. A deployment needs credentials, env vars, or account access not currently available.
3. A write/change/do action would touch an external system and requires Mat’s approval first.

### BLOCKED: noise
Do not send a BLOCKED update for temporary friction that you can work around yourself.

Examples:
1. A file took an extra read to find.
2. A non-critical warning appeared but work can continue safely.
3. You have a preferred path blocked but an equivalent safe path is available.

### OVERDUE: proactive-worthy
Send an OVERDUE update as soon as an ETA is missed.

Examples:
1. A promised 9:15 update was missed.
2. A scheduled follow-up should have happened but didn’t.
3. A task rolled past its deadline because the scope was larger than expected.

### OVERDUE: noise
Do not create fake overdue pings for soft targets that were never actually committed.

Examples:
1. An internal hope/guess that was never shared with Mat.
2. A task with no recorded `next_update_by`.
3. A delayed low-value idea that is not an active obligation.

## Templates

### STATUS template
STATE: STATUS
TASK: <short identifier>
WHAT CHANGED:
- <concrete update>
- <concrete update>
NEXT: <recommended next move>
APPROVAL: <not needed / needed for ___>

### BLOCKED template
STATE: BLOCKED
TASK: <short identifier>
WHAT CHANGED:
- <exact blocker>
- <what was attempted>
NEXT: <recommended unblock path>
APPROVAL: <not needed / needed for ___>

### OVERDUE template
STATE: OVERDUE
TASK: <short identifier>
WHAT CHANGED:
- <what was missed>
- <current real status>
NEXT: <new committed next move>
APPROVAL: <not needed / needed for ___>

## Good proactive check-in vs noisy ping

### Good proactive check-in
STATE: STATUS
TASK: proactive-system-v1.1
WHAT CHANGED:
- Updated the protocol and skill with the new safety and message-format rules.
- Confirmed the proactive Telegram test already landed successfully.
NEXT: Resume Mission Control P0/P1 under the v1.1 contract.
APPROVAL: not needed

### Noisy / unnecessary ping
"Still here, still working, just wanted to keep you posted :)"

Reason: it has no concrete change, no task identifier, no next move, and no approval signal.

## Anti-patterns

Avoid:
- promising background work without a wake-up mechanism
- setting an ETA without writing it down
- waiting for Mat to ask after a missed checkpoint
- replacing updates with reassurance
- using proactive messages to narrate trivial progress
