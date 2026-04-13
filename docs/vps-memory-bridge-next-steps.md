# VPS Memory Bridge Next Steps

## What is implemented
- `scripts/write-sync-artifact-vps.sh` stages durable memory artifacts inside the OpenClaw workspace.
- Artifacts are written to `shared-memory-sync/<folder>/`.
- A lightweight manifest is updated at `shared-memory-sync/_meta/staged-manifest.json`.

## What is not yet implemented
- automatic git commit/push of staged artifacts
- automatic invocation from agent workflows
- automatic import on the Mac side
- promotion from inbox to canonical notes

## Recommended wiring order
1. Add a capture rule for OpenClaw strategic/architectural outputs.
2. Add a capture rule for Sloan/Paperclip outputs.
3. Add one manual or scripted sync routine that moves VPS repo changes to the Mac.
4. Add a Mac-side pull + import wrapper.

## Suggested OpenClaw capture rule
Use the VPS writer when output is likely to be reused later and would otherwise need to be reconstructed.

Default target in v1:
- `inbox`

Suggested command:

```bash
/root/.openclaw/workspace/scripts/write-sync-artifact-vps.sh \
  inbox \
  openclaw-vps \
  "<short useful title>" \
  "<2-8 bullets or compact summary>"
```

## Suggested Sloan/Paperclip behavior
- Sloan keeps writing to Mac-local vault when running on the Mac.
- Paperclip/VPS-side agents should use the VPS writer and stage into `shared-memory-sync/inbox/`.

## Success criteria for next session
- one real OpenClaw memory capture written on VPS
- staged artifact committed to repo
- artifact visible on Mac after pull/import
- no manual reconstruction needed for that captured work
