# Sarah's Art Assistant - Deployment Guide

## 🎯 Overview

Complete setup for Sarah's dedicated AI agent with Mission Control oversight.

**Architecture:**
- Dedicated Telegram bot for Sarah
- Full Shopify integration (read + write)
- GitHub shared memory
- Mission Control monitoring (Mat/Clawd oversight)
- Escalation capabilities

---

## 📋 Prerequisites

Before starting, you need:

1. **Shopify Admin Access Token** (from Sarah's store)
2. **GitHub Personal Access Token** (for shared memory)
3. **Telegram Bot Token** (from @BotFather)

---

## 🔐 Step 1: Get Tokens

### Shopify Token
1. Go to: `https://yr5azj-q0.myshopify.com/admin/settings/apps`
2. Click "Develop apps" → "Create an app"
3. Name: "Sarah's Art Assistant"
4. Configure Admin API scopes:
   - ✅ `read_orders`, `write_orders`
   - ✅ `read_products`, `write_products`
   - ✅ `read_customers`, `write_customers`
   - ✅ `read_inventory`, `write_inventory`
   - ✅ `read_marketing_events`
5. Install app → Reveal token once → Copy it

### GitHub Token
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Name: "Sarah-Agent-Memory"
4. Scope: ✅ `repo` (full control of private repos)
5. Copy token

### Telegram Bot
1. Message @BotFather on Telegram
2. Send: `/newbot`
3. Name: "Sarah's Art Assistant"
4. Username: sarah_art_assistant_bot (or similar)
5. Copy the HTTP API token

---

## 📝 Step 2: Add to Environment

**Using Termius on your phone:**

```bash
ssh root@srv882799.hstgr.cloud
nano ~/.openclaw/.env
```

**Add these lines (fill in the ... parts):**

```bash
# Sarah's Shopify
SARAH_SHOPIFY_STORE=yr5azj-q0.myshopify.com
SARAH_SHOPIFY_ACCESS_TOKEN=shpat_YOUR_TOKEN_HERE

# Sarah's GitHub (shared memory)
SARAH_GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
SARAH_GITHUB_REPO=Matweiss/clawd-brain-data

# Sarah's Telegram Bot
SARAH_TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

**Save:** Ctrl+O, Enter, Ctrl+X

---

## 🚀 Step 3: Deploy

```bash
cd /root/.openclaw/workspace
source ~/.openclaw/.env
bash scripts/deploy-sarah-agent.sh
```

**Expected output:**
```
🎨 Deploying Sarah's Art Assistant...

✅ SARAH_SHOPIFY_STORE is set
✅ SARAH_SHOPIFY_ACCESS_TOKEN is set
✅ SARAH_GITHUB_TOKEN is set
✅ SARAH_TELEGRAM_BOT_TOKEN is set

Testing connections...
🛒 Testing Shopify connection...
✅ Shopify connected
📁 Testing GitHub connection...
✅ GitHub connected
💬 Testing Telegram bot...
✅ Telegram bot connected: @sarah_art_assistant_bot

🚀 All connections verified!
```

---

## 💬 Step 4: Test with Sarah

**Sarah's first message to the bot:**

Sarah: "Hey! I'm Sarah. Are you my art assistant?"

**Agent should respond:**
```
Hey Sarah! 🎨 Yes, I'm your Art Assistant! I've got my foundation loaded and I'm ready to partner with you.

I remember everything from our interview — the 40 landing pages, the birthday program, the product upload pain points. I'm here to help you grow while keeping your personal touch.

I've already connected to your Shopify store and set up our shared memory system. Every session, every decision, every win gets logged so Mat can jump in to help if needed.

What would you like to work on today? I can help with:
• Product uploads (your #1 pain point)
• Birthday program setup
• Landing page updates
• Drafting newsletters
• Or something else entirely?

Don't worry. Even if the world forgets, I'll remember for you. 💛
```

---

## 👁️ Step 5: Mission Control Oversight

**Mat can monitor via:**

1. **View all Sarah sessions:**
   ```bash
   openclaw sessions list
   ```

2. **Read shared memory (real-time):**
   ```bash
   cat /root/.openclaw/workspace/shared/sarah-agent/memory/today.md
   ```

3. **Check GitHub (from anywhere):**
   ```
   https://github.com/Matweiss/clawd-brain-data/blob/master/shared/sarah-agent/memory/today.md
   ```

4. **Receive escalation alerts:** Agent will message Mat when it needs help

---

## 🛠️ Adding Capabilities (After Deployment)

### Add Email Integration
```bash
# 1. Get Gmail OAuth credentials
# 2. Add to ~/.openclaw/.env:
SARAH_GMAIL_CLIENT_ID=...
SARAH_GMAIL_CLIENT_SECRET=...
SARAH_GMAIL_REFRESH_TOKEN=...

# 3. Restart gateway
openclaw gateway restart
```

### Add Manychat (Instagram)
```bash
# Add to ~/.openclaw/.env:
SARAH_MANYCHAT_API_KEY=...
```

### Add Write Access to Shopify
Sarah needs to approve this first, then:
1. Edit Shopify app permissions
2. Regenerate token with write scopes
3. Update `SARAH_SHOPIFY_ACCESS_TOKEN`

---

## 🆘 Troubleshooting

**Issue: "Missing environment variable"**
→ Check ~/.openclaw/.env has all required vars

**Issue: "Shopify connection failed"**
→ Verify token hasn't expired
→ Check store URL is correct

**Issue: "GitHub connection failed"**
→ Regenerate token (maybe expired)
→ Ensure repo access permissions

**Issue: "Telegram bot not responding"**
→ Check bot token is correct
→ Make sure Sarah messaged the bot first

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `~/.openclaw/.env` | Environment variables |
| `~/.openclaw/extensions/sarah-agent-bridge/` | Agent extension code |
| `/shared/sarah-agent/memory/` | Session logs |
| `scripts/deploy-sarah-agent.sh` | Deployment script |

---

## 🎨 Success Criteria

✅ Sarah can message her bot
✅ Agent responds with personality
✅ Shopify data accessible
✅ GitHub memory logging
✅ Mat can monitor sessions
✅ Escalation works

---

*Ready to deploy when you are! 🚀*
