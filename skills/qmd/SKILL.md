---
name: qmd
description: Local hybrid search for markdown notes and docs. Use when searching notes, finding related content, or retrieving documents from indexed collections.
homepage: https://github.com/tobi/qmd
---

# qmd - Quick Markdown Search

Local search engine for Markdown notes, docs, and knowledge bases. Index once, search fast.

## Installation Status

✅ **INSTALLED** (2026-02-20 04:12 AM EST)
- Version: qmd 1.0.8
- Location: `$HOME/.local/bin/qmd`
- Wrapper: `/home/node/.local/bin/qmd` (calls bun src/qmd.ts)
- Collection: workspace indexed (38 markdown files)

## When to use

- "search my notes / docs / knowledge base"
- "find related notes"
- "retrieve a markdown document from my collection"
- "search local markdown files"

## Default behavior

- **Prefer `qmd search` (BM25)** - instant keyword search, default choice
- Use `qmd vsearch` only when keyword search fails (semantic, can be slow)
- Avoid `qmd query` unless explicitly requested (hybrid + reranking, very slow)

## Quick Commands

```bash
# Export PATH first (required)
export PATH="$HOME/.local/bin:$PATH"

# Search (instant, default)
qmd search "query"
qmd search "query" -n 10           # More results
qmd search "query" --json          # JSON output

# Retrieve full documents
qmd get "path/to/file.md"
qmd get "#docid"

# Maintenance
qmd status                          # Index health
qmd update                          # Re-index changed files
qmd embed                           # Update embeddings (slow)
```

## Collection Setup

**Current collection:**
- Name: `workspace`
- Path: `/data/.openclaw/workspace`
- Mask: `**/*.md`
- Files indexed: 38

**Add more collections:**
```bash
qmd collection add /path/to/notes --name notes --mask "**/*.md"
```

## Search Modes

- **`qmd search`** - BM25 keyword search (instant, reliable)
- **`qmd vsearch`** - Semantic vector search (slow first run, loads local model)
- **`qmd query`** - Hybrid + LLM reranking (slowest, may timeout)

## Performance

- `qmd search`: <1 second (instant)
- `qmd vsearch`: ~1 minute first run (loads Qwen3-1.7B model)
- `qmd query`: Even slower, often timeouts

**Recommendation:** Stick with `qmd search` for 95% of use cases.

## Integration with Memory

- `qmd` searches **local files** (workspace markdown files)
- `memory_search` searches **agent memory** (MEMORY.md + memory/*.md via semantic search)
- **Use both:**
  - `memory_search` - "what did we decide/learn before?"
  - `qmd` - "what's in my notes/docs on disk?"

## Automatic Updates

To keep index fresh, run `qmd update` periodically:

```bash
# Add to cron (hourly updates)
0 * * * * export PATH="$HOME/.local/bin:$PATH" && qmd update
```

## Dependencies

- Bun >= 1.0.0 ✅ Installed (v1.3.9)
- SQLite (for extensions) ✅ Available via brew

## Common Options

- `-n <num>`: number of results
- `-c, --collection <name>`: restrict to a collection
- `--all --min-score <num>`: return all matches above threshold
- `--json` / `--files`: agent-friendly output
- `--full`: return full document content

## Example Searches

```bash
# Find voice integration info
qmd search "voice integration" -n 3

# Search for Sarah's trip
qmd search "Sarah trip New York" -n 2

# Search in specific collection
qmd search "email agent" -c workspace

# Get document by path
qmd get "memory/2026-02-20.md"
```

## Tested Results

✅ Voice integration search: 62% match, found correct file
✅ Sarah trip search: 92% match, found correct context
✅ Fast response: <1 second per query

## Notes

- Models cache in `~/.cache/qmd/models/`
- First `qmd embed` or `vsearch` will download GGUF models
- PATH must include `$HOME/.local/bin` for wrapper to work
