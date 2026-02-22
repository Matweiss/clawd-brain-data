# Clawd Workspace Backup & Restore Guide

## What's Backed Up

**Every day at 2 AM Pacific**, your entire workspace syncs to GitHub:
- ✅ `memory/` — All daily notes and session logs
- ✅ `MEMORY.md` — Long-term curated memory
- ✅ `projects/` — All project files and builds
- ✅ `configs/` — Configuration files
- ✅ `scripts/` — Automation and helper scripts
- ✅ `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md` — Core identity & settings

**NOT backed up** (intentionally):
- `node_modules/` — Too large, rebuilt on install
- `.git/` — Already in Git history
- `.env` files — Secrets stay local, never synced
- Build artifacts — Recreated on deploy
- `.openclaw/` — System configs, not shareable

---

## Download Your Backup

Visit the dashboard: **https://clawd-brain.vercel.app/**

1. Click **"Download Backup"** button
2. Save `clawd-workspace-backup-YYYY-MM-DD.zip`
3. Keep it safe — this is your complete Clawd identity

---

## Restore to a New Clawd Instance

If you need to move to a new Clawd agent or recover from data loss:

### Option 1: Quick Restore (Recommended)
```bash
# On the new Clawd instance
cd /data/.openclaw/workspace
unzip clawd-workspace-backup-YYYY-MM-DD.zip -d .

# Verify files restored
ls -la MEMORY.md USER.md SOUL.md
```

### Option 2: Full Fresh Install
```bash
# Create new workspace
mkdir -p /data/.openclaw/workspace
cd /data/.openclaw/workspace

# Extract backup
unzip /path/to/clawd-workspace-backup-YYYY-MM-DD.zip -d .

# Install dependencies
npm install  # if any projects require it

# Initialize Git
git init
git add .
git commit -m "Restore from backup"
git remote add origin https://github.com/Matweiss/clawd-brain-data
git push -u origin master
```

---

## What You're Restoring

When you unzip the backup, you get:

```
clawd-workspace-backup-2026-02-22/
├── memory/                 # Session logs & daily notes
├── projects/              # Built projects (Command Center, etc.)
├── configs/               # Configuration templates
├── scripts/               # Automation helpers
├── MEMORY.md              # Long-term memory (your identity)
├── USER.md                # About Mat (your human)
├── SOUL.md                # Who you are as Clawd
├── AGENTS.md              # Agent workspace conventions
├── TOOLS.md               # Local tool notes
├── HEARTBEAT.md           # Periodic check tasks
└── *.md                   # All other documentation
```

---

## Important Notes

1. **API Keys & Secrets** — NOT included in backups (security)
   - Re-add them to `openclaw.json` or `.env` after restore
   - Use `gateway secrets` to securely store API keys

2. **Git History** — Only the latest state
   - If you need full Git history, clone from the GitHub repo directly

3. **Timing** — Backup syncs at 2 AM Pacific
   - If you restore, you're getting the previous 24h of work
   - Any work after the last sync needs manual recovery

4. **Permissions** — GitHub token is in your dashboard config
   - If it expires, you'll need to regenerate it
   - See dashboard settings for the current token

---

## Automating This Process

If you want daily automated backups to a different location:

1. Set up `BACKUP_LOCATION` env var
2. Modify `/data/.openclaw/workspace/scripts/sync-memory-to-github.sh`
3. Add local backup before GitHub push:
   ```bash
   zip -r "$BACKUP_LOCATION/clawd-backup-$(date +%Y%m%d).zip" . -x "node_modules/*" ".git/*"
   ```

---

## Recovery Checklist

After restoring to a new instance:

- [ ] Verify `MEMORY.md` and `USER.md` exist
- [ ] Check `SOUL.md` — your identity
- [ ] Test projects (build, run, verify)
- [ ] Re-add API keys to gateway config
- [ ] Re-connect GitHub token for dashboard
- [ ] Run first heartbeat to verify everything works
- [ ] Confirm memory and projects are accessible

---

## Questions?

- **Backup not showing?** → Check GitHub token is valid
- **Restore failed?** → Verify unzip worked, check file permissions
- **Missing files?** → Restore likely didn't include them; they may need manual recovery

This is your insurance policy. Use it wisely. 💾
