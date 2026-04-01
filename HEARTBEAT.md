# HEARTBEAT.md

# Memory Assist background upkeep (lightweight)

- Every heartbeat cycle (when not urgent/busy hours), run:
  - `node /root/.openclaw/workspace/scripts/memory-assist.cjs digest`
- At meaningful checkpoints (task completed / blocker found / plan changed), run:
  - `node /root/.openclaw/workspace/scripts/memory-checkpoint.cjs --leftoff "<short checkpoint>"`
- If a new strategic workstream starts, also run:
  - `node /root/.openclaw/workspace/scripts/memory-checkpoint.cjs --project "<project name>"`
- Keep entries concise and durable; never store secrets.

# Daily Agent Evolution Audit (once per day, morning)
- Check Agent Evolution project for today's improvement ideas
- Triage any new issues: P1 → build now, P2 → queue, P3 → backlog
- Check Skill Marketplace for new CLAIM comments → assign skill to claimant
- Check Skill Marketplace for new SKILL REQUEST issues → assess and respond
