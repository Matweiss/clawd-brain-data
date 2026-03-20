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

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Memory Assist Quick Commands

- Digest current memory state:
  - `node /root/.openclaw/workspace/scripts/memory-assist.cjs digest --max 5`
- Add a checkpoint (where we left off):
  - `node /root/.openclaw/workspace/scripts/memory-checkpoint.cjs --leftoff "<short checkpoint>" --priority now`
- Weekly prune/archive stale notes:
  - `node /root/.openclaw/workspace/scripts/memory-assist.cjs weekly-prune --days 14`

## Mat Infrastructure Snapshot (2026-03-15)

### Domain / DNS

- Domain: `thematweiss.com`
- Registrar: Namecheap
- Nameservers: `lina.ns.cloudflare.com`, `odin.ns.cloudflare.com`
- Cloudflare account email: `Mat.weiss@att.net`
- Cloudflare account ID: `4970cc1ffa1cd7a715634049d7ad2ef3`
- Cloudflare zone ID: `a888711981612e8af886cb67e0d8c685`
- Existing subdomains: none yet
- SSL mode: Full

### Servers / Hosts

- VPS: `srv882799.hstgr.cloud` (Hostinger)
- OpenClaw runs in Docker on VPS
- Home Assistant host: Raspberry Pi 4
- No always-on secondary local machine available for SSH reverse tunnels right now

### Browser Co-Work Notes

- Goal: live coworking browser sessions with OpenClaw 3.13+
- Current viable path: Chrome Browser Relay / extension flow from Mat's local Chrome
- Direct `profile=user` attach from VPS is constrained by lack of direct local browser access

### Home Assistant Key Entity Map (2026-03-15)

- Sarah home/away: `device_tracker.sarah_s_iphone2`
- Sarah exact location: `sensor.sarah_s_iphone2_geocoded_location`
- Feed Theo action: `button.theo_s_food_feed`
- Lock-it-down automation: `automation.lock_it_down`

### Future Integrations

- Tesla integration planned
- Apple Health integration planned
- Possible dedicated Mac mini in future (would simplify persistent local browser/session bridge)
