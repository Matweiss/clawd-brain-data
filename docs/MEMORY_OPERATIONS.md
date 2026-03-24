# Memory Operations Runbook

## Live Configuration
- Provider: `ollama`
- Base URL: `http://100.94.231.120:11434`
- Model: `nomic-embed-text:latest`
- Vector store: enabled

## Health Check
Run:

```bash
openclaw memory status --deep
```

Healthy output should show, for each workspace:
- `Provider: ollama`
- `Embeddings: ready`
- `Vector: ready`
- `FTS: ready`
- non-zero indexed files/chunks

## Reindex
Run:

```bash
openclaw memory index --force
```

Then verify again:

```bash
openclaw memory status --deep
```

## Gateway Restart
If config changed or memory tools behave unexpectedly:

```bash
openclaw gateway restart
```

Then rerun:

```bash
openclaw memory status --deep
```

## Verify Ollama Endpoint From VPS
```bash
curl http://100.94.231.120:11434/api/tags
```

Healthy output should list `nomic-embed-text:latest`.

## Verify Ollama On Mac
Useful checks on Mac:

```bash
tailscale ip -4
curl http://127.0.0.1:11434/api/tags
launchctl getenv OLLAMA_HOST
pgrep -fl Ollama
```

Expected:
- Ollama running
- `OLLAMA_HOST=0.0.0.0:11434`
- localhost `/api/tags` succeeds

## Failure Modes

### 1) Memory search returns no/poor results
Check:
- `openclaw memory status --deep`
- whether indexed file/chunk counts look sane
- whether the relevant notes actually exist in indexed memory paths

### 2) Embeddings not ready
Check:
- Mac is online
- Tailscale path is up
- VPS can `curl` Mac Ollama endpoint
- model `nomic-embed-text:latest` still installed

### 3) Results are noisy but not empty
This is usually a ranking/source-quality issue, not an embedding outage.
Work on:
- note structure
- headings
- source hygiene
- reducing duplicate/experimental memory docs in hot path

### 4) Chat tool errors despite healthy backend
Likely tool invocation / wrapper / registration issue, not embeddings.

## Current Architecture Summary
- OpenClaw runs on VPS
- Ollama runs on Mat’s Mac
- VPS reaches Mac via Tailscale
- OpenClaw indexes markdown memory into SQLite vector store
- `memory_search` uses that indexed store for recall

## Notes
There are older/experimental memory systems in the workspace (custom scripts, JSONL/Chroma remnants). Treat the native OpenClaw memory backend as the current live source of semantic retrieval unless explicitly changed.
