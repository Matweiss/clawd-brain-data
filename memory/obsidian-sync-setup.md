# Obsidian Memory Sync

## Overview
Your OpenClaw memories (daily logs, long-term MEMORY.md, guides, projects) can be synced to your Obsidian vault.

## Your Setup
- **Obsidian vault location:** `/Users/mat/Documents/obsidian-memory`
- **Workspace location:** VPS at `/root/.openclaw/workspace/memory/`

Since these are on different machines, you have **three options** for syncing:

---

## Option 1: Mount VPS to Mac (Recommended)
Mount the VPS workspace folder on your Mac, then run sync locally.

### Setup
```bash
# On your Mac - mount VPS workspace
mkdir -p ~/mnt/vps-workspace
sshfs root@srv882799.hstgr.cloud:/root/.openclaw/workspace ~/mnt/vps-workspace

# Set environment variable
export SOURCE_DIR=~/mnt/vps-workspace/memory
export OBSIDIAN_MEMORY_DIR=/Users/mat/Documents/obsidian-memory

# Run sync
~/mnt/vps-workspace/clawd-mission-control-v2/scripts/sync-memories-to-obsidian.sh
```

### Pros
- Fast, runs on your Mac
- Direct access to Obsidian folder
- No SSH key setup needed on VPS

### Cons
- Requires SSHFS installed (`brew install sshfs`)
- Mount must be active to sync

---

## Option 2: SSH from VPS to Mac
Run the sync script on the VPS and push files to your Mac via SSH.

### Setup
```bash
# On your Mac - enable SSH if not already
# System Preferences > Sharing > Remote Login

# Copy your Mac's SSH public key to VPS
# (so VPS can SSH to Mac without password)

# On VPS, set environment variables
export OBSIDIAN_SSH_HOST=your-mac-ip-or-hostname
export OBSIDIAN_SSH_USER=mat
export OBSIDIAN_MEMORY_DIR=/Users/mat/Documents/obsidian-memory

# Run sync
/root/.openclaw/workspace/clawd-mission-control-v2/scripts/sync-memories-to-obsidian.sh
```

### Pros
- Runs automatically on VPS
- Can use with cron for nightly sync

### Cons
- Requires SSH key setup
- Mac must be online and reachable
- Firewall/router may block incoming SSH

---

## Option 3: Manual Copy (Simplest)
Just copy the files manually when you want to update Obsidian.

```bash
# On VPS - create a tar archive
cd /root/.openclaw/workspace/memory && tar czf /tmp/memories.tar.gz .

# Download to Mac
scp root@srv882799.hstgr.cloud:/tmp/memories.tar.gz ~/Downloads/

# Extract to Obsidian
cd /Users/mat/Documents/obsidian-memory
tar xzf ~/Downloads/memories.tar.gz
```

---

## Option 4: Syncthing / Dropbox / etc.
Set up a file sync tool between VPS and Mac.

Example with Syncthing:
1. Install Syncthing on VPS and Mac
2. Share `~/workspace/memory` folder
3. Sync to `/Users/mat/Documents/obsidian-memory`
4. Set up ignore patterns for `.git`, etc.

---

## What's Synced

| Source (VPS) | Destination (Mac) | Notes |
|--------------|-------------------|-------|
| `memory/2026-03-21.md` | `obsidian-memory/2026-03-21.md` | Daily logs |
| `memory/guides/*.md` | `obsidian-memory/guides/*.md` | How-to guides |
| `memory/projects/*.md` | `obsidian-memory/projects/*.md` | Project docs |
| `memory/data/*.json` | `obsidian-memory/data/*.json` | Structured data |

---

## File Structure

```
/Users/mat/Documents/obsidian-memory/
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

---

## Quick Start (Option 1 - SSHFS)

```bash
# 1. Install SSHFS on Mac
brew install macfuse sshfs

# 2. Mount VPS workspace
mkdir -p ~/mnt/vps-workspace
sshfs root@srv882799.hstgr.cloud:/root/.openclaw/workspace ~/mnt/vps-workspace

# 3. Run sync (on Mac)
SOURCE_DIR=~/mnt/vps-workspace/memory \
  OBSIDIAN_MEMORY_DIR=/Users/mat/Documents/obsidian-memory \
  bash ~/mnt/vps-workspace/clawd-mission-control-v2/scripts/sync-memories-to-obsidian.sh

# 4. Unmount when done
umount ~/mnt/vps-workspace
```

---

## Troubleshooting

### "Source directory not found"
- Check that `SOURCE_DIR` points to the correct path
- For SSHFS: ensure mount is active (`mount | grep sshfs`)

### Permission denied
- For SSH (Option 2): ensure SSH key is set up for passwordless login
- For local sync: check folder permissions on Obsidian vault

### Files not appearing in Obsidian
- If using iCloud: sync can take 30-60 seconds
- Check that Obsidian vault path is correct
- Restart Obsidian if needed

### SSHFS "Operation not permitted"
- macOS security settings may block SSHFS
- Go to System Preferences > Security & Privacy > allow FUSE

---

## Need Help?

If you want me to set up any of these options, just ask! I can:
- Configure SSH keys for passwordless sync
- Set up SSHFS mounting
- Create a cron job for automatic sync
