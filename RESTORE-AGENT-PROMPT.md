# 🤖 Restoration Prompt for New Clawd Agent

**Copy & paste this entire prompt to a new agent with zero context.**

---

## YOUR MISSION

You are being asked to restore a Clawd agent (AI assistant) from backup to a new Docker instance. This is a critical task that restores continuity, memory, and all projects.

**What you need to do:**
1. Follow the Restoration Center guide
2. Extract the backup file
3. Run the restoration script
4. Update Vercel environment variables
5. Verify everything works

**You have everything you need.** Start with the Restoration Center.

---

## STEP 1: Access the Restoration Center

**Go to:** https://clawd-brain.vercel.app/restore

This is a centralized guide with everything you need:
- ✅ Quick start (3-step instructions)
- ✅ All API credentials documented
- ✅ Full troubleshooting guide
- ✅ Verification checklist
- ✅ Download options for offline use

**If the dashboard is down**, use the GitHub backup instead:
- Backup location: https://github.com/Matweiss/clawd-brain-data/tree/master/backups
- Latest file: `clawd-workspace-backup-YYYY-MM-DD.tar.gz`

---

## STEP 2: Get the Backup File

The backup is in one of two places:

### **Option A: Download from Dashboard (Recommended)**
- Go to: https://clawd-brain.vercel.app/restore
- Click "Download Backup" button
- Or download one of the files listed under "📥 Download Files"

### **Option B: Download from GitHub**
```bash
# Go to GitHub backups folder
https://github.com/Matweiss/clawd-brain-data/tree/master/backups

# Or download directly:
curl -O https://raw.githubusercontent.com/Matweiss/clawd-brain-data/master/backups/clawd-workspace-backup-2026-02-22.tar.gz
```

---

## STEP 3: Extract the Backup

On the new Docker instance:

```bash
cd /data/.openclaw/workspace
tar -xzf clawd-workspace-backup-YYYY-MM-DD.tar.gz
```

This extracts:
- ✅ All memory files (daily logs, MEMORY.md)
- ✅ Projects & builds
- ✅ Scripts & configurations
- ✅ All documentation
- ✅ The restoration script itself

**Verify extraction worked:**
```bash
ls -la MEMORY.md SOUL.md USER.md
# Should show 3 files
```

---

## STEP 4: Run the Credential Restoration Script

This is the **interactive script** that will prompt you for API credentials and install them automatically.

```bash
bash /data/.openclaw/workspace/scripts/RESTORE-ALL-CREDENTIALS.sh
```

**What it does:**
1. Prompts for 6 API keys (one by one)
2. Installs each one automatically
3. Verifies each connection
4. Saves reference file

**You'll be asked for:** (Have these ready or generate fresh)
1. GitHub token
2. HubSpot API key
3. Avoma API key
4. Groq API key
5. ElevenLabs API key
6. Kimi API key

---

## STEP 5: Update Vercel Environment Variables

After the script completes, you need to update **3 environment variables** in Vercel:

**Go to:** https://vercel.com/clawd-command/settings/environment-variables

**Update these 3 variables** (the script will give you the values):
1. `GITHUB_TOKEN` = (value from script)
2. `HUBSPOT_API_KEY` = (value from script)
3. `KIMI_API_KEY` = (value from script)

**Then redeploy:**
```bash
vercel deploy --prod
```

---

## STEP 6: Verify Everything Works

Run these checks to confirm restoration succeeded:

```bash
# 1. Gateway has all secrets
openclaw status | grep -E "GITHUB|HUBSPOT|KIMI"

# 2. Git sync works
cd /data/.openclaw/workspace
git fetch origin && echo "✅ GitHub connected"

# 3. Memory files present
ls -la MEMORY.md SOUL.md USER.md && echo "✅ Memory restored"

# 4. Dashboard loads
curl https://clawd-brain.vercel.app/ | grep "Clawd Brain"

# 5. List sessions
openclaw sessions_list
```

**All checks should pass.** ✅

---

## DETAILED HELP

If you need more info on any step, **return to the Restoration Center:**

**URL:** https://clawd-brain.vercel.app/restore

It has:
- ✅ Detailed credential guide (where to get each API key)
- ✅ Full troubleshooting (common issues & fixes)
- ✅ Verification checklist
- ✅ What gets restored vs. what doesn't

---

## IF SOMETHING BREAKS

### **"Git authentication failed"**
- GitHub token is wrong
- Regenerate from: https://github.com/settings/tokens?type=beta
- Scopes needed: Contents (read/write), Metadata (read-only)

### **"HubSpot connection failed"**
- API key is invalid
- Regenerate from: https://app.hubspot.com/l/settings/integrations/private-apps

### **"Dashboard won't load"**
- Vercel env vars not updated
- Go to: https://vercel.com/clawd-command/settings/environment-variables
- Verify all 3 variables are set
- Redeploy: `vercel deploy --prod`

### **"Memory files missing"**
- Backup extraction didn't work
- Check: `tar -tzf backup.tar.gz | grep MEMORY.md`
- Try extracting again

---

## QUICK SUMMARY

| Step | Command | Time |
|------|---------|------|
| 1 | Visit https://clawd-brain.vercel.app/restore | 1 min |
| 2 | Download backup file | 2 min |
| 3 | `tar -xzf clawd-workspace-backup-YYYY-MM-DD.tar.gz` | 1 min |
| 4 | `bash /data/.openclaw/workspace/scripts/RESTORE-ALL-CREDENTIALS.sh` | 10 min |
| 5 | Update 3 Vercel env vars + redeploy | 3 min |
| 6 | Run verification checks | 1 min |
| **TOTAL** | | **~18 min** |

---

## YOU GOT THIS 🚀

Everything is documented. Everything is automated. You have:
- ✅ A complete backup with all files
- ✅ An interactive restoration script
- ✅ A centralized guide with troubleshooting
- ✅ Download options for offline access

**Just follow the 3-step guide in the Restoration Center, provide 6 API keys, update Vercel, and you're done.**

The previous Clawd's entire workspace will be restored with zero data loss.

---

**Start here:** https://clawd-brain.vercel.app/restore

**Good luck!** 💪
