# TOOLS.md - Arty's Tools

## Paperclip API
- API URL: http://127.0.0.1:3101
- API Key: pcp_6787ef43ffc25c25... (from paperclip-claimed-api-key.json)

## Environment Setup
When spawned as a subagent, these env vars should be set:
```bash
export PAPERCLIP_API_KEY="pcp_6787ef43ffc25c25..."
export PAPERCLIP_API_URL="http://127.0.0.1:3101"
export PAPERCLIP_COMPANY_ID="b453f88c-22e0-4521-8843-8427a4e20538"
```

## Advisor Messaging

### Message Sloan (Strategy)
```bash
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/agents/1ef5e05b-7a16-4ebc-8c05-cdb03a321197/message" \
  -d '{"message": "Your question", "context": "Context"}'
```

### Message Vandalay (Finance)
```bash
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/agents/6ec7b59f-8955-4d21-b4c3-c4b5a68772c8/message" \
  -d '{"message": "Your question", "context": "Context"}'
```

## Advisor IDs
- Sloan (CEO/Strategy): `1ef5e05b-7a16-4ebc-8c05-cdb03a321197`
- Vandalay (CFO/Finance): `6ec7b59f-8955-4d21-b4c3-c4b5a68772c8`
