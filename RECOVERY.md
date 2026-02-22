# RECOVERY.md - Container Restart Runbook

**Last Backup:** 2026-02-22 14:13 UTC  
**Backup File:** `openclaw-critical-20260222-141305.tar.gz`  
**Checksum:** `cbde2715552c837c5942511193eeff9b9f06302f9040c1bad5b61ade4f1bda6c`

---

## Critical Files to Restore

| File | Purpose | Location | Size |
|------|---------|----------|------|
| `openclaw.json` | Gateway config + API keys | `/data/.openclaw/` | ~8KB |
| `google-token.json` | Google OAuth (Calendar/Gmail) | `/data/.openclaw/` | ~2KB |
| `.env.supabase` | Supabase credentials | `/data/.openclaw/workspace/` | ~678B |
| `.vercel-token` | Vercel deployment token | `/data/.openclaw/workspace/` | ~61B |
| `.env.local` | Dashboard env vars | `/data/.openclaw/workspace/clawd-command/` | varies |
| `MEMORY.md` | Long-term memory | `/data/.openclaw/workspace/` | ~9KB |
| `memory/` folder | Daily logs | `/data/.openclaw/workspace/` | ~50KB |

---

## API Keys Stored (Masked)

| Service | Key Name | Location | Status |
|---------|----------|----------|--------|
| HubSpot | `HUBSPOT_TOKEN` | `openclaw.json:env.vars` | ✅ Active |
| Avoma | `AVOMA_API_KEY` | `openclaw.json:env.vars` | ✅ Active |
| Groq/Whisper | `GROK_API_KEY` | `openclaw.json:env.vars` | ✅ Active |
| NVIDIA/Kimi | `NVIDIA_API_KEY` | `openclaw.json:env.vars` | ✅ Active (FREE) |
| Modal | `MODAL_API_KEY` | `openclaw.json:env.vars` | ✅ Active |
| Supabase | URL + keys | `.env.supabase` | ✅ Active |
| Vercel | Deploy token | `.vercel-token` | ✅ Active |
| GitHub | Sync token | `sync-memory-to-github.sh` | ✅ Active |

---

## Recovery Steps (Container Restart)

### 1. Before Shutdown
```bash
# Backup current timestamp
date > /data/.openclaw/workspace/LAST_BACKUP.txt

# Sync memory to GitHub (if haven't done recently)
/data/.openclaw/workspace/scripts/sync-memory-to-github.sh

# Verify backup exists
ls -lh /data/.openclaw/workspace/backups/
```

### 2. After New Container
```bash
# Extract backup
cd /tmp
tar -xzf /path/to/openclaw-critical-20260222-141305.tar.gz

# Verify checksum
sha256sum -c checksums.txt

# Restore to new container
cp openclaw.json /data/.openclaw/
cp google-token.json /data/.openclaw/
cp .env.supabase /data/.openclaw/workspace/
cp .vercel-token /data/.openclaw/workspace/
# ... etc for other files
```

### 3. Restart OpenClaw
```bash
openclaw gateway restart
openclaw status
```

### 4. Verify Telegram Works
- Send message to @clawd
- Should respond normally
- No context loss (memory restored from GitHub)

---

## Gateway Token

**Current Token:** `uBKXXPx3Pz6NuJbZehBIY2a7RF48UE9m`  
(Safe to regenerate on restart if needed)

---

## What Gets Lost (Acceptable)

- Cron job run logs (`.jsonl` files)
- Old session files
- Browser cache/extensions
- Node_modules (can rebuild)

**What's preserved:**
- All memory + context (synced to GitHub)
- All credentials + API keys
- Vercel deployments (stored remotely)
- Supabase database (stored remotely)

---

## Testing Checklist Before Nuke

- [ ] Backup created & checksummed
- [ ] Memory synced to GitHub
- [ ] All credentials documented
- [ ] Telegram working
- [ ] Dashboards accessible (if using)
- [ ] Cron jobs configured
- [ ] Ready to test minimal operation

---

## Notes

- Gateway token can be regenerated (will require re-pairing Telegram)
- API keys are in `openclaw.json` — **keep this file secure**
- GitHub repo has encrypted backup of sensitive data (if enabled)
- Supabase and Vercel are cloud-hosted — no restoration needed for database/dashboards
