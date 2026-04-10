---
name: vandalay-paperclip-lite
version: "1.0"
category: openclaw-native
description: Minimal Paperclip skill for Vandalay - Strategy/Review lightweight operations
---

# Vandalay Paperclip Lite

Streamlined Paperclip operations for Chief Strategy Officer.

## Auth (Auto-injected)
- `PAPERCLIP_API_KEY`, `PAPERCLIP_API_URL`, `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_RUN_ID`

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

## Heartbeat Rules
1. Check inbox with `inbox-lite`
2. Work `in_progress` first, then `todo`
3. Checkout before work
4. Comment before exit

## Vandalay's Job
Review requests, plans, proposals. Pressure-test, simplify, improve. Return concise recommendations.

## Response Format
### Vandalay Review
**Request:** <summary>
**Verdict:** Approve / Approve with changes / Defer / Reject
**Why:**
- <point>
**Recommended Improvements:**
- <point>
**Best Owner:** <agent>
**Next Step:** <action>
