# BACKUP-MANIFEST.md - What's Backed Up & Where

**Generated:** 2026-02-22 14:13 UTC  
**Backup Size:** 86 KB (compressed)

---

## Backup Contents

### Configuration Files
- ✅ `/data/.openclaw/openclaw.json` — All API keys, gateway config, model routing
- ✅ `/data/.openclaw/google-token.json` — Gmail/Calendar OAuth token
- ✅ `/data/.openclaw/workspace/.env.supabase` — Supabase credentials
- ✅ `/data/.openclaw/workspace/.vercel-token` — Vercel deployment token
- ✅ `/data/.openclaw/workspace/clawd-command/.env.local` — Dashboard environment

### Memory & Context
- ✅ `/data/.openclaw/workspace/MEMORY.md` — Long-term curated memory
- ✅ `/data/.openclaw/workspace/SOUL.md` — Agent identity
- ✅ `/data/.openclaw/workspace/USER.md` — User context (Mat)
- ✅ `/data/.openclaw/workspace/AGENTS.md` — Agent workspace config
- ✅ `/data/.openclaw/workspace/memory/` — Daily logs (2026-02-05 onwards)

### Excluded (Can Rebuild)
- ❌ `node_modules/` — Reinstall with npm
- ❌ `.next/` — Rebuild with next build
- ❌ Log files — Temporary
- ❌ Session caches — Will recreate
- ❌ Cron run logs — Historical only

---

## Storage Locations

| Medium | Location | Backup Frequency | Access |
|--------|----------|------------------|--------|
| **VPS (Local)** | `/data/.openclaw/workspace/backups/` | Manual | SSH to VPS |
| **GitHub** | `Matweiss/clawd-brain-data` | Daily 2 AM Pacific | Via GitHub |
| **Vercel** | Dashboard code deployed | Continuous | Via Vercel UI |
| **Supabase** | PostgreSQL database | Real-time backup | Via Supabase UI |

---

## How to Download Backup

### Option 1: From VPS
```bash
scp user@vps:/data/.openclaw/workspace/backups/openclaw-critical-*.tar.gz ~/Downloads/
```

### Option 2: From GitHub (Memory + Docs Only)
```bash
git clone https://github.com/Matweiss/clawd-brain-data.git
# Get MEMORY.md, daily logs, identity files
```

### Option 3: Manual Download via Dashboard
- Coming in Phase 2: Backup status page with download link

---

## Recovery Time Estimate

| Task | Time |
|------|------|
| Extract backup | 30 seconds |
| Restore files | 2 minutes |
| Restart OpenClaw | 1 minute |
| Telegram connectivity check | 1 minute |
| **Total** | **~5 minutes** |

---

## Verification

**Backup Checksum:**
```
cbde2715552c837c5942511193eeff9b9f06302f9040c1bad5b61ade4f1bda6c  openclaw-critical-20260222-141305.tar.gz
```

Verify after download:
```bash
sha256sum openclaw-critical-20260222-141305.tar.gz
# Should match above
```

---

## Next Steps

1. ✅ Backup created
2. ⏳ Create backup dashboard (Phase 2)
3. ⏳ Test minimal operation (Phase 3)
4. ⏳ Schedule container restart with recovery plan
