# Omnigent Session Start SOP

Use this when Mat asks Clawd over Telegram to start or coordinate an Omnigent session, especially Polly sessions that plan and execute a build with Claude/Codex-style agents.

## Goal

Clawd should be able to take a high-level Telegram request, prepare the work area, start the right Omnigent session, monitor it, relay follow-ups, and report results back to Mat.


## Automatic trigger phrases

Clawd should automatically use this SOP when Mat says anything like:

- "start a Polly session"
- "start an Omnigent session"
- "spin up Polly for this"
- "use Claude and Codex to plan/build this"
- "have Polly plan and execute"
- "open/start a coding session for this project"
- "create a repo/folder and start the build agent"
- "kick this to Omnigent"

When triggered, Clawd should not merely explain the SOP. Clawd should begin the intake/preflight flow immediately:

1. Identify whether this is a new project or existing repo.
2. Determine what setup is required: local folder, GitHub repo, branch, env/assets, deploy target.
3. Do all safe local setup steps directly.
4. Ask Mat only for missing decisions or approval-gated actions.
5. Start the Omnigent/Polly session once the minimum required setup is ready.

Default assumptions unless Mat says otherwise:

- Use `polly` for multi-agent planning/execution.
- Create new local project folders on Mat's Desktop when a new project is requested.
- Prefer private GitHub repos for new work, but ask before creating the repo because GitHub repo creation is external.
- Do not push, deploy, publish, or send external messages without explicit approval.

## Intake from Mat

Ask for only what is missing:

- Project/task goal
- Desired harness/agent, usually `polly` for multi-agent planning/execution
- Existing repo/path, or whether this is a new project
- Whether GitHub repo creation is desired
- Any constraints: deadline, tech stack, deploy target, no-go areas

## Preflight checklist

Before starting the session, determine and tell Mat what setup is needed.

### Clawd can usually do

- Create a local working folder on Mat's Mac, e.g. Desktop project folder
- Clone or initialize a git repo
- Inspect existing repo status
- Create a GitHub repo if authenticated and Mat approves external creation
- Create/prepare a branch
- Write a concise implementation brief
- Start the Omnigent session via local API
- Post follow-up messages into an existing Omnigent session
- Read session items/responses and summarize results back to Telegram
- Capture receipts: files changed, tests run, blockers, risks, next steps

### Mat may need to do

Only ask Mat when the step requires local/human context or approval:

- Choose final project/repo name if ambiguous
- Confirm creating a public/private GitHub repo
- Grant auth/access if GitHub or local permissions fail
- Provide private assets, credentials, or account logins
- Approve destructive/external actions: deploy, publish, push, delete, send messages, credential/config changes
- Manually interact with app UIs when automation cannot safely do it


## Skill hub preflight

Before launching an Omnigent/Polly/Claude/Codex session, resolve local skills from the filesystem hub without API/model calls:

```bash
/root/.openclaw/workspace/scripts/skillhub.py search "<task description>"
/root/.openclaw/workspace/scripts/skillhub.py resolve <skill-name> --runtime omnigent
```

Inject only the compact relevant skill excerpts into the initial session brief. Default useful skills:

- `omnigent-session-start` for session setup/receipts
- `gstack-coding-workflow` for non-trivial coding work
- `dangerous-action-guard` for approval-gated actions
- `context-budget-guard` for long/complex sessions

Do not use MCP/API/model calls for skill discovery unless Mat explicitly approves.

## Recommended start flow

1. Clarify missing setup decisions in one compact question.
2. Create or verify the local workspace folder.
3. Create/clone repo if needed.
4. Check git status and current cwd.
5. Build a task brief with:
   - objective
   - repo/path
   - constraints
   - acceptance criteria
   - approval gates
   - requested agent behavior
6. Start the Omnigent session with the selected agent, usually `polly`.
7. Send the brief as the first message.
8. Monitor until one of:
   - completed result
   - material blocker
   - approval required
   - session error
9. Relay concise updates to Mat only when useful.
10. Final report should include:
   - session id
   - summary
   - files changed
   - commands/tests run
   - outcome status
   - risks/blockers
   - next recommended action

## Standard Polly prompt pattern

```text
You are Polly coordinating this build. Use Claude/Codex-style implementers as appropriate.

Project: <name>
Repo/path: <path>
Goal: <goal>
Constraints: <constraints>
Acceptance criteria:
- <criterion>

Rules:
- Inspect the repo before editing.
- Plan briefly, then implement.
- Run the smallest meaningful verification gate.
- Do not commit, push, deploy, delete data, or change credentials without explicit approval from Mat via Clawd.
- If blocked, report the exact missing input or failing command.

Return a concise receipt: files changed, commands run, tests, risks, and next steps.
```

## Safety / approval gates

Never let an Omnigent session bypass Mat approval for:

- public/customer-facing changes
- GitHub push/PR/release creation if not already explicitly requested
- deploys
- destructive deletes
- credentials/secrets/config changes
- sending external messages/emails
- purchases or financial actions

## Known bridge facts

- Omnigent local API on Mat's Mac can list agents and sessions.
- `polly`, `clawd`, `claude-native-ui`, `codex-native-ui`, and `debby` have been observed as registered agents.
- Existing sessions can receive messages via `POST /v1/sessions/{conversation_id}/events` with the nested `data` payload shape.
- Clawd can read session items and relay results back to Telegram.
