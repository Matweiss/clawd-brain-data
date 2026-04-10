# TOOLS.md - Luke's Integrations

## Google Workspace (gog CLI)

**Account:** mat.weiss@lucrasports.com

### Gmail
```bash
# Search recent prospect emails
gog gmail messages search "in:inbox from:@prospect.com newer_than:7d" --account mat.weiss@lucrasports.com

# Send follow-up
gog gmail send --to prospect@company.com --subject "Following up on our conversation" --body-file ./followup.txt --account mat.weiss@lucrasports.com

# Create draft
gog gmail drafts create --to prospect@company.com --subject "Lucra proposal" --body-file ./proposal.txt --account mat.weiss@lucrasports.com
```

### Calendar
```bash
# List today's meetings
gog calendar events primary --from $(date -I)T00:00:00 --to $(date -I)T23:59:59 --account mat.weiss@lucrasports.com

# Create prep reminder
gog calendar create primary --summary "Prep: Call with [Company]" --from "2026-04-11T13:00:00" --to "2026-04-11T13:30:00" --account mat.weiss@lucrasports.com
```

### Sheets (CRM)
```bash
# Get pipeline data
gog sheets get <SHEET_ID> "Pipeline!A1:H50" --json --account mat.weiss@lucrasports.com

# Update deal stage
gog sheets update <SHEET_ID> "Pipeline!D5" --values-json '[["Stage 3 - Proposal"]]' --input USER_ENTERED --account mat.weiss@lucrasports.com

# Append new deal
gog sheets append <SHEET_ID> "Pipeline!A:H" --values-json '[["Company","Stage","Amount","Close Date","Last Contact","Notes","Next Action"]]' --insert INSERT_ROWS --account mat.weiss@lucrasports.com
```

## Granola

**API Docs:** https://docs.granola.ai/help-center/sharing/integrations/integrations-with-granola

**MCP (Model Context Protocol):** Connect Granola to Claude for querying meeting notes

**Enterprise API:** Available for workspace-wide notes access

```bash
# Query recent meetings (via MCP or API)
# Requires: GRANOLA_API_KEY environment variable

# Get meetings from last 7 days
curl -s "https://api.granola.ai/v1/meetings?since=$(date -d '7 days ago' -I)" \
  -H "Authorization: Bearer $GRANOLA_API_KEY"

# Get specific meeting transcript
curl -s "https://api.granola.ai/v1/meetings/<MEETING_ID>/transcript" \
  -H "Authorization: Bearer $GRANOLA_API_KEY"
```

## Notion

**API Docs:** https://developers.notion.com

```bash
# Search databases
curl -s -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"query": "Battle Cards", "filter": {"value":"database","property":"object"}}'

# Query database
curl -s -X POST "https://api.notion.com/v1/databases/<DB_ID>/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property":"Company","title":{"contains":"DraftKings"}}}'

# Create page
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "<DB_ID>"},
    "properties": {
      "Name": {"title": [{"text": {"content": "Meeting Notes: Company X"}}]},
      "Date": {"date": {"start": "2026-04-11"}},
      "Attendees": {"rich_text": [{"text": {"content": "John Doe, Jane Smith"}}]}
    }
  }'
```

## Paperclip

**API:** https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538

```bash
# Create task for follow-up
curl -s -X POST "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up with [Company]",
    "description": "Send proposal and schedule demo",
    "assigneeAgentId": "<LUKE_AGENT_ID>",
    "status": "todo",
    "dueDate": "2026-04-12"
  }'
```

## Environment Variables Needed

```bash
# Google (via gog - already configured)
export GOG_KEYRING_PASSWORD=clawd

# Granola
export GRANOLA_API_KEY="grl_..."

# Notion
export NOTION_API_KEY="secret_..."
export NOTION_WORKSPACE_ID="..."

# Paperclip (inherited from adapter config)
export PAPERCLIP_API_KEY="..."
export PAPERCLIP_API_URL="http://127.0.0.1:3100"
export PAPERCLIP_COMPANY_ID="b453f88c-22e0-4521-8843-8427a4e20538"
```
