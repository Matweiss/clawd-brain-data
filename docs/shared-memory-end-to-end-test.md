# Shared Memory End-to-End Test

## VPS side
Run from the OpenClaw workspace:

```bash
/root/.openclaw/workspace/scripts/capture-and-sync-memory.sh \
  inbox \
  openclaw-vps \
  "end to end bridge test" \
  "- captured on VPS\n- committed and pushed from VPS\n- intended to be pulled and imported on Mac"
```

Expected result:
- artifact file path printed
- git commit succeeds
- git push succeeds

## Mac side
Run from the Mac workspace:

```bash
bash /Users/mat/clawd-workspace/scripts/pull-and-import-memory.sh
```

Expected result:
- latest repo changes pulled
- importer reports one new inbox file imported into the vault

## Success condition
The new note appears in:
- `/Users/mat/Documents/Clawd-Brain-Vault/inbox/`

and matches the staged artifact from VPS.

## If it fails
### Push fails on VPS
- verify repo remote/auth
- check current branch
- resolve any remote divergence

### Pull fails on Mac
- resolve local repo state first
- re-run the pull/import wrapper

### Import finds nothing
- confirm the staged file landed in `shared-memory-sync/inbox/`
- confirm importer paths are correct
- re-run importer directly for verbose confirmation
