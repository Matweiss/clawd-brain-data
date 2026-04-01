---
name: paperclip-healthwatch
description: Runs every 10 minutes to check Paperclip service health and agent statuses. Auto-heals agents stuck in error state. Restarts Paperclip if it's down. Only alerts Mat if something was fixed or if Paperclip is unreachable. Cron job — isolated session, Haiku model.
cron: "*/10 * * * *"
sessionMode: isolated
model: anthropic/claude-3-haiku
reply_token_limit: 100
---

# Paperclip Healthwatch

Runs every 10 minutes. Lightweight — script does all the work, you just run it and report.

## On every wakeup

1. Run the check script:
   ```bash
   bash /root/.openclaw/workspace/skills/paperclip-healthwatch/scripts/check-agents.sh
   ```

2. Parse the output:
   - `OK: ...` → reply HEARTBEAT_OK (no notification needed)
   - `HEALED: ...` → notify Mat on Telegram: "🔧 Auto-fixed: {agent names} were in error state — restored to active."
   - `PAPERCLIP_DOWN` → notify Mat: "⚠️ Paperclip was down — restarted. Check {url} to confirm."
   - Script fails entirely → notify Mat: "⚠️ Paperclip healthwatch failed — manual check needed."

## Keep it tight
- Max 1 Telegram message per run (only when something changed)
- Don't notify on OK — Mat doesn't need routine pings
- Don't run any other tools beyond the script and messaging
