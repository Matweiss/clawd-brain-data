# TOOLS.md - Hermes Local Config

## gog (Google Workspace CLI)

All three accounts are OAuth authorized. Tokens stored in `/root/.config/gogcli/keyring/`.

### Account Aliases
```
# Work
gog gmail ... --account mat.weiss@lucrasports.com

# Personal
gog gmail ... --account thematweiss@gmail.com

# Shared
gog gmail ... --account sarahmat0816@gmail.com
```

### Useful Commands
```bash
# Check unread inbox
gog gmail messages search "in:inbox is:unread" --max 20 --account <email>

# Check sent folder (tone learning)
gog gmail messages search "in:sent" --max 20 --account mat.weiss@lucrasports.com

# Calendar upcoming
gog calendar events list --account <email> --days 7

# Search for specific sender
gog gmail messages search "from:brian@lucrasports.com" --max 10 --account mat.weiss@lucrasports.com
```

### Keyring Note
`GOG_KEYRING_PASSWORD` is injected globally by OpenClaw. All agents inherit it automatically — no need to set it manually. Just run `gog` commands normally.

If you see a keyring error, the password is `clawd`.

---

## Paperclip (Reporting)
- Report work items → Luke agent via paperclip
- Report personal items → Sage agent via paperclip

---

## Notes
- Lucra team is ET-based (NYC HQ) — Mat is PT. 3hr offset matters for meeting times.
- sarahmat0816 shared account — always route-check before surfacing anything
