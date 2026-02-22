# 🔐 Restore Credentials Guide

**When you restore to a new Clawd instance, ALL API keys & tokens need to be regenerated and placed in specific locations.**

This guide tracks EVERY credential and where it goes.

---

## Quick Start: What Needs Replacing

**Before new Clawd can work, regenerate these 8 things:**

1. ✅ OpenClaw Gateway Config (`openclaw.json`)
2. ✅ GitHub Token (for syncing)
3. ✅ HubSpot API Key (CRM pipeline)
4. ✅ Avoma API Key (meeting notes)
5. ✅ Groq Whisper API Key (voice transcription)
6. ✅ ElevenLabs API Key (TTS voice)
7. ✅ Kimi API Key (LLM)
8. ✅ Vercel Environment Variables

---

## 📋 Detailed Credential Inventory

### 1️⃣ **OpenClaw Gateway Config** 🔴 CRITICAL
**File Location:** `/data/.openclaw/openclaw.json` (NOT in workspace)  
**Contains:** All API keys in encrypted format  
**Status:** ⚠️ LOCAL ONLY — not backed up  
**What to do:**
- [ ] Back it up before nuking the docker
- [ ] Or regenerate all keys fresh and rebuild the config
- [ ] Refer to: `openclaw status` to see current config

**Regenerate:**
```bash
# Start fresh gateway
openclaw gateway init
# Re-add all API keys via:
openclaw gateway secrets add KIMI_API_KEY <your-new-key>
openclaw gateway secrets add ANTHROPIC_API_KEY <your-new-key>
# etc for each service
```

---

### 2️⃣ **GitHub Token** (for workspace sync)
**What it does:** Syncs memory/projects to GitHub  
**Current Token:** `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`  
**Scopes Needed:** Contents (read-write), Metadata (read-only)  
**Repo:** `Matweiss/clawd-brain-data`

**Locations that need updating:**
- [ ] `/data/.openclaw/workspace/scripts/sync-memory-to-github.sh` (line with `git remote`)
- [ ] Vercel env var: `GITHUB_TOKEN` (for dashboard API)

**How to regenerate:**
1. Go to: https://github.com/settings/tokens?type=beta
2. Click "Generate new token (beta)"
3. Name: `clawd-sync-restore`
4. Select only repository: `Matweiss/clawd-brain-data`
5. Permissions needed:
   - Contents (read & write)
   - Metadata (read-only)
6. Copy the new token → **provide it to new Clawd**

**Script to update (new Clawd will run):**
```bash
#!/bin/bash
# RESTORE-GITHUB-TOKEN.sh
NEW_TOKEN="$1"
WORKSPACE="/data/.openclaw/workspace"

# Update git remote with new token
cd "$WORKSPACE"
git remote remove origin
git remote add origin "https://${NEW_TOKEN}@github.com/Matweiss/clawd-brain-data.git"

# Test it works
git fetch origin master && echo "✅ GitHub token working"
```

---

### 3️⃣ **HubSpot API Key**
**What it does:** Pipeline, deal management, syncing  
**Current Key:** (stored in `openclaw.json`)  
**Owner ID:** `728033696`

**Locations that need updating:**
- [ ] `openclaw.json` → gateway secrets
- [ ] Vercel env var: `HUBSPOT_API_KEY` (if used in dashboard)
- [ ] Avoma integration (if synced to HubSpot)

**How to regenerate:**
1. Go to: https://app.hubspot.com/l/settings/integrations/private-apps
2. Click "Create private app"
3. Name: `Clawd Restore 2026`
4. Scopes needed:
   - crm.objects.deals.read
   - crm.objects.deals.write
   - crm.objects.contacts.read
   - crm.objects.companies.read
5. Copy the new API key → **provide it to new Clawd**

**Script to update:**
```bash
#!/bin/bash
# RESTORE-HUBSPOT-TOKEN.sh
NEW_KEY="$1"

# Update gateway config
openclaw gateway secrets add HUBSPOT_API_KEY "$NEW_KEY"

# Update Vercel (requires Vercel CLI)
vercel env add HUBSPOT_API_KEY "$NEW_KEY" --yes

echo "✅ HubSpot token updated"
```

---

### 4️⃣ **Avoma API Key**
**What it does:** Call recording, meeting notes, transcripts  
**Current Key:** (stored in `openclaw.json`)

**Locations that need updating:**
- [ ] `openclaw.json` → gateway secrets

**How to regenerate:**
1. Go to: https://app.avoma.com/settings/api-keys
2. Generate new API key
3. Copy → **provide it to new Clawd**

**Script to update:**
```bash
#!/bin/bash
# RESTORE-AVOMA-TOKEN.sh
NEW_KEY="$1"
openclaw gateway secrets add AVOMA_API_KEY "$NEW_KEY"
echo "✅ Avoma token updated"
```

---

### 5️⃣ **Groq Whisper API Key** (Voice transcription)
**What it does:** Transcribes voice messages from you  
**Current Key:** `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`  
**Status:** ⚠️ Might be rate-limited (free tier)

