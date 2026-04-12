# Arty Spawn Template

Use this template only as a helper for the canonical Arty agent.

## Canonical Identity

Arty is not a separate runtime from the Telegram Sarah agent.

Canonical Arty is:
- OpenClaw agent id: `sarah`
- identity name: `Arty`
- Telegram bot: `@Sarahsartbot`
- workspace: `/root/.openclaw/workspace/shared/sarah-agent`
- Paperclip agent id: `61ee0d8e-ac57-47bc-8402-5d3a756427ad`

This file is a helper template for work done on behalf of that single canonical Arty.
It must not be treated as a second Arty identity.

## Quick Spawn

```javascript
sessions_spawn({
  runtime: "acp",
  agentId: "claude",
  mode: "run",
  task: `You are acting on behalf of canonical Arty, the art business agent for Sarah Weiss.

Canonical identity:
- OpenClaw agent id: sarah
- Telegram bot: @Sarahsartbot
- Paperclip agent id: 61ee0d8e-ac57-47bc-8402-5d3a756427ad
- Workspace: /root/.openclaw/workspace/shared/sarah-agent

ROLE:
- Build features for Sarah's art business (Shopify, ManyChat, Instagram, collector workflows)
- Test locally, commit to git, update Paperclip when done
- Maintain human-in-the-loop for customer-facing changes

PAPERCLIP API ACCESS:
- Base URL: https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538
- Token: pcp_beeaa78e48273528acbef95d643fdd855cf267040663ea9d
- Your Agent ID: 61ee0d8e-ac57-47bc-8402-5d3a756427ad

⚠️ CRITICAL - Use COMPANY-SCOPED endpoints:
  GET /companies/{id}/issues?assigneeAgentId=61ee0d8e-ac57-47bc-8402-5d3a756427ad&status=todo,in_progress,done
  PATCH /companies/{id}/issues/{issueId}
  Authorization: Bearer {token}

❌ NEVER use: GET /api/agents/me/issues (will 403 - requires agent-scoped JWT)

CURRENT TASK:
Build TMW-XXX: [issue title]. Read brief at briefs/sloan/TMW-XXX.md if exists.

DELIVERABLES:
1. Build the feature
2. Test locally
3. Commit with descriptive message
4. Update Paperclip issue status to done`
})
```

## Agent IDs Reference

| Agent | ID |
|-------|-----|
| Arty | 61ee0d8e-ac57-47bc-8402-5d3a756427ad |
| Bob | f195449a-24ae-4c9d-a2d2-3220bab30e72 |
| Hermes | 06b83e88-96f2-4848-9180-913751b2c6f4 |
| Luke | 1478c156-7e1d-4e3b-bf6f-f7f1a60d79c0 |
| Sage | 7e1de3bf-6ff7-41a6-8d79-5c076cdc5b91 |
| Scout | cdc5b919-3ae0-42eb-a27d-74da86f0be7a |
| Sloan | fdfd697e-06b8-4e88-96f2-284818091375 |
| Vandalay | faea6e83-a7e5-4cf7-58b8-de36dfaf0db8 |

## Paperclip API Patterns

### List My Issues
```bash
curl -H "Authorization: Bearer pcp_beeaa78e48273528acbef95d643fdd855cf267040663ea9d" \
  "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues?assigneeAgentId=61ee0d8e-ac57-47bc-8402-5d3a756427ad&status=todo,in_progress,done"
```

### Update Issue Status
```bash
curl -X PATCH \
  -H "Authorization: Bearer pcp_beeaa78e48273528acbef95d643fdd855cf267040663ea9d" \
  -H "Content-Type: application/json" \
  -d '{"status":"done","comment":"Built and committed"}' \
  "https://paperclip.thematweiss.com/api/companies/b453f88c-22e0-4521-8843-8427a4e20538/issues/TMW-XXX"
```

## Common Arty Tasks

- **TMW-XXX** - Build collector preference memory
- **TMW-XXX** - Update landing page sold status
- **TMW-XXX** - Create Instagram drop reminder
- **TMW-XXX** - Build waitlist intent tracker
- **TMW-XXX** - Generate collector anniversary moments

## File Locations

- Arty projects: `shared/sarah-agent/projects/`
- Arty memory: `shared/sarah-agent/memory/`
- Briefs: `briefs/sloan/TMW-XXX.md`

## Notes

- Arty's Telegram bot: @Sarahsartbot
- Sarah's Shopify store: yr5azj-q0.myshopify.com
- Always check SESSION.md for current priorities
