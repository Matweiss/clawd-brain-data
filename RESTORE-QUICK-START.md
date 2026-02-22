# 🚀 Quick Start: Restore New Clawd from Backup

**You have a backup file. New Clawd can be restored in 15 minutes.**

---

## TL;DR (3 Steps)

### **Step 1: Extract Backup** (1 min)
```bash
cd /data/.openclaw/workspace
tar -xzf clawd-workspace-backup-2026-02-22.tar.gz
```

### **Step 2: Restore Credentials** (10 min)
You provide 6 API keys, the script installs them:
```bash
bash /data/.openclaw/workspace/scripts/RESTORE-ALL-CREDENTIALS.sh
```

Prompts for:
- GitHub token
- HubSpot API key
- Avoma API key
- Groq API key
- ElevenLabs API key
- Kimi API key

### **Step 3: Update Vercel** (3 min)
1. Go to: https://vercel.com/clawd-command/settings/environment-variables
2. Update 3 variables:
   - GITHUB_TOKEN
   - HUBSPOT_API_KEY
   - KIMI_API_KEY
3. Redeploy

**Done. Clawd is restored.** ✅

---

## Detailed Guide

See: `RESTORE-CREDENTIALS-GUIDE.md`

**Every credential is documented with:**
- What it does
- Where to get a new one
- Where it needs to go
- What to do if it breaks

---

## Checklist

```
[ ] 1. Backup file ready
[ ] 2. Extract backup
[ ] 3. Run credential restore script
[ ] 4. Update Vercel environment variables
[ ] 5. Verify everything works
[ ] 6. You're done!
```

---

## What's Included in Backup

✅ Memory (all your notes & logs)  
✅ Projects (Command Center, etc.)  
✅ Scripts & configurations  
✅ Documentation & guides  

❌ NOT included: API keys (for security)  
❌ NOT included: .env files

---

## What You Need to Provide

**6 API Keys** (you regenerate these):
1. GitHub token
2. HubSpot API key
3. Avoma API key
4. Groq API key
5. ElevenLabs API key
6. Kimi API key

**3 Vercel environment variables:**
1. GITHUB_TOKEN
2. HUBSPOT_API_KEY
3. KIMI_API_KEY

---

## FAQ

**Q: Can I skip some credentials?**  
A: Not recommended. You need at least Kimi (for the agent to work). Others enable specific features.

**Q: What if I lose the backup file?**  
A: It's also on GitHub. Download it:
```bash
curl -o backup.tar.gz \
  "https://raw.githubusercontent.com/Matweiss/clawd-brain-data/master/backups/clawd-workspace-backup-2026-02-22.tar.gz"
```

**Q: How long does restore take?**  
A: ~15 minutes (mostly waiting for you to generate new tokens)

**Q: Will my memory/history be restored?**  
A: Yes. All session logs, MEMORY.md, projects — everything.

**Q: Will my projects work?**  
A: Yes, as long as you restore the credentials. The code is unchanged.

---

## Help

If anything breaks, check `RESTORE-CREDENTIALS-GUIDE.md` for troubleshooting.

Each section has:
- What it does
- How to fix it
- Common errors

---

**Ready? Start with Step 1 above.** 🚀
