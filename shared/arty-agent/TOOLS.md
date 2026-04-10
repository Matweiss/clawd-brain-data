# TOOLS.md - Arty's Tools

## Paperclip API
- API URL: http://127.0.0.1:3101
- API Key: Loaded from paperclip-claimed-api-key.json

## Advisor Messaging

### Message Sloan (Strategy)
```bash
curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/agents/1ef5e05b-7a16-4ebc-8c05-cdb03a321197/message" \
  -d '{"message": "Your question", "context": "Context"}'
```

### Message Vandalay (Finance)
```bash
curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  "$PAPERCLIP_API_URL/api/agents/6ec7b59f-8955-4d21-b4c3-c4b5a68772c8/message" \
  -d '{"message": "Your question", "context": "Context"}'
```
