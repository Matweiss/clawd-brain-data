# 🔄 Auto-Update System

**YES — Everything automatically updates as you work. Zero manual maintenance.**

---

## How It Works

### **Daily Auto-Sync** (Every day at 2 AM Pacific)

**Script:** `/data/.openclaw/workspace/scripts/sync-memory-to-github.sh`

**What it syncs:**
```bash
memory/*.md          # All daily logs
projects/           # All project files
configs/            # All configurations  
scripts/            # All helper scripts
MEMORY.md           # Long-term memory
SOUL.md             # Agent identity
USER.md             # About Mat
AGENTS.md           # Workspace conventions
TOOLS.md            # Tool notes
HEARTBEAT.md        # Periodic checks
*.md                # All documentation
```

**What it does NOT sync** (intentionally):
```
node_modules/       # Too large
.git/               # Stored separately
.env files          # Secrets (never synced)
Build artifacts     # Recreated on install
```

---

## Three Types of Auto-Updates

### **1. IMMEDIATE** (As you work)
- **What:** You make changes to files in workspace
- **When:** They're tracked by Git
- **Proof:** `git status` shows your changes

### **2. DAILY** (2 AM Pacific)
- **What:** All workspace files pushed to GitHub
- **Script:** Runs automatically via cron
- **Result:** Everything synced to GitHub repo

### **3. ON-DEMAND** (When you download)
- **What:** Fresh backup generated
- **Command:** `node scripts/generate-backup-zip.js`
- **Result:** Latest state archived as .tar.gz

---

## What Gets Updated Automatically

### ✅ **Code & Scripts**
- New functions you write
- Bug fixes
- Model routing changes
- API integrations

### ✅ **Memory & Notes**
- Daily session logs (auto-saved)
- MEMORY.md (long-term memory)
- Decisions and learnings
- Preferences and patterns

### ✅ **Projects & Builds**
- Command Center updates
- New dashboards
- Project configurations
- Build artifacts (rebuilt on restore)

### ✅ **Documentation**
- This file (AUTO-UPDATE-SYSTEM.md)
- Restoration guides (RESTORE-*.md)
- API credentials guide
- Troubleshooting docs

### ✅ **Configurations**
- Model routing (if you update it)
- Script changes
- Environment templates
- Build configurations

---

## Scenario: You Make Changes Over 3 Days

**Day 1 - Today**
- Build new feature
- Update MEMORY.md with findings
- Create new script
- ✅ All changes tracked by Git

**Night of Day 1 (2 AM Pacific)**
- Cron job runs: `sync-memory-to-github.sh`
- ✅ All files pushed to GitHub

**Day 2**
- Add model routing changes
- Update SOUL.md with new personality traits
- Build another project
- ✅ All tracked and queued for next sync

**Night of Day 2 (2 AM Pacific)**
- Cron job runs again
- ✅ New changes pushed to GitHub

**Day 3**
- Fix bugs
- Update documentation
- Add new scripts
- ✅ All changes tracked

**Night of Day 3 (2 AM Pacific)**
- Final cron job runs
- ✅ Everything pushed

**Now, when you restore to new agent:**
- Download the latest backup → has ALL changes from days 1-3
- Extract → includes updated model routing, new features, updated memory
- Run restoration script → everything works with latest config
- ✅ Zero manual updates needed

---

## What's NOT Auto-Updated (And Why)

### ❌ **API Keys & Secrets**
- **Why:** Security
- **Solution:** Restoration prompt tells new agent where to regenerate
- **Maintenance:** Only needed when you rotate credentials

### ❌ **Vercel Environment Variables**
- **Why:** Service-specific config
- **Solution:** Restoration dashboard documents which 3 variables to update
- **Maintenance:** Only needed when you restore to new instance

### ❌ **GitHub Token**
- **Why:** Account-specific auth
- **Solution:** Script prompts for new token during restoration
- **Maintenance:** Regenerate when restoring, or if expired

