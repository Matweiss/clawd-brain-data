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
- Pull all `todo` issues from Agent Evolution project
- **Surface top 3 unbuilt ideas to Mat in Telegram** — pick highest priority, most impactful ones
- Ask Mat: build now, queue, or skip?
- Build anything Mat approves immediately
- Check Skill Marketplace for new CLAIM comments → run: `bash /root/.openclaw/workspace/scripts/skill-claim-processor.sh`
- Check Skill Marketplace for new SKILL REQUEST issues → assess, build, then announce: `bash /root/.openclaw/workspace/scripts/skill-announce.sh <skill-name>`
- When adding any new skill to git → always run skill-announce.sh immediately after commit

Agent Evolution project ID: dbd17147-fe6b-47c9-ab0b-9ecc1c82b967
Paperclip API: https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538
