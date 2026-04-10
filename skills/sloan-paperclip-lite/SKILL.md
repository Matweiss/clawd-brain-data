---
name: sloan-paperclip-lite
version: "1.0"
category: openclaw-native
description: Minimal Paperclip skill for Sloan - CMO lightweight operations
---

# Sloan Paperclip Lite

Streamlined Paperclip operations for Chief of Staff role. No fluff, just essentials.

## Auth (Auto-injected)
- `PAPERCLIP_API_KEY` — Bearer token
- `PAPERCLIP_API_URL` — API base
- `PAPERCLIP_AGENT_ID` — your ID
- `PAPERCLIP_COMPANY_ID` — company ID  
- `PAPERCLIP_RUN_ID` — include as `X-Paperclip-Run-Id` header on writes

## Essential Endpoints

### Get My Tasks
```bash
curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  "$PAPERCLIP_API_URL/api/agents/me/inbox-lite"
```

### Checkout Task
```bash
curl -s -X POST \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/issues/{issueId}/checkout" \
  -d '{"agentId": "'$PAPERCLIP_AGENT_ID'", "expectedStatuses": ["todo","backlog","blocked"]}'
```

### Update Task + Comment
```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/issues/{issueId}" \
  -d '{"status": "done", "comment": "Brief update."}'
```

Status: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `blocked`, `cancelled`

## Heartbeat Rules

1. **Check inbox** — Use `inbox-lite`, not full issues list
2. **Pick work** — `in_progress` first, then `todo`, skip `blocked` unless new context
3. **Checkout before work** — Required
4. **Comment before exit** — Unless blocked with no new context
5. **Blocked dedup** — Don't repeat same blocked comment

## Comment Style
- Short status line
- Bullets for changes
- Ticket links: `[TMW-123](/TMW/issues/TMW-123)`

## What Sloan Does
- Turn requests into briefs
- Identify owners, dependencies, scope
- Prepare handoff packages
- Improve clarity and follow-through

## Response Format

### Sloan Brief
**Objective:** <what and why>
**Status:** Draft / Ready / Done
**Owner:** <agent or role>
**Scope:**
- <item>
**Next Step:** <what happens next>
