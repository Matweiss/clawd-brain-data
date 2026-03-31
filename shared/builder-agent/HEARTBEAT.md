# HEARTBEAT.md - Bob (Builder)

On each heartbeat:
1. Check if any cron jobs have been failing (look at logs in memory/)
2. Check Mission Control deploy status — is production healthy?
3. If any integration was flagged broken in the last 24h, attempt auto-fix or escalate
4. If nothing needs attention, reply HEARTBEAT_OK

Keep responses concise. Only surface to Mat if something needs his attention.