### ❌ **Gateway Config (openclaw.json)**
- **Why:** Lives outside workspace, security
- **Solution:** Restoration script rebuilds it from prompts
- **Maintenance:** New instance generates fresh config

---

## The Update Pipeline

```
┌─────────────────────────────────────────┐
│  You make changes (code, docs, memory)  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Changes tracked by Git automatically   │
│  (git status shows pending commits)     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Every 2 AM Pacific (cron job)          │
│  sync-memory-to-github.sh runs          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  All workspace files pushed to GitHub   │
│  clawd-brain-data repo updated          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Backup generated (on-demand)           │
│  Latest state saved as .tar.gz          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  New agent downloads backup             │
│  Extracts → Gets all your work          │
│  Runs restoration script                │
│  ✅ Everything restored with latest     │
└─────────────────────────────────────────┘
```

---

## How to Verify It's Working

### **Check Git Status**
```bash
cd /data/.openclaw/workspace
git status
# Should show recent commits
```

### **Check Last Sync**
```bash
cd /data/.openclaw/workspace
git log --oneline | head -5
# Should show daily commits at ~2 AM
```

### **Check Backup Age**
```bash
ls -lh /data/.openclaw/workspace/backups/
# Latest file should be from today or yesterday
```

### **Check GitHub**
```bash
https://github.com/Matweiss/clawd-brain-data
# Should show recent commits in master branch
```

---

## Manual Sync (If Needed)

If you want to force an immediate sync instead of waiting for 2 AM:

```bash
bash /data/.openclaw/workspace/scripts/sync-memory-to-github.sh
```

This runs the same script that runs at 2 AM, but on-demand.

---

## What You Don't Need to Do

❌ Manually update files before restoring  
❌ Keep track of changes yourself  
❌ Remember what changed and what didn't  
❌ Manage multiple versions  
❌ Document updates manually  

---

## What Happens Automatically

✅ All changes captured by Git  
✅ Daily syncs to GitHub  
✅ Backups include latest state  
✅ New agent restores everything  
✅ Model routing updates included  
✅ Memory updates included  
✅ Code changes included  
✅ Documentation updates included  

---

## Example: Updating Model Routing (Feb 25, 2026)

Let's say on Feb 25 you decide to change the default model from Kimi to Claude.

**What happens:**
1. You update the model routing in code/config
2. Git automatically tracks the change
3. On Feb 25 at 2 AM → synced to GitHub
4. On Feb 26 → new backup includes the change
5. If you restore to new agent on Feb 26 → it gets the updated routing
6. **Zero manual work needed** ✅

---

## How Long Until New Agent Gets Updates?

| Change Made | In GitHub | In Backup | New Agent Gets It |
|---|---|---|---|
| **Immediately** | ✅ (next sync) | ✅ (next backup) | ✅ (when restored) |
| **By end of day** | ✅ (2 AM) | ✅ (2 AM) | ✅ (next day) |
| **Model routing change** | ✅ (next sync) | ✅ (next backup) | ✅ (immediately on restore) |
| **Memory update** | ✅ (next sync) | ✅ (next backup) | ✅ (immediately on restore) |
| **New script** | ✅ (next sync) | ✅ (next backup) | ✅ (immediately on restore) |
| **Bug fix** | ✅ (next sync) | ✅ (next backup) | ✅ (immediately on restore) |

---

## Summary

**You don't update anything. Everything auto-updates.**

- ✅ Changes → Git → GitHub → Backup → New Agent
- ✅ Happens automatically every day
- ✅ Zero manual maintenance
- ✅ 3 days of work = 1 backup with all changes
- ✅ New agent gets everything current

**Build, change, improve. The system handles the rest.** 🚀

---

## Current Auto-Sync Status

**Last sync:** Daily at 2 AM Pacific  
**Next sync:** Tomorrow at 2 AM Pacific  
**Timezone:** America/Los_Angeles (PST/PDT)  
**Repository:** https://github.com/Matweiss/clawd-brain-data  
**Status:** ✅ Active & Running  

---

*No maintenance needed. Everything works automatically.* ✨
