# Omnigent Shared Skill Hub Spec

## Goal

Create a central, versioned skill hub that Clawd, Claude, Codex, Polly, and other Omnigent agents can all discover and use consistently.

The hub should make skills portable across:

- OpenClaw / Clawd runtime
- Omnigent `polly`
- Omnigent `claude-native-ui`
- Omnigent `codex-native-ui`
- future harnesses or local agents

## Core idea

A shared `skills/` registry with machine-readable metadata, human-readable instructions, and optional runtime adapters.

**Cost constraint:** default design should avoid extra API calls and additional token spend. Prefer local filesystem lookup, existing Omnigent/Claude/Codex subscriptions, and selective prompt injection over MCP/API calls. Only build an API/MCP layer later if Mat explicitly approves the extra overhead.

Recommended home:

```text
/root/.openclaw/workspace/omnigent-skill-hub/
  registry.json
  skills/
    <skill-name>/
      SKILL.md
      skill.json
      adapters/
        openclaw.md
        omnigent.md
        claude.md
        codex.md
      examples/
      tests/
```

For Mat's Mac / Omnigent specifically, mirror or sync to:

```text
~/Omnigent/skill-hub/
```

or expose the workspace hub to Omnigent via a configured path.

## Skill package contract

Each skill should include:

### `SKILL.md`
Human instructions:

- when to use
- how to use
- constraints / safety notes
- examples

### `skill.json`
Machine-readable metadata:

```json
{
  "name": "example-skill",
  "version": "0.1.0",
  "description": "What this skill does",
  "triggers": ["natural language trigger", "task pattern"],
  "runtimes": ["openclaw", "omnigent", "claude", "codex"],
  "requires": {
    "bins": [],
    "env": [],
    "tools": []
  },
  "safety": {
    "external_writes": false,
    "destructive": false,
    "approval_required": []
  }
}
```

### Adapters
Adapters translate the same skill into runtime-specific behavior:

- `openclaw.md` — how Clawd should use it
- `omnigent.md` — how Polly/session agents should load it
- `claude.md` — Claude-native nuances
- `codex.md` — Codex-native nuances, verification and coding bias

## Registry behavior

The hub should support:

1. List all skills
2. Search by trigger/description
3. Resolve a skill by name
4. Emit runtime-specific instructions
5. Validate skill metadata
6. Sync/install skills into Omnigent agent config if needed

## Minimal CLI shape

```bash
skillhub list
skillhub search "code review"
skillhub show <skill-name>
skillhub resolve <skill-name> --runtime omnigent
skillhub validate
skillhub sync --target omnigent
```

## Omnigent integration options

### Option A — Shared filesystem path
Omnigent agents are instructed to read from the hub path when a task matches a skill trigger.

Pros: simplest, transparent, versioned.  
Cons: agent must know to search/read the hub.

### Option B — MCP/tool endpoint (deferred / approval-only)
Expose the hub as a local API/MCP server:

- `list_skills`
- `search_skills`
- `get_skill`
- `resolve_skill_for_runtime`

Pros: clean for all agents/harnesses.  
Cons: more build work and may add tool/API overhead. Do not make this the default because Mat wants to avoid extra API calls and token costs.

### Option C — Selective prompt injection (preferred MVP)
At session start, Clawd resolves relevant local skills and injects only the compact, task-relevant sections into the prompt.

Pros: uses existing subscriptions/session context, no separate skill API, cheapest operational path.  
Cons: less discoverable mid-session; requires Clawd to choose the right skills up front.

## Recommended rollout

### Phase 1 — Filesystem MVP, no extra API calls
- Create canonical hub folder and registry.
- Add 3-5 existing high-value skills as examples.
- Add local `skillhub` script for list/search/resolve/validate.
- Update Omnigent Session Start SOP to resolve relevant skills before launching Polly.
- Inject only concise relevant skill excerpts into the existing session prompt.
- Use existing Claude/Codex/Omnigent subscriptions; do not introduce new hosted APIs or metered calls.

### Phase 2 — Omnigent bridge
- Add skill hub lookup to Omnigent/Polly session prompts.
- Let Clawd include relevant resolved skills in the initial brief.
- Add receipts indicating which skills were used.

### Phase 3 — API/MCP, optional only
- Only if Mat approves, add a local skill hub API or MCP server.
- Make Claude/Codex/Polly request skills dynamically.
- Add sync to agent config if Omnigent supports native skill registration.

Default remains local files + prompt injection to avoid extra calls/costs.

## Approval gates

Ask Mat before:

- modifying global Omnigent installation/config
- publishing skills externally
- installing third-party skills
- giving agents access to credentials or private files outside approved paths

Safe to do directly:

- create local hub files
- draft registry/spec
- copy existing local skills into the hub
- build validation/search scripts
- update local SOP/docs

## Open questions

- Should the hub live primarily in OpenClaw workspace, Mat's Mac home directory, or a GitHub repo?
- Should skills be synced into Omnigent or only referenced at session start?
- Should the first MVP support only markdown skills, or also executable tools/scripts?
- Should this be private to Mat or eventually shared across agents/projects?


## MVP implementation status — 2026-06-16

Created filesystem MVP at:

```text
/root/.openclaw/workspace/omnigent-skill-hub/
```

Created local resolver script:

```bash
/root/.openclaw/workspace/scripts/skillhub.py
```

Starter skills:

- `omnigent-session-start`
- `gstack-coding-workflow`
- `dangerous-action-guard`
- `context-budget-guard`

Smoke-tested commands:

```bash
scripts/skillhub.py validate
scripts/skillhub.py list
scripts/skillhub.py search "start a polly session create repo"
```
