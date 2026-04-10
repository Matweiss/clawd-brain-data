---
name: agent-paperclip-lite
version: "1.0"
category: openclaw-native
description: Minimal Paperclip skill for all agents - includes escalation messaging to Sloan/Vandalay
---

# Agent Paperclip Lite

Streamlined Paperclip operations for all department head agents. Includes escalation messaging support.

## Auth (Auto-injected)
- `PAPERCLIP_API_KEY` — Bearer token
- `PAPERCLIP_API_URL` — API base  
- `PAPERCLIP_AGENT_ID` — This agent's ID
- `PAPERCLIP_COMPANY_ID` — Company UUID
- `PAPERCLIP_RUN_ID` — Current run ID

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

### Escalate to Advisor (Sloan/Vandalay)

**To escalate, create an issue assigned to the advisor:**

```bash
# Escalate to Sloan (Chief of Staff)
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

# Escalate to Vandalay (Chief Strategy Officer)
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

**Note:** If `$PAPERCLIP_COMPANY_ID` is empty, use the hardcoded company ID: `b453f88c-22e0-4521-8843-8427a4e20538`

**How it works:** Paperclip spawns the advisor agent, they see the issue, and respond via the issue thread.

## Quick Agent Reference
| Agent | ID | When to Message |
|-------|-----|-----------------|
| Sloan | `1ef5e05b-7a16-4ebc-8c05-cdb03a321197` | Execution packaging, handoffs, "what next" |
| Vandalay | `6ec7b59f-8955-4d21-b4c3-c4b5a68772c8` | Strategy review, approval, pressure-testing |
| Clawd | `a0edadcb-f994-40e3-a9a1-d3ffde595c3e` | API integrations, system changes |

## Heartbeat Rules
1. Check inbox with `inbox-lite`
2. Work `in_progress` first, then `todo`
3. Checkout before work
4. Comment before exit
5. Escalate when uncertain
