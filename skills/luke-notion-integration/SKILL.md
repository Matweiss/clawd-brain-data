---
name: luke-notion-integration
description: Notion API integration for deal notes, battle cards, and research
---

# Notion Integration for Luke

## Overview

Notion serves as Luke's knowledge base for:
- Deal research and notes
- Battle cards library
- Meeting notes (synced from Granola)
- Sales playbooks

## Prerequisites

1. **Notion Account:** Mat needs a Notion workspace
2. **Integration:** Create at https://www.notion.so/my-integrations
3. **Environment Variable:** `NOTION_API_KEY`

## Setup

### 1. Create Integration
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: "Luke Sales Assistant"
4. Select workspace
5. Copy "Internal Integration Token"

### 2. Share Databases
For each database Luke needs access to:
1. Open database in Notion
2. Click "..." → "Add connections"
3. Select "Luke Sales Assistant"

## Required Databases

### 1. Deal Research
```
Properties:
- Name (Title)
- Company (Select)
- Industry (Select)
- Funding Stage (Select)
- Key Contacts (Rich Text)
- Notes (Rich Text)
- Last Updated (Date)
- Related Deal (Relation to Pipeline)
```

### 2. Battle Cards
```
Properties:
- Name (Title)
- Vertical (Select: Sports Betting, iGaming, Media, etc.)
- Competitor (Multi-select)
- Key Points (Rich Text)
- Objection Handling (Rich Text)
- Case Studies (Rich Text)
- Last Updated (Date)
```

### 3. Meeting Notes
```
Properties:
- Name (Title)
- Date (Date)
- Company (Relation to Deal Research)
- Attendees (Rich Text)
- Granola Link (URL)
- Summary (Rich Text)
- Action Items (Rich Text)
- Deal Stage (Select)
```

## API Usage

### Search
```bash
curl -s -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"query": "DraftKings"}'
```

### Query Database
```bash
curl -s -X POST "https://api.notion.com/v1/databases/$BATTLE_CARDS_DB_ID/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Vertical",
      "select": {"equals": "Sports Betting"}
    }
  }'
```

### Create Page
```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "$MEETING_NOTES_DB_ID"},
    "properties": {
      "Name": {"title": [{"text": {"content": "Call with DraftKings"}}]},
      "Date": {"date": {"start": "2026-04-10"}},
      "Attendees": {"rich_text": [{"text": {"content": "Mat Weiss, John Doe"}}]},
      "Summary": {"rich_text": [{"text": {"content": "Discussed partnership opportunities..."}}]}
    }
  }'
```

### Update Page
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/$PAGE_ID" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "Action Items": {"rich_text": [{"text": {"content": "1. Send proposal\n2. Schedule demo"}}]}
    }
  }'
```

## Workflow

### Pre-Meeting
1. Search Deal Research for company info
2. Query Battle Cards for relevant vertical
3. Compile into prep brief

### Post-Meeting
1. Create Meeting Notes entry
2. Link to Granola transcript
3. Log action items
4. Update Deal Research if new intel

### Weekly
1. Review Battle Cards for freshness
2. Update competitive intel
3. Archive outdated research
