# Obsidian Memory Sync

## Overview
Your OpenClaw memories (daily logs, long-term MEMORY.md, guides, projects) can be synced to your Obsidian vault in iCloud.

## Location
- **iCloud Drive > Documents > Obsidian Memory**
- Syncs all `.md` files from `/root/.openclaw/workspace/memory/`

## How to Sync

### Manual Sync (Run anytime)
```bash
# From the VPS
/root/.openclaw/workspace/clawd-mission-control-v2/scripts/sync-memories-to-obsidian.sh

# Or via OpenClaw command
sync memories to obsidian
```

### Automatic Nightly Sync
Set up a cron job to sync every night at 2 AM:
```bash
openclaw cron add --name "nightly-memory-sync" \
  --schedule "0 2 * * *" \
  --command "bash /root/.openclaw/workspace/clawd-mission-control-v2/scripts/nightly-memory-sync.sh"
```

## What's Synced
| Source | Destination | Notes |
|--------|-------------|-------|
| `memory/2026-03-21.md` | `Obsidian Memory/2026-03-21.md` | Daily logs |
| `memory/guides/*.md` | `Obsidian Memory/guides/*.md` | How-to guides |
| `memory/projects/*.md` | `Obsidian Memory/projects/*.md` | Project docs |
| `memory/data/*.json` | `Obsidian Memory/data/*.json` | Structured data |

## File Structure
```
Obsidian Memory/
├── 2026-03-15.md          # Daily memory files
├── 2026-03-16.md
├── 2026-03-19.md
├── guides/
│   ├── gpt4v-auto-video-analyzer.md
│   └── smart-model-router.md
├── projects/
│   └── [project notes]
├── data/
│   └── [JSON data files]
└── .last-sync.md          # Sync timestamp/log
```

## Troubleshooting

### "Source directory not found"
- Ensure the workspace is at `/root/.openclaw/workspace/`
- Check that `memory/` folder exists with daily `.md` files

### Files not appearing in Obsidian
- iCloud sync can take 30-60 seconds
- Check iCloud Drive sync status in System Preferences
- Ensure Obsidian vault path is correct: `iCloud Drive/Documents/Obsidian Memory`

### Permissions issues
- Script must be run as user who owns the iCloud Drive
- On macOS: `chmod +x sync-memories-to-obsidian.sh`

## Future Enhancements
- [ ] Real-time sync via file watchers
- [ ] Bidirectional sync (Obsidian → Workspace)
- [ ] Tag-based filtering
- [ ] Selective sync (only specific memory types)
