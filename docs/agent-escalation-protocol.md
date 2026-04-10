# Agent Escalation Protocol — Vandalay-First Workflow

## Core Principle

**Vandalay sees everything first.** All plans, features, enhancements, skills, and requests go through Vandalay for review before execution.

---

## Escalation Flow

```
Mat/Agent Request
       ↓
   Vandalay (Review & Score)
       ↓
   ┌─────────────────┬─────────────────┐
   ↓                 ↓                 ↓
Reject          Approve           Approve with
              (straight to       Changes
               execution)
                   ↓                 ↓
              Sloan (package)   Sloan (re-package)
                   ↓                 ↓
              Bob/Agent (build) Bob/Agent (build)
```

---

## When Agents Self-Execute vs Escalate

### Self-Execute (No Vandalay needed)
- Routine maintenance tasks
- Bug fixes within existing scope
- Data queries and reports
- Scheduled heartbeat tasks
- Known-pattern work within their domain

### Escalate to Vandalay
- **New features or capabilities**
- **Changes to existing workflows**
- **New skills or integrations**
- **Strategic decisions** (approach, prioritization)
- **Cross-agent coordination needs**
- **Unclear scope or high-risk work**
- **API integrations** (Vandalay → Clawd → Mat)

---

## Vandalay Review Output

### Vandalay Scorecard
```
### Vandalay Review
**Request:** <summary>

**Score:** X/10
- Strategy: X/10
- Risk: X/10 (lower is riskier)
- Leverage: X/10
- Clarity: X/10

**Verdict:** Approve / Approve with changes / Defer / Reject

**Why:**
- <point>

**Recommended Improvements:**
- <point>

**Risks / Gaps:**
- <point>

**Best Owner:** <agent>

**Next Step:** <action>
```

---

## API Integration Rule

**If any build involves APIs, integrations, or external services:**

Vandalay → Clawd → Mat (for approval/awareness)

This ensures Mat knows about new API dependencies, costs, and security considerations.

---

## Agent-Specific Escalation Triggers

### Bob
- Self-execute: Scripts, fixes, known patterns
- Escalate: New skills, extensions, integrations, architecture changes

### Hermes
- Self-execute: Daily email triage, calendar checks, drafting
- Escalate: New automation rules, auto-send features, support workflows

### Luke
- Self-execute: CRM updates, meeting prep, prospect research
- Escalate: Sales strategies, new tools, ROI approaches

### Sage
- Self-execute: Routine tracking, schedules, reminders
- Escalate: New routines, health strategies, home automations

### Pixel
- Self-execute: Scheduled scraping, data fetching
- Escalate: New scraping strategies, data pipelines, browser tools

### Scout
- Self-execute: Daily intel, competitor tracking
- Escalate: Research strategies, new sources, analysis approaches

### Arty
- Self-execute: Shop updates, listings, routine tasks
- Escalate: Creative strategies, marketing campaigns, brand changes

---

## Sloan Usage

Sloan is called **after Vandalay approves** when:
- Execution plan needs clarification
- Scope/ownership/dependencies unclear
- Build brief needed
- Rollout notes required
- Multiple agents need coordination

Sloan is **NOT** a substitute for Vandalay review.

---

## Success Metrics

- Fewer misaligned builds
- Clearer ownership
- Better risk identification
- Faster execution on approved work
- Mat informed on all API integrations
