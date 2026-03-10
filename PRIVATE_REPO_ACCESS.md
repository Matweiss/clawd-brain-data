# 🔒 Private Repository Access Guide

## Quick Answer

**YES** - Making the GitHub repo private WILL affect the agent's ability to access it.

**BUT** - It's easily fixed with a Personal Access Token.

---

## How Private Repo Access Works

### Public Repo (No Token Needed)
```bash
git clone https://github.com/Matweiss/clawd-brain-data.git
# ✅ Works for anyone
```

### Private Repo (Token Required)
```bash
# ❌ This won't work:
git clone https://github.com/Matweiss/clawd-brain-data.git
# Error: Repository not found

# ✅ This works with token:
git clone https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git
# Success!
```

---

## Setting Up Access

### Step 1: Generate Token (Mat does this)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Check ✅ `repo` scope
4. Generate and copy token (starts with `ghp_`)
5. Send securely to agent

### Step 2: Agent Uses Token

```bash
# Set token
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Clone private repo
git clone "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git"

# Or configure git to use token
git remote set-url origin "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git"
```

---

## Affected Repos

If you make these private, agent needs token:

| Repo | Purpose | Private OK? |
|------|---------|-------------|
| clawd-brain-data | Memory, docs | ✅ Yes - use token |
| clawd-dashboard | Dashboard code | ✅ Yes - use token |
| clawd-command-center | Mission control | ✅ Yes - use token |
| clawd-mission-control-v2 | Vercel deployment | ✅ Yes - use token |

---

## Security Best Practices

### ✅ DO
- Generate token with MINIMUM scopes needed (`repo` only)
- Send token via secure channel (Signal, iMessage)
- Store token in `.env` file (never commit to Git)
- Rotate tokens periodically
- Revoke old tokens after transfer

### ❌ DON'T
- Email tokens
- Commit tokens to GitHub
- Share tokens in group chats
- Use tokens with excessive scopes

---

## Token Storage

### Agent's `.env` file:
```bash
GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
GITHUB_USER="Matweiss"
GITHUB_EMAIL="mat@craftable.com"
```

### Git configuration:
```bash
# Use token in remote URL
git remote set-url origin "https://Matweiss:${GITHUB_TOKEN}@github.com/Matweiss/clawd-brain-data.git"

# Or use credential helper
git config credential.helper store
git push  # Will prompt for credentials once, then store
```

---

## Vercel Deployment with Private Repo

### If repo is private, Vercel needs access:

**Option 1: Connect GitHub Account**
1. Vercel → Settings → Git Integration
2. Connect GitHub account with repo access
3. Vercel can now read private repos

**Option 2: Deploy Token**
1. Vercel → Project → Settings → Git
2. Use deploy token with repo access

**Option 3: Manual Deploy**
```bash
# Local build with token
npm run build
vercel --prod
```

---

## Troubleshooting

### "Repository not found"
- Token doesn't have `repo` scope
- Token expired
- Wrong repo name

### "Authentication failed"
- Token invalid
- Wrong username
- Token revoked

### "Permission denied"
- Token has insufficient scopes
- Not added as collaborator

---

## Recommendation

**Keep repos private** - Just provide the token to the agent.

**Why:**
- ✅ Better security
- ✅ Controlled access
- ✅ Easy to revoke if needed
- ✅ Standard practice

**The agent will have full access via token** - no functionality lost.

---

## Summary

| Repo Status | Agent Access | Setup Complexity |
|-------------|--------------|------------------|
| Public | Immediate | None |
| Private | Via token | One-time setup |

**Private + Token = Same functionality, better security.**
