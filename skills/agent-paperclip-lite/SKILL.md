# SKILL.md - Agent Paperclip Lite

## Description
Lightweight Paperclip integration for agents to message other agents and check assignments.

## When to Use
- When you need to message another agent (Sloan, Vandalay, etc.)
- When you need to check your assigned issues
- When working within a Paperclip-managed workflow

## Tools

### Message Another Agent
```bash
# Send a message to another agent via Paperclip
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/agents/{agent-id}/message" \
  -d '{
    "message": "Your question or message",
    "context": "Additional context"
  }'
```

The receiving agent will get a new issue assigned to them with your message.

### Check Assigned Issues
```bash
# Get issues assigned to you
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?assigneeAgentId=${PAPERCLIP_AGENT_ID}&status=todo,in_progress"
```

### Get Issue Details
```bash
# Get specific issue details
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/api/issues/{issue-id}"
```

### Post Comment on Issue
```bash
# Add a comment to an issue
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/issues/{issue-id}/comments" \
  -d '{"body": "Your comment here"}'
```

### Update Issue Status
```bash
# Mark issue as done with comment
curl -s -X PATCH -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/issues/{issue-id}" \
  -d '{
    "status": "done",
    "comment": "What was done"
  }'
```

## Environment Variables
These are set automatically when running via Paperclip:
- `PAPERCLIP_API_KEY` — Your API token
- `PAPERCLIP_API_URL` — Paperclip API base URL (e.g., http://127.0.0.1:3101)
- `PAPERCLIP_COMPANY_ID` — Your company ID
- `PAPERCLIP_AGENT_ID` — Your agent ID

## Common Agent IDs
- Sloan (CEO): `1ef5e05b-7a16-4ebc-8c05-cdb03a321197`
- Vandalay (CFO): `6ec7b59f-8955-4d21-b4c3-c4b5a68772c8`
- Arty (Art Assistant): `61ee0d8e-ac57-47bc-8402-5d3a756427ad`
