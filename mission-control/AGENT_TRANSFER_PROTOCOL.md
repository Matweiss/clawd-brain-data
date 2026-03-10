# Mission Control: Agent Transfer Protocol

## 🔄 AGENT TRANSFER PROCEDURE

When transferring to a new agent, follow this checklist:

### Phase 1: Preparation (You - Mat)

- [ ] Generate GitHub Personal Access Token:
  - Go to https://github.com/settings/tokens
  - Generate new token (classic)
  - Select `repo` scope ONLY
  - Copy token (starts with `ghp_`)

- [ ] Collect other tokens (if available):
  - [ ] Vercel token (optional - new agent can use own account)
  - [ ] Home Assistant Long-Lived Access Token
  - [ ] ElevenLabs API key (optional)

- [ ] Verify backup is current:
  - [ ] `COMPLETE_AGENT_TRANSFER.md` exists
  - [ ] `AGENT_HANDOFF.md` exists
  - [ ] Chat history exported
  - [ ] All commits pushed to GitHub

### Phase 2: Secure Transfer

- [ ] Send GitHub token securely (NOT email):
  - Signal message
  - iMessage
  - Encrypted note
  - In-person

- [ ] Provide this document: `COMPLETE_AGENT_TRANSFER.md`

- [ ] Confirm new agent has:
  - [ ] GitHub token
  - [ ] This document
  - [ ] Access to `clawd-brain-data` repo

### Phase 3: New Agent Activation

New agent completes:

- [ ] Clones repo with token
- [ ] Creates `.env` file
- [ ] Reads `COMPLETE_AGENT_TRANSFER.md`
- [ ] Reads `AGENT_HANDOFF.md`
- [ ] Reads `SOUL.md`
- [ ] Reviews chat history
- [ ] Tests GitHub access
- [ ] Tests Google OAuth
- [ ] Pairs Telegram (Mat approves)
- [ ] Tests Home Assistant
- [ ] Creates activation memory entry

### Phase 4: Go Live

- [ ] New agent sends first message to Mat
- [ ] Mat confirms transfer complete
- [ ] Old agent (me) signs off
- [ ] New agent assumes CLAWD Prime role

---

## 📋 QUICK REFERENCE

### Token Generation Links

| Service | URL | Scope Needed |
|---------|-----|--------------|
| GitHub | https://github.com/settings/tokens | `repo` |
| Vercel | https://vercel.com/account/tokens | Full access |
| ElevenLabs | https://elevenlabs.io/app/settings/api-keys | API access |

### Critical Files to Transfer

```
REQUIRED:
├── COMPLETE_AGENT_TRANSFER.md (this procedure)
├── AGENT_HANDOFF.md (system overview)
├── SOUL.md (personality)
├── MEMORY.md (curated memories)
├── TOOLS.md (API reference)
└── memory/chat_history_*.md (context)

OPTIONAL:
├── new-agent-setup.sh (automation)
├── restore-agent.sh (verification)
└── BACKUP_MANIFEST.md (full docs)
```

---

## 🚨 SECURITY NOTES

1. **Never email tokens** - Use secure messaging
2. **Tokens in .env only** - Never commit to GitHub
3. **Rotate tokens after transfer** - Regenerate if concerned
4. **Revoke old tokens** - After successful transfer

---

## ✅ TRANSFER VERIFICATION

New agent should be able to:
- [ ] Read private GitHub repos
- [ ] Access Mat's Google Calendar
- [ ] Send Telegram messages
- [ ] Read Home Assistant sensors
- [ ] Understand Mat's preferences
- [ ] Know current priorities

---

*Last updated: March 10, 2026*  
*Status: Ready for transfer*