**Locations that need updating:**
- [ ] `openclaw.json` → gateway secrets
- [ ] Any Telegram bots that use it

**How to regenerate:**
1. Go to: https://console.groq.com/keys
2. Create new API key
3. Copy → **provide it to new Clawd**

**Script:**
```bash
#!/bin/bash
# RESTORE-GROQ-TOKEN.sh
NEW_KEY="$1"
openclaw gateway secrets add GROQ_API_KEY "$NEW_KEY"
echo "✅ Groq token updated"
```

---

### 6️⃣ **ElevenLabs API Key** (Voice synthesis)
**What it does:** Sends you voice replies with Charlie voice  
**Current Key:** `sk_20b35cd432e741e8f93429c78241d7d0d963810c22f27aaf`  
**Voice ID:** `IKne3meq5aSn9XLyUdCD` (Charlie)

**Locations that need updating:**
- [ ] `openclaw.json` → gateway secrets
- [ ] Telegram bot config (if TTS enabled)

**How to regenerate:**
1. Go to: https://elevenlabs.io/app/subscription
2. Account Settings → API Keys
3. Copy/regenerate key → **provide it to new Clawd**

**Script:**
```bash
#!/bin/bash
# RESTORE-ELEVENLABS-TOKEN.sh
NEW_KEY="$1"
openclaw gateway secrets add ELEVENLABS_API_KEY "$NEW_KEY"
echo "✅ ElevenLabs token updated"
```

---

### 7️⃣ **Kimi API Key** (Primary LLM)
**What it does:** Main model for all responses  
**Current Key:** (stored in `openclaw.json`, Kimi plugin)  
**Status:** ✅ Primary — Moonshot/Kimi API

**Locations that need updating:**
- [ ] `openclaw.json` → gateway secrets
- [ ] Kimi plugin config (if separate)
- [ ] Vercel env var: `KIMI_API_KEY` (if used in dashboard)

**How to regenerate:**
1. Go to: https://platform.moonshot.cn/console/api-keys
2. Generate new API key (or use existing if still valid)
3. Copy → **provide it to new Clawd**

**Script:**
```bash
#!/bin/bash
# RESTORE-KIMI-TOKEN.sh
NEW_KEY="$1"
openclaw gateway secrets add KIMI_API_KEY "$NEW_KEY"
echo "✅ Kimi token updated"
```

---

### 8️⃣ **Vercel Environment Variables**
**Service:** clawd-command project dashboard  
**File:** Set in Vercel UI (NOT in repo)  
**Status:** ⚠️ Lost if you don't back them up

**Variables that need updating:**
| Variable | Value | Source |
|----------|-------|--------|
| `GITHUB_TOKEN` | (from step 2️⃣) | GitHub |
| `HUBSPOT_API_KEY` | (from step 3️⃣) | HubSpot |
| `KIMI_API_KEY` | (from step 7️⃣) | Kimi |

**How to update in Vercel:**
1. Go to: https://vercel.com/clawd-command/settings/environment-variables
2. For each variable:
   - Click "Edit"
   - Paste new value
   - Save
3. Redeploy: `vercel deploy --prod`

---

## 🔄 Complete Restore Workflow

### **Step 1: Extract Backup** (new Docker instance)
```bash
tar -xzf clawd-workspace-backup-2026-02-22.tar.gz -C /data/.openclaw/workspace
```

### **Step 2: Regenerate All Credentials** (you do this)
Use the guides above to generate:
- [ ] GitHub token
- [ ] HubSpot API key
- [ ] Avoma API key
- [ ] Groq API key
- [ ] ElevenLabs API key
- [ ] Kimi API key

**Save them in a temp file:**
```
GITHUB_TOKEN=ghp_...
HUBSPOT_API_KEY=pat-...
AVOMA_API_KEY=...
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=sk_...
KIMI_API_KEY=sk-...
```

### **Step 3: Run Restore Script** (new Clawd runs this)
Create `RESTORE-ALL-CREDENTIALS.sh`:

