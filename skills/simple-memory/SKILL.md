# Simple Memory

Reliable local memory using a JSONL store.

## Tools

### memory_add
Add a memory entry.

**Parameters**
- `content` (string, required): memory text
- `metadata` (object, optional): extra fields

### memory_search
Search memory entries with simple text matching.

**Parameters**
- `query` (string, required): search text
- `limit` (number, optional): max results, default 5

## Notes
- Storage file: `~/.openclaw/workspace/memory/store/memories.jsonl`
- Backend: local JSONL, no external services
