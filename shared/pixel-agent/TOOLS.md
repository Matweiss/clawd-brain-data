# TOOLS.md - Pixel Local Config

## Browser: chrome-devtools MCP (via Mac node)

Routes through Mat's MacBook Pro node via OpenClaw node bridge.

```bash
# Health check
mcporter list
# Must show: chrome-devtools (29 tools, healthy)

# Node status check
openclaw nodes status
# Must show: Mat's MacBook Pro — connected
```

### Key chrome-devtools commands
```bash
# Navigate to URL
mcporter call chrome-devtools.navigate_page url="https://example.com"

# Take accessibility snapshot (main tool for parsing)
mcporter call chrome-devtools.take_snapshot

# Click element by uid
mcporter call chrome-devtools.click uid="<uid>"

# Wait / sleep between actions
sleep 2
```

**UID note:** UIDs change on every page load. Always take_snapshot first to find current UIDs before clicking.

---

## Target URLs

| Site | URL |
|------|-----|
| CorePower Yoga home | https://www.corepoweryoga.com/ |
| CorePower schedules | https://www.corepoweryoga.com/yoga-schedules |
| Regal Sherman Oaks | https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483 |

---

## CorePower "Main" Filter Details

- Filter name: **Main**
- Studios included: **Encino** + **Sherman Oaks**
- Class types Mat watches: Yoga Sculpt (YS), C2, Hot Power Fusion
- The favorites heart icon + "Main" label is in the top-left filter area
- Dropdown shows: "Main" | "Edit favorites"

---

## Output File Paths

| File | Purpose |
|------|---------|
| `/root/.openclaw/workspace/clawd-mission-control-v2/data/schedule-current.json` | Mission Control dashboard (primary) |
| `/root/.openclaw/workspace/clawd-mission-control-v2/memory/data/schedule-current.md` | Human-readable memory |
| `/root/.openclaw/workspace/shared/pixel-agent/memory/errors/YYYY-MM-DD.md` | Error logs |

---

## Git (Mission Control repo)

```bash
cd /root/.openclaw/workspace/clawd-mission-control-v2
git add data/schedule-current.json memory/data/schedule-current.md
git commit -m "chore: schedule update <window> <date>"
git push origin main
```

Repo remote: https://github.com/Matweiss/clawd-mission-control (check with `git remote -v`)

---

## Warm-State Helper

```bash
python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/warm_state_manager.py --refresh
```

What it does:
- checks raw CDP on port 28800
- ensures CorePower + Regal tabs exist
- refreshes both targets to keep browser state warm before scrape windows
- records tab ids + last warm check in `memory/heartbeat-state.json`

## Notes

- Mac node connects via VPS gateway — no SSH tunnel needed (OpenClaw handles routing)
- If chrome-devtools shows 0 tools or error, the Mac Chrome remote debugging may need restart
- CorePower requires no login for schedule viewing (public page)
- Regal direct theater URL is more reliable than navigating from theatres list
