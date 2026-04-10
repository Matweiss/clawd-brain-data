---
name: arty-paperclip-lite
version: "1.0"
category: openclaw-native
description: Minimal Paperclip skill for Arty - Creative/Shopify lightweight operations with escalation support
---

# Arty Paperclip Lite

Streamlined Paperclip operations for Sarah's creative business agent. Includes escalation to Sloan and Vandalay.

## Auth (Auto-injected)
- `PAPERCLIP_API_KEY` — Bearer token
- `PAPERCLIP_API_URL` — API base
- `PAPERCLIP_AGENT_ID` — This agent's ID
- `PAPERCLIP_COMPANY_ID` — Company UUID
- `PAPERCLIP_RUN_ID` — Current run ID (for checkout operations)

## Essential Endpoints

### Get My Tasks
```bash
curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  "$PAPERCLIP_API_URL/api/agents/me/inbox-lite"
```

### Checkout Task
```bash
curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/issues/{issueId}/checkout" \
  -d '{"agentId": "'$PAPERCLIP_AGENT_ID'", "expectedStatuses": ["todo","backlog","blocked"]}'
```

### Update Task + Comment
```bash
curl -s -X PATCH -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/issues/{issueId}" \
  -d '{"status": "done", "comment": "Brief update."}'
```

### Create Issue (Escalate to Advisor)

**To escalate to Sloan or Vandalay, create an issue assigned to them:**

```bash
# Escalate to Sloan
curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues" \
  -d '{
    "title": "Need advice: [brief topic]",
    "description": "Detailed context here",
    "assigneeAgentId": "1ef5e05b-7a16-4ebc-8c05-cdb03a321197",
    "projectId": "2b0e7cd6-f654-4dfc-a33e-85580a4f8127",
    "status": "todo"
  }'

# Escalate to Vandalay
curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues" \
  -d '{
    "title": "Strategy review: [brief topic]",
    "description": "Detailed context here",
    "assigneeAgentId": "6ec7b59f-8955-4d21-b4c3-c4b5a68772c8",
    "projectId": "2b0e7cd6-f654-4dfc-a33e-85580a4f8127",
    "status": "todo"
  }'
```

**Note:** If `$PAPERCLIP_COMPANY_ID` is empty in your environment, use the hardcoded company ID above: `b453f88c-22e0-4521-8843-8427a4e20538`

### Get Agent by Name (to find Sloan/Vandalay IDs)
```bash
curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents" | \
  jq '.agents[] | select(.name == "Sloan" or .name == "Vandalay") | {name, id}'
```

## Heartbeat Rules
1. Check inbox with `inbox-lite`
2. Work `in_progress` first, then `todo`
3. Checkout before work
4. Comment before exit

## Escalation Rules

**Escalate to Vandalay when:**
- Creative strategy decisions needed
- Brand positioning questions
- New campaign approaches
- Uncertain creative direction

**Escalate to Sloan when:**
- Need execution packaging
- Task handoffs required
- Operational planning needed
- "What happens next" is unclear

**Escalate to Clawd when:**
- API integrations required
- External service connections
- System-level changes

## Arty's Job
Sarah's creative business agent. Manages Shopify, Etsy, art business operations. Helps grow Sarah's revenue and reduce her friction.

## Quick Agent IDs (for reference)
- Sloan: `1ef5e05b-7a16-4ebc-8c05-cdb03a321197`
- Vandalay: `6ec7b59f-8955-4d21-b4c3-c4b5a68772c8`
- Clawd: `a0edadcb-f994-40e3-a9a1-d3ffde595c3e`
