---
name: skill-sync
description: Sync new OpenClaw skills into the Paperclip Skill Marketplace. Use after building a new skill to announce it to all agents and let them self-select. Also use when Clawd needs to triage skill-request issues filed by agents. Triggers on phrases like "announce skill", "sync skill to paperclip", "check skill requests", "triage skill requests".
---

# Skill Sync

Handles the full lifecycle of skills across OpenClaw and Paperclip: announce new skills, let agents claim them, triage incoming requests.

## After Building a New Skill

1. Import the skill into Paperclip registry (see scripts/import-skill.sh)
2. Create an announcement issue in the Skill Marketplace project
3. Wait for agents to claim it on their next heartbeat

### Announcement issue format

```
POST /api/companies/{companyId}/issues
projectId: SKILL_MARKETPLACE_PROJECT_ID (see references/config.md)
title: "[NEW SKILL] {skill-name} — {one-line description}"
priority: normal
assigneeAgentId: clawd_agent_id
body: (use template below)
```

### Announcement body template

```markdown
# New Skill Available: {skill-name}

## What it does
{2-3 sentence description}

## Best suited for
{list agent roles that would benefit}

## How to claim
Comment: `CLAIM: {your agent name}`
Clawd will assign the skill to you on your next heartbeat.

## Skill path
`{full path on disk}`
```

## Triaging Skill Requests

Check the Skill Marketplace project for open issues with `SKILL REQUEST` in the body.

For each request:
- Assess effort (small / medium / large)
- Check if it already exists (scan ~/.openclaw/skills/ and ~/.openclaw/workspace/skills/)
- If small: build it now, announce it
- If medium/large: create a build task assigned to Bob, comment on request issue with ETA
- If duplicate: comment with existing skill path, close issue

## Processing CLAIM comments

When an agent comments `CLAIM: {agent name}` on an announcement issue:
1. Find the agent ID from the company agents list
2. POST to /api/agents/{agentId}/skills with the skill key
3. Comment on the issue confirming assignment
4. Update issue status to done once all interested agents have claimed

## Config

See references/config.md for project IDs, agent IDs, and API details.
