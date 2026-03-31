# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Google / Gmail (Lucra)

- **Skill:** `gog`
- **Auth:** Always prefix gog commands with `GOG_KEYRING_PASSWORD="clawd2026"`
- **Work email:** `mat.weiss@lucrasports.com` ✅ Active

### Usage Examples

```bash
# Lucra inbox
GOG_KEYRING_PASSWORD="clawd2026" gog gmail search "newer_than:1d" --account mat.weiss@lucrasports.com

# Lucra calendar
GOG_KEYRING_PASSWORD="clawd2026" gog calendar events primary --from 2026-04-01 --to 2026-04-14 --account mat.weiss@lucrasports.com
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
