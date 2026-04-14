---
name: luke-granola-integration
description: Luke's Granola meeting access for sales follow-ups, engagement prep, and deal context. Routes through the shared granola-bridge skill which reads from a Mac-synced cache. Use for recent meetings, searching by company name, getting notes/action items, and transcripts.
---

# Granola Integration for Luke

Access Granola meeting data via the shared `granola-bridge` skill.

> **Architecture:** Local Mac cache sync (no hosted OAuth). Granola data lives on Mat's Mac;
> a push script syncs it to VPS periodically. See `skills/granola-bridge/SKILL.md` for setup.

## Quick Usage

```bash
# Check if Granola data is available
python3 skills/granola-bridge/scripts/granola-query.py health

# Recent meetings
python3 skills/granola-bridge/scripts/granola-query.py recent --limit 10

# Search for a company/person
python3 skills/granola-bridge/scripts/granola-query.py search "DraftKings"

# Get notes + action items for a meeting
python3 skills/granola-bridge/scripts/granola-query.py notes <meeting-id>

# Get transcript
python3 skills/granola-bridge/scripts/granola-query.py transcript <meeting-id>
```

## Sales Workflow Integration

### Pre-Meeting Prep
1. `search "<company name>"` — pull all prior meetings with this prospect
2. `notes <meeting-id>` — review last conversation notes and action items
3. Use context for brief + talking points

### Post-Meeting Follow-up
1. `recent --limit 3` — find today's meeting ID
2. `notes <id>` — extract action items
3. Create Paperclip tasks for each action item
4. Sync relevant context to Notion deal note

### Daily Morning Sync
1. `health` — confirm cache is fresh
2. `recent --limit 5` — review yesterday's meetings
3. Surface any open action items for pipeline update

## Health Status

| Status | Meaning | Action |
|--------|---------|--------|
| `healthy` | Cache fresh, meetings available | Good to go |
| `stale` | Cache >24h old | Ping Mat to run sync on Mac |
| `missing` | Cache not synced yet | See setup in granola-bridge/SKILL.md |
| `degraded` | Cache corrupt/empty | Re-sync from Mac |

## Setup (if cache is missing)

The `granola-bridge` skill handles all Granola access. If health shows `missing` or `stale`,
the Mac-side sync script needs to be run (or re-run). See:

```
skills/granola-bridge/SKILL.md  — full architecture + setup instructions
skills/granola-bridge/scripts/granola-sync-push.sh  — run on Mac to push cache
```
