# Local Memory Tools

Provides reliable local memory tools backed by a JSONL store.

## Tools

### memory_search
Search stored memories with simple text matching.
- **query** (string): What to search for
- **limit** (number, optional): Max results (default: 5)

### memory_add
Add a memory to the local store.
- **content** (string): The memory content
- **metadata** (object, optional): Additional metadata

## Usage

memory_search:0{"query": "What did we decide about memory?", "limit": 5}
memory_add:1{"content": "We replaced the broken Chroma path with JSONL memory.", "metadata": {"topic": "memory", "source": "ops"}}

## Storage

- Backend: local JSONL file
- Storage file: `~/.openclaw/workspace/memory/store/memories.jsonl`
- Notes: This is a pragmatic stable replacement for the previously broken ChromaDB-backed path.