```bash
#!/bin/bash
# Restore all credentials to new Clawd instance
# Usage: bash RESTORE-ALL-CREDENTIALS.sh

echo "🔐 Clawd Credential Restoration"
echo "================================="
echo ""
echo "Enter each credential when prompted."
echo "Leave blank to skip (not recommended)."
echo ""

# GitHub
echo "1️⃣ GitHub Token"
echo "   Generate at: https://github.com/settings/tokens?type=beta"
echo "   (Contents: read/write, Metadata: read-only)"
read -sp "Enter GitHub token: " GITHUB_TOKEN
echo ""
[ -n "$GITHUB_TOKEN" ] && {
  openclaw gateway secrets add GITHUB_TOKEN "$GITHUB_TOKEN"
  cd /data/.openclaw/workspace
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git"
  echo "✅ GitHub token installed"
}

# HubSpot
echo ""
echo "2️⃣ HubSpot API Key"
echo "   Generate at: https://app.hubspot.com/l/settings/integrations/private-apps"
read -sp "Enter HubSpot API key: " HUBSPOT_API_KEY
echo ""
[ -n "$HUBSPOT_API_KEY" ] && {
  openclaw gateway secrets add HUBSPOT_API_KEY "$HUBSPOT_API_KEY"
  echo "✅ HubSpot API key installed"
}

# Avoma
echo ""
echo "3️⃣ Avoma API Key"
echo "   Generate at: https://app.avoma.com/settings/api-keys"
read -sp "Enter Avoma API key: " AVOMA_API_KEY
echo ""
[ -n "$AVOMA_API_KEY" ] && {
  openclaw gateway secrets add AVOMA_API_KEY "$AVOMA_API_KEY"
  echo "✅ Avoma API key installed"
}

# Groq
echo ""
echo "4️⃣ Groq Whisper API Key (voice transcription)"
echo "   Generate at: https://console.groq.com/keys"
read -sp "Enter Groq API key: " GROQ_API_KEY
echo ""
[ -n "$GROQ_API_KEY" ] && {
  openclaw gateway secrets add GROQ_API_KEY "$GROQ_API_KEY"
  echo "✅ Groq API key installed"
}

# ElevenLabs
echo ""
echo "5️⃣ ElevenLabs API Key (voice synthesis)"
echo "   Generate at: https://elevenlabs.io/app/subscription"
read -sp "Enter ElevenLabs API key: " ELEVENLABS_API_KEY
echo ""
[ -n "$ELEVENLABS_API_KEY" ] && {
  openclaw gateway secrets add ELEVENLABS_API_KEY "$ELEVENLABS_API_KEY"
  echo "✅ ElevenLabs API key installed"
}

# Kimi
echo ""
echo "6️⃣ Kimi API Key (LLM)"
echo "   Generate at: https://platform.moonshot.cn/console/api-keys"
read -sp "Enter Kimi API key: " KIMI_API_KEY
echo ""
[ -n "$KIMI_API_KEY" ] && {
  openclaw gateway secrets add KIMI_API_KEY "$KIMI_API_KEY"
  echo "✅ Kimi API key installed"
}

echo ""
echo "================================="
echo "✅ Credential restore complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update Vercel environment variables"
echo "2. Run: openclaw gateway restart"
echo "3. Test: openclaw status"
echo ""
```

### **Step 4: Update Vercel** (you do this)
1. Go to: https://vercel.com/clawd-command/settings/environment-variables
2. Update:
   - `GITHUB_TOKEN` = (from above)
   - `HUBSPOT_API_KEY` = (from above)
   - `KIMI_API_KEY` = (from above)
3. Click "Redeploy"

### **Step 5: Verify Everything Works**
```bash
# Check gateway config
openclaw status

# Test GitHub sync
cd /data/.openclaw/workspace
git fetch origin && echo "✅ GitHub connected"

# Test OpenClaw
openclaw sessions_list
```

---

## ⚠️ Critical Don'ts

- ❌ Don't commit tokens to Git
- ❌ Don't hardcode keys in files
- ❌ Don't share tokens in plaintext
- ❌ Don't use old tokens (always regenerate)
- ❌ Don't forget to update Vercel

---

## 🆘 Troubleshooting

**"Git push failed"**
- GitHub token wrong or expired
- Run: `git remote -v` to check URL
- Regenerate token, update remote

**"HubSpot connection failed"**
- API key invalid or revoked
- Regenerate from HubSpot settings
- Verify scopes are correct

**"Voice not working"**
- Groq or ElevenLabs key invalid
- Check free tier limits (might be rate-limited)
- Regenerate keys

**"Dashboard not loading"**
- Vercel env vars not set
- GitHub token missing
- Run: `vercel env pull` to sync local

---

## 📋 Checklist for New Clawd

Print this and check off as you go:

```
CREDENTIAL RESTORATION CHECKLIST
================================

Pre-Restoration:
[ ] Have backup file (clawd-workspace-backup-YYYY-MM-DD.tar.gz)
[ ] Have list of all API key sources
[ ] Have Vercel login ready
[ ] Have GitHub login ready

Regenerate (in this order):
[ ] 1. GitHub token (repo: Matweiss/clawd-brain-data)
[ ] 2. HubSpot API key (owner: 728033696)
[ ] 3. Avoma API key
[ ] 4. Groq Whisper API key
[ ] 5. ElevenLabs API key
[ ] 6. Kimi API key

Restore:
[ ] Extract backup: tar -xzf backup.tar.gz
[ ] Run RESTORE-ALL-CREDENTIALS.sh
[ ] Update Vercel env vars (3 variables)
[ ] Restart gateway: openclaw gateway restart

Verify:
[ ] openclaw status (shows all secrets)
[ ] git fetch origin (GitHub working)
[ ] Dashboard loads (https://clawd-brain.vercel.app)
[ ] Voice transcription works
[ ] HubSpot pipeline accessible

Done:
[ ] Memory fully restored
[ ] All integrations connected
[ ] Ready to work!
```

---

## 📞 Questions?

Each credential is documented above with:
- What it does
- Where it's used
- How to regenerate
- Where to update

If anything breaks, refer to the specific section above.

**New Clawd is ready to restore. Just provide the credentials when asked.** 💪
