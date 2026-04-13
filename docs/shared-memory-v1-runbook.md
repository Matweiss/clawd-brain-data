# Shared Memory V1 Runbook

## Goal
Make VPS-originated agent memory show up reliably in Mat's Obsidian vault without direct remote filesystem access.

## V1 Architecture

### VPS side
- Agents write staged draft memory into `shared-memory-sync/`
- Primary writer:
  - `scripts/write-sync-artifact-vps.sh`
- Sloan writes:
  - `inbox` only
- Vandalay writes:
  - `inbox` only

### Mac side
- Pull latest repo changes
- Run importer into Obsidian vault
- Primary importer:
  - `scripts/import-shared-memory.py`
- Convenience wrapper:
  - `scripts/pull-and-import-memory.sh`

## Operational Flow
1. Sloan or Vandalay finishes useful work on VPS
2. Agent runs:
   - `/root/.openclaw/workspace/scripts/write-sync-artifact-vps.sh inbox <agent> "<title>" "<body>"`
3. Artifact lands in:
   - `shared-memory-sync/inbox/`
4. On Mac, run:
   - `bash /Users/mat/clawd-workspace/scripts/pull-and-import-memory.sh`
5. Importer copies notes into vault inbox
6. Human or Clawd later promotes durable notes into canonical folders

## Importer Behavior
- Imports only allowed folders
- Tracks prior imports in:
  - `shared-memory-sync/.import-state/manifest.json`
- Skips re-import when the same source hash was already imported
- Skips if destination already exists with identical content
- If destination exists with different content, writes a conflict copy:
  - `<name>.conflict-<hash>.md`

## V1 Acceptance Criteria
- VPS can stage a draft note successfully
- Mac importer can pull and import it successfully
- Re-running importer is idempotent
- Conflicting content does not overwrite canonical vault content
- Sloan and Vandalay are both instructed to capture reusable draft memory

## Test Commands

### VPS stage test
```bash
/root/.openclaw/workspace/scripts/write-sync-artifact-vps.sh inbox sloan "shared memory v1 smoke test" "- test artifact\n- verify importer\n- verify manifest"
```

### Mac import test
```bash
bash /Users/mat/clawd-workspace/scripts/pull-and-import-memory.sh
```

### Direct importer test
```bash
python3 /Users/mat/clawd-workspace/scripts/import-shared-memory.py \
  --sync-root /Users/mat/clawd-workspace/shared-memory-sync \
  --vault-root /Users/mat/Documents/Clawd-Brain-Vault
```

## What is intentionally not in V1
- Direct remote writes into Obsidian
- Automatic promotion from inbox to canonical notes
- Bidirectional sync
- Conflict auto-resolution
- Non-draft writes from VPS agents into canonical project or decision notes

## Recommended next step after V1
- Wire actual Sloan and Vandalay runtime prompts/config to invoke memory capture during real work
- Then add a lightweight daily import cadence on Mac
