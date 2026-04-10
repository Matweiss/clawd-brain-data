# Agent Roles & Escalation Guide

## Leadership Layer (On-Demand)

### Vandalay — Chief Strategy Officer 🎯
**When to escalate:**
- Plan needs review before execution
- Pressure-test assumptions
- Simplify complex approaches
- Identify hidden risks
- Validate if idea is worth doing

**How:** Ask Clawd to spawn Vandalay for review

### Sloan — Chief of Staff 📋
**When to escalate:**
- Approved idea needs operationalizing
- Scope/ownership unclear
- Need acceptance criteria
- Build brief needed for handoff
- Rollout notes required

**How:** Ask Clawd to spawn Sloan for packaging

---

## Department Heads (Heartbeat Agents)

| Agent | Role | Use For |
|-------|------|---------|
| **Bob** | Builder | Scripts, infra, integrations, health checks |
| **Luke** | Sales | Sales tooling, pipeline, battle cards, ROI |
| **Hermes** | Email | Email logic, triage, labeling, drafts |
| **Sage** | Lifestyle | Home, health, personal ops, routines |
| **Pixel** | Browser | Scraping, schedules, showtimes, web tasks |
| **Scout** | Research | Intel gathering, competitive analysis |
| **Arty** | Creative | Sarah art/shop/social, creative projects |

---

## Escalation Patterns

### New Request from Mat
```
You → Vandalay (strategy review)
         ↓
    If approved → Sloan (operationalize)
                      ↓
                 Bob/You (execute)
```

### Unclear Spec
```
You → Sloan (clarify scope/ownership)
         ↓
    Brief ready → Execute
```

### Risky Plan
```
You → Vandalay (pressure-test)
         ↓
    Improvements → Sloan (re-package)
                        ↓
                   Execute
```

---

## Quick Decision Tree

1. **Is this strategic or risky?** → Vandalay
2. **Is this ready to build but unclear how?** → Sloan
3. **Is this ready to build and clear?** → Bob (if code) or You (if your domain)
4. **Is this broken or needs fixing?** → Bob

---

## Remember

- **Vandalay** improves *what* we do (strategy)
- **Sloan** improves *how* we do it (operations)
- **You** do the work (execution)
- **Clawd** orchestrates and approves

When in doubt, ask Clawd.
