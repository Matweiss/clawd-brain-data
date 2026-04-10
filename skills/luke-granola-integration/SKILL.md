---
name: luke-granola-integration
description: Integration with Granola AI for meeting notes and transcription
---

# Granola Integration for Luke

## Overview

Granola is an AI notepad that transcribes meetings and generates enhanced notes. This skill enables Luke to access meeting transcripts and sync them to the sales workflow.

## Prerequisites

1. **Granola Account:** Mat needs Granola installed (macOS/Windows/iPhone)
2. **API Access:** Enterprise API key or MCP (Model Context Protocol) setup
3. **Environment Variable:** `GRANOLA_API_KEY`

## Setup

### Option 1: Enterprise API (Full Workspace Access)

Contact Granola for Enterprise API access: https://granola.ai/enterprise

### Option 2: MCP (Model Context Protocol)

Connect Granola to Claude via MCP for querying notes:
https://docs.granola.ai/help-center/sharing/integrations/granola-mcp

## API Usage

### List Recent Meetings
```bash
curl -s "https://api.granola.ai/v1/meetings?limit=20" \
  -H "Authorization: Bearer $GRANOLA_API_KEY"
```

### Get Meeting Details
```bash
curl -s "https://api.granola.ai/v1/meetings/<MEETING_ID>" \
  -H "Authorization: Bearer $GRANOLA_API_KEY"
```

### Get Transcript
```bash
curl -s "https://api.granola.ai/v1/meetings/<MEETING_ID>/transcript" \
  -H "Authorization: Bearer $GRANOLA_API_KEY"
```

### Search Meetings
```bash
curl -s "https://api.granola.ai/v1/meetings/search?q=DraftKings" \
  -H "Authorization: Bearer $GRANOLA_API_KEY"
```

## Workflow Integration

### Daily Sync
1. Query meetings from last 24 hours
2. Identify sales-related calls
3. Extract action items
4. Sync to Notion deal notes
5. Update pipeline in Sheets

### Pre-Meeting
1. Search Granola for previous meetings with this company
2. Pull relevant context
3. Include in prep brief

### Post-Meeting
1. Get transcript (usually available within minutes)
2. Extract key decisions and next steps
3. Create follow-up tasks
4. Update CRM

## Data Structure

```json
{
  "id": "mtg_abc123",
  "title": "Call with DraftKings",
  "started_at": "2026-04-10T14:00:00Z",
  "ended_at": "2026-04-10T14:30:00Z",
  "participants": ["Mat Weiss", "John Doe"],
  "transcript": {
    "segments": [
      {"speaker": "Mat", "text": "...", "timestamp": "..."},
      {"speaker": "Them", "text": "...", "timestamp": "..."}
    ]
  },
  "enhanced_notes": "...",
  "action_items": ["Send proposal", "Schedule demo"]
}
```

## Zapier Alternative

If API is not available, use Zapier to sync Granola → Notion:
https://docs.granola.ai/help-center/sharing/integrations/zapier
