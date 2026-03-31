# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Home Assistant

- **Skill:** `home-assistant-advanced` (use for all HA interactions)
- **Host:** Raspberry Pi 4 (Nabu Casa cloud relay)
- **HA_URL:** Set in openclaw.json env ✅
- **HA_TOKEN:** Set in openclaw.json env ✅

### Key Entities

| Entity | What it is |
|--------|-----------|
| `button.theo_s_food_feed` | Theo's automatic feeder button — press to dispense food |
| `device_tracker.sarah_s_iphone2` | Sarah's iPhone location tracker (`home` / `not_home`) |
| `automation.lock_it_down` | Lock-it-down automation (locks doors, secures house) |

### Quick Reference

```bash
# Feed Theo
curl -X POST $HA_URL/api/services/button/press \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "button.theo_s_food_feed"}'

# Check if Sarah is home
curl $HA_URL/api/states/device_tracker.sarah_s_iphone2 \
  -H "Authorization: Bearer $HA_TOKEN"

# Trigger lock-it-down
curl -X POST $HA_URL/api/services/automation/trigger \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.lock_it_down"}'
```

## Google / Gmail

- **Skill:** `gog`
- **Auth:** Always prefix gog commands with `GOG_KEYRING_PASSWORD="clawd2026"`

### Accounts

| Account | Purpose | Status |
|---------|---------|--------|
| `thematweiss@gmail.com` | Mat's personal inbox + calendar | ✅ Active |
| `sarahmat0816@gmail.com` | Shared Mat+Sarah account (joint calendar, CorePower, etc.) | ✅ Active |

### Usage Examples

```bash
# Mat's personal email
GOG_KEYRING_PASSWORD="clawd2026" gog gmail search "newer_than:1d" --account thematweiss@gmail.com

# Shared calendar (joint events)
GOG_KEYRING_PASSWORD="clawd2026" gog calendar events primary --from 2026-04-01 --to 2026-04-07 --account sarahmat0816@gmail.com

# Mat's personal calendar
GOG_KEYRING_PASSWORD="clawd2026" gog calendar events primary --from 2026-04-01 --to 2026-04-07 --account thematweiss@gmail.com
```

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

---

Add whatever helps you do your job. This is your cheat sheet.
