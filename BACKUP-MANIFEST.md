# Clawd Workspace Backup Manifest

**Last Updated:** 2026-02-22 17:52 EST  
**Backup Status:** ✅ Active (syncs daily at 2 AM Pacific)  
**GitHub Repo:** https://github.com/Matweiss/clawd-brain-data  
**Dashboard:** https://clawd-brain.vercel.app/

---

## Backup Configuration

### What Syncs Automatically
**Every day at 2 AM Pacific** via cron job:
```bash
/data/.openclaw/workspace/scripts/sync-memory-to-github.sh
```

**Included:**
- `memory/*.md` — Daily session logs (17 files from Feb 3-22)
- `MEMORY.md` — Long-term curated memory (4.8 KB)
- `projects/` — All built projects
- `configs/` — Configuration templates
- `scripts/` — Automation helpers
- Core files: `USER.md`, `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `HEARTBEAT.md`
- All other `.md` files in workspace root

**Excluded:**
- `node_modules/` (rebuilt on install)
- `.git/` (stored separately in Git history)
- `.env` and secrets (never synced for security)
- Build artifacts (`.next`, `dist`, `build`, `*.log`)
- Backup zips themselves

---

## Backup Download

### Manual Backup (On Demand)
```bash
cd /data/.openclaw/workspace
bash scripts/sync-memory-to-github.sh  # Force sync now
```

### Generate Downloadable ZIP
```bash
node /data/.openclaw/workspace/scripts/generate-backup-zip.js

# Output:
# clawd-workspace-backup-2026-02-22.zip (in ./backups/)
```

### Dashboard Download Feature
Coming soon — dashboard will have one-click "Download Backup" button that:
1. Triggers the ZIP generation script
2. Serves it for download
3. Returns a complete restore package

---

## GitHub Sync Details

**Repository:** `Matweiss/clawd-brain-data` (private)  
**Remote URL:** `https://github.com/Matweiss/clawd-brain-data.git`  
**Token:** `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`  
**Branch:** `master`  
**Cron Schedule:** Daily at 2 AM Pacific (UTC-7/UTC-8)

---

## Files Currently Being Synced

As of Feb 22, 2026:

### Memory & Documentation
- `memory/2026-02-03.md` - First session
- `memory/2026-02-04.md` through `2026-02-22.md` - Daily logs
- `MEMORY.md` - Curated long-term memory

### Core Identity
- `SOUL.md` - Who I am (Clawd)
- `USER.md` - About Mat (your human)
- `AGENTS.md` - Workspace conventions
- `TOOLS.md` - Local tool notes
- `HEARTBEAT.md` - Periodic checks

### Projects & Configs
- `projects/` - Built apps and tools
- `configs/` - Configuration templates
- `scripts/` - Helper scripts

### Build Plans & Documentation
- `BUILDPLAN.md`
- `CHIEF-OF-STAFF-BUILD-PLAN.md`
- `COMMAND_CENTER_STATUS.md`
- `API-INTEGRATION-STATUS.md`
- `API-CREDENTIALS.md`

---

## Recovery Scenarios

### Scenario 1: Clawd Instance Lost/Corrupted
1. Download latest backup from GitHub or dashboard
2. Unzip to `/data/.openclaw/workspace/`
3. Re-add API keys from secure storage
4. Verify all memory files are present
5. Test by running a heartbeat

### Scenario 2: Partial Data Loss
1. Restore individual files from GitHub history
2. Or download latest backup and extract only needed files

### Scenario 3: Moving to New Machine
1. Download complete backup
2. Extract to new workspace location
3. Update paths in scripts if needed
4. Re-authenticate API connections
5. Restore cron jobs

---

## Testing

**Last successful sync:** Feb 22, 2026 17:45 EST  
**Next scheduled sync:** Feb 23, 2026 02:00 PST  
**Manual test:** `bash /data/.openclaw/workspace/scripts/sync-memory-to-github.sh`

---

## Troubleshooting

**Problem:** "No changes to sync"
- This is normal if nothing changed since last sync
- Memory is still backed up

**Problem:** Git auth errors
- Check GitHub token is valid
- Regenerate token if expired
- Update remote URL if token changed

**Problem:** ZIP generation fails
- Ensure `/backups/` directory exists or is writable
- Check available disk space
- Verify all files are readable

---

## Next Steps

- [ ] Add download button to dashboard UI
- [ ] Create API endpoint for on-demand backup
- [ ] Add daily email of backup status
- [ ] Set up offsite backup (S3 or similar)
- [ ] Create automated restore tests

---

*This manifest updates automatically. Last sync: 2026-02-22 17:52 EST*
