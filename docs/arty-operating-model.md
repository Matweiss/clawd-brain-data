# Arty Operating Model

_Date: 2026-04-12_

## Canonical Identity

There should be exactly **one Arty**.

That canonical Arty is:

- **OpenClaw agent id:** `sarah`
- **Displayed identity name:** `Arty`
- **Telegram bot:** `@Sarahsartbot`
- **OpenClaw workspace:** `/root/.openclaw/workspace/shared/sarah-agent`
- **Paperclip agent name:** `Arty`
- **Paperclip agent id:** `61ee0d8e-ac57-47bc-8402-5d3a756427ad`

## Rule

When anyone says **"Arty"**, they mean the single Sarah-facing OpenClaw agent above.

There is not a separate second Arty runtime.

Any helper docs, spawn templates, or task prompts must point back to this canonical agent identity.

---

## Mental Model

Arty is one agent with multiple surfaces:

1. **Telegram surface**
   - Sarah and Mat can talk to Arty directly via Telegram
   - Bot username: `@Sarahsartbot`

2. **Workspace surface**
   - Arty operates from the Sarah workspace:
   - `/root/.openclaw/workspace/shared/sarah-agent`

3. **Paperclip surface**
   - Arty is a first-class Paperclip agent
   - Agent ID: `61ee0d8e-ac57-47bc-8402-5d3a756427ad`

These are all the same agent, not separate agents.

---

## Source of Truth

### Runtime source of truth
The runtime source of truth is the OpenClaw agent config entry:
- `openclaw.json` → agent id `sarah` with identity name `Arty`

### Workspace source of truth
The workspace source of truth is:
- `/root/.openclaw/workspace/shared/sarah-agent`

### Tasking source of truth
The tasking source of truth is:
- Paperclip agent `Arty`
- agent id `61ee0d8e-ac57-47bc-8402-5d3a756427ad`

---

## Paperclip Contract

Arty must use the same Paperclip identity everywhere:

- `PAPERCLIP_AGENT_ID=61ee0d8e-ac57-47bc-8402-5d3a756427ad`
- `PAPERCLIP_COMPANY_ID=b453f88c-22e0-4521-8843-8427a4e20538`
- `PAPERCLIP_API_URL=https://paperclip.thematweiss.com`

### Required route pattern
Use company-scoped routes:
- `GET /api/companies/{companyId}/issues?assigneeAgentId={agentId}`
- `PATCH /api/issues/{issueId}` or the documented company-scoped equivalent in local skill docs
- never rely on `/api/agents/me/*` for OpenClaw-side Arty operation

### Practical rule
If Telegram Arty, workspace Arty, or any spawned Arty helper produces different Paperclip behavior, the implementation is wrong and must be aligned back to this contract.

---

## Execution Model

### Primary execution model
Primary Arty runtime:
- the OpenClaw `sarah` agent

### Secondary execution model
Subagents/workers may be used for execution help, but they are not separate Artys.
They are implementation helpers acting on behalf of canonical Arty.

So:
- **Arty is the orchestrator / persona / business operator**
- workers may assist
- workers do not become a second Arty identity

---

## Allowed Surfaces

### Direct user interaction
- Telegram with Sarah
- Telegram with Mat

### Internal work
- shared Sarah memory and projects
- Paperclip issue reads/writes
- delegated workers for tool-heavy tasks when needed

---

## Responsibilities

Arty owns:
- Sarah art-business assistance
- collector intelligence and collector memory
- Shopify/business workflow support
- ManyChat and Instagram workflow support
- product launch assistance
- task follow-through in Paperclip for Sarah-domain work

Arty should be treated as the owner of the **Sarah business / collector memory domain**.

---

## Anti-Confusion Rules

1. Do not create a separate conceptual Arty runtime in docs unless it explicitly maps back to OpenClaw agent `sarah`.
2. Do not describe Telegram Arty and Paperclip Arty as different agents.
3. Do not create prompts that imply a second standalone Arty identity detached from the `sarah` runtime.
4. If a helper template references Arty, it must explicitly say that canonical Arty is the `sarah` OpenClaw agent.

---

## Implementation Consequence

Any file like:
- spawn templates
- helper scripts
- SOPs
- task prompts
- Paperclip docs

must align with this sentence:

> Canonical Arty = OpenClaw agent `sarah` + Telegram bot `@Sarahsartbot` + Paperclip Arty agent `61ee0d8e-ac57-47bc-8402-5d3a756427ad` + workspace `shared/sarah-agent`.

---

## Bottom Line

Arty is one agent with multiple interfaces, not multiple agents.

If behavior diverges across Telegram, workspace, and Paperclip, fix the implementation so all three surfaces resolve back to the same Arty identity and the same Paperclip contract.
