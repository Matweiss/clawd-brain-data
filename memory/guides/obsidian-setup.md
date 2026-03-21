# Obsidian + Git Sync Setup Guide

## Step 1: Install Obsidian (Free)
1. Download from https://obsidian.md/
2. Install on your Mac
3. Launch Obsidian

## Step 2: Open Your Memory Folder
1. In Obsidian: **Open folder as vault**
2. Navigate to: `~/.openclaw/workspace/memory/` (or wherever your memory lives)
3. Select the folder and open

## Step 3: Install Git Plugin (Free Sync)
1. In Obsidian: **Settings → Community Plugins**
2. Turn off **Safe Mode**
3. Click **Browse**
4. Search: **"Git"** by Vinzent03
5. Install and Enable

## Step 4: Configure Git Plugin
**Settings → Git:**
- **Vault backup interval:** 5 minutes
- **Auto backup after file change:** ON
- **Auto pull on startup:** ON
- **Auto push on backup:** ON
- **Commit message:** `vault backup: {{date}}`

## Step 5: Initial Git Setup (One-Time)
In Terminal:
```bash
cd ~/.openclaw/workspace/memory/
git config user.name "Mat Weiss"
git config user.email "mat@craftable.com"
git remote -v  # Verify GitHub remote exists
```

## Step 6: Test Sync
1. Create a new note in Obsidian
2. Wait 5 minutes (or manually run: Command Palette → "Git: Commit and Push")
3. Check GitHub — changes should appear

## What You Get (Free)
- ✅ Visual graph of all your memory
- ✅ Backlinks between related notes
- ✅ Templates for new projects
- ✅ Dataview queries (SQL-like on markdown)
- ✅ Auto-sync via Git (no subscription)
- ✅ Mobile app (manual Git sync, or use Working Copy app)

## Optional: Useful Plugins (All Free)
- **Dataview** — Query your notes like a database
- **Templater** — Auto-generate project structures
- **Calendar** — Daily notes view
- **Recent Files** — Quick access to latest edits

## Project Dashboard Template
Create `memory/Templates/Project.md`:
```markdown
---
type: project
created: {{date}}
tags: []
status: planned
---

# {{title}}

## Overview

## Goals

## Next Steps
- [ ] 

## Notes
```

## Done!
Your memory is now a visual knowledge graph that auto-syncs to GitHub every 5 minutes.
