# Agent Usage Guide — When to Use Sloan vs Vandalay

## Quick Reference

| Need | Call | Why |
|------|------|-----|
| Idea needs review before building | **Vandalay** | Strategy, risks, simplification |
| Approved idea needs execution plan | **Sloan** | Packaging, ownership, next steps |
| Unclear scope or dependencies | **Sloan** | Clarification and operational planning |
| Plan feels wrong or risky | **Vandalay** | Pressure-test and improve |
| Rollout notes or handoff needed | **Sloan** | Communication and packaging |
| Feature request from user | **Vandalay first** → Sloan if approved | Strategy review → execution plan |

---

## Sloan — Chief of Staff

**Use Sloan when:**
- An idea is **approved or close to approved**
- You need to **operationalize** a request
- **Scope, ownership, or dependencies** are unclear
- You need **acceptance criteria** written
- A **build brief** is needed for Bob
- **Rollout notes** or internal comms need drafting
- You need to convert a messy request into a **clean execution package**

**Sloan's Output:**
```
### Sloan Brief
**Objective:** <what and why>
**Status:** Draft / Ready for approval / Ready for build
**Owner:** <agent or role>
**Scope:**
- <item>
**Dependencies:**
- <item>
**Acceptance Criteria:**
- <criterion>
**Next Step:** <specific action>
```

**Don't use Sloan for:**
- Strategy review (that's Vandalay)
- Final approval (that's Mat/Clawd)
- Implementation (that's Bob)

---

## Vandalay — Chief Strategy Officer

**Use Vandalay when:**
- A **plan needs review** before execution
- You need to **pressure-test assumptions**
- Something feels **overly complex** and needs simplification
- You want to **identify hidden risks** before building
- You're unsure if an idea is **worth doing**
- You need a **second opinion** on prioritization or approach

**Vandalay's Output:**
```
### Vandalay Review
**Request:** <summary>
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

**Don't use Vandalay for:**
- Operational details (that's Sloan)
- Implementation (that's Bob)
- Routine execution work

---

## Workflow Examples

### New Feature Request from User
```
User → You → Vandalay (review strategy)
              ↓
         If approved → Sloan (create build brief)
                        ↓
                   Bob (implement)
```

### Unclear Request
```
You → Sloan (clarify scope and ownership)
        ↓
   Brief ready → Bob or other agent
```

### Plan Feels Risky
```
You → Vandalay (pressure-test)
        ↓
   Improvements → Sloan (re-package)
                   ↓
              Bob (build)
```

---

## Agent-Specific Guidance

### Clawd (You)
- Route **all strategic requests** to Vandalay first
- Route **approved work** to Sloan for packaging
- Final approver before Bob builds

### Bob
- Use **Sloan** when receiving unclear specs
- Use **Vandalay** when a build approach feels questionable
- Never start building without a Sloan Brief or direct Clawd approval

### Luke
- Use **Vandalay** to review sales strategies and ROI approaches
- Use **Sloan** to package rollout plans for new sales tools

### Hermes
- Use **Vandalay** to review email automation strategies
- Use **Sloan** to clarify triage rules and escalation paths

### Sage
- Use **Vandalay** for lifestyle/health strategy reviews
- Use **Sloan** to operationalize new routines or systems

### Pixel
- Use **Vandalay** to review scraping strategies and data approaches
- Use **Sloan** to document data pipelines and handoffs

### Scout
- Use **Vandalay** to validate research strategies
- Use **Sloan** to package research findings for action

### Arty
- Use **Vandalay** to review creative strategies and brand positioning
- Use **Sloan** to operationalize marketing campaigns

---

## How to Call Them

Since Sloan and Vandalary are now **on-demand agents** (no heartbeats), you request them through Clawd:

**Example:**
> "Clawd, have Vandalay review this plan: [paste plan]"

**Or:**
> "Clawd, ask Sloan to create a brief for: [describe need]"

Clawd will spawn them as subagents, they'll do their work, and return results.

---

## Success Metrics

- **Fewer misaligned builds** (Vandalay catches issues early)
- **Clearer specs to Bob** (Sloan packages well)
- **Less ambiguity** in handoffs
- **Faster execution** on approved ideas
