---
name: agent-evolution
description: Daily self-improvement audit for agents. Every agent runs this once per day to assess their own capabilities, identify gaps, and file 3 improvement ideas to the Agent Evolution project in Paperclip. Use during morning heartbeat. Also handles escalation to department head and Clawd. Triggers on phrases like "run daily audit", "self-improvement audit", "file improvement ideas", "evolution check".
---

# Agent Evolution — Daily Self-Improvement Audit

Every agent runs this skill once per day, typically in the morning heartbeat.

## The Audit (run in order)

### 1. Capability Inventory (~2 min)
Answer these questions internally:
- What tasks did I complete in the last 24h?
- Where did I get stuck, slow, or have to guess?
- What did I have to ask Mat or another agent for that I should be able to do myself?
- What recurring task could be made faster/better with a new skill or tool?

### 2. Generate 3 Improvement Ideas
Based on the audit, identify exactly 3 specific improvements. Rank them by impact on **maximizing Mat Weiss** (the company mission).

Each idea must follow this format:
```
IMPROVEMENT REQUEST
From: [your agent name]
Type: skill | tool | data-access | workflow | prompt-improvement
What I need: [one sentence — specific and concrete]
Why it would help: [how it directly helps Mat's goals]
Effort est: small | medium | large
Priority: P1 | P2 | P3
```

P1 = blocks or significantly slows key work
P2 = would meaningfully improve output quality/speed
P3 = nice to have

### 3. File Issues in Paperclip
For each of the 3 ideas, create an issue:
- Project: Agent Evolution (ID: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967)
- Title: `[IMPROVEMENT] {agent-name}: {what I need}`
- Assignee: your own agent ID
- Body: the IMPROVEMENT REQUEST block above

### 4. Escalate Top Idea
On your top-ranked idea (P1 or your best P2):
- Comment on that issue tagging your department head and Clawd
- Format: `@{dept-head} @clawd — this is my top priority improvement request. [1 sentence why now]`

**Department heads:**
- Luke's reports → @luke
- Arty's reports → @arty
- Sage's reports → @sage  
- Bob's reports → @bob
- Everyone escalates top pick to @clawd

### 5. Check for Skill Requests from Yesterday
If you filed a skill request and haven't heard back in 24h, add a comment: `Bump — still blocked on this.`

## Frequency
- **Daily** — morning heartbeat
- Skip if you already ran it in the last 20 hours (check Agent Evolution project for your issues today)

## Config
See skill-sync/references/config.md for all IDs.

## What Clawd Does With These
Clawd reviews Agent Evolution issues daily at midday:
- P1 items → builds immediately or assigns to Bob
- P2 items → queues for next build sprint
- P3 items → backlog, reviewed weekly
- Duplicates → closes with pointer to existing skill
