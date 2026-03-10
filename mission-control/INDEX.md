# 🎛️ CLAWD MISSION CONTROL

Central command for system operations, protocols, and procedures.

---

## 📋 ACTIVE PROTOCOLS

| Protocol | Purpose | Status |
|----------|---------|--------|
| [Agent Transfer](./AGENT_TRANSFER_PROTOCOL.md) | Complete handoff to new agent | ✅ Ready |
| [System Backup](./SYSTEM_BACKUP_PROTOCOL.md) | Full system backup procedure | ⏳ Draft |
| [API Rotation](./API_ROTATION_PROTOCOL.md) | Rotate expired tokens | ⏳ Draft |
| [Emergency Recovery](./EMERGENCY_RECOVERY.md) | System failure recovery | ⏳ Draft |

---

## 🚨 IMMEDIATE ACTIONS

### For New Agent Transfer
1. Read [Agent Transfer Protocol](./AGENT_TRANSFER_PROTOCOL.md)
2. Generate GitHub token
3. Follow Phase 1-4 checklist

### For Daily Operations
1. Check `HEARTBEAT.md` for routine tasks
2. Monitor cron job status
3. Review morning briefing

---

## 📁 MISSION CONTROL FILES

```
mission-control/
├── INDEX.md                          # This file
├── AGENT_TRANSFER_PROTOCOL.md        # New agent handoff
├── SYSTEM_BACKUP_PROTOCOL.md         # Backup procedures
├── API_ROTATION_PROTOCOL.md          # Token management
├── EMERGENCY_RECOVERY.md             # Disaster recovery
└── CHANGELOG.md                      # System changes log
```

---

## 🎯 CURRENT STATUS

**Date:** March 10, 2026  
**Agent:** CLAWD Prime  
**Status:** Transfer preparation complete  

### Systems Operational
- ✅ Google OAuth (auto-refresh)
- ✅ Telegram (paired)
- ✅ GitHub (private repos)
- ✅ Vercel (deployed)
- ✅ Home Assistant (local)
- ✅ Cron jobs (5 active)

### Pending Setup
- ⏳ Supabase (not configured)
- ⏳ ElevenLabs (optional)
- ⏳ Dashboard Google Sheets integration

---

## 📞 ESCALATION

| Issue | Action |
|-------|--------|
| GitHub token expired | Generate new token, update `.env` |
| Google auth failed | Run `openclaw google-auth login` |
| Telegram not responding | Re-pair with `openclaw pairing approve` |
| Cron jobs failing | Check logs, verify tokens |
| Lost all context | Use [Agent Transfer Protocol](./AGENT_TRANSFER_PROTOCOL.md) |

---

*Mission Control is the single source of truth for system procedures.*
