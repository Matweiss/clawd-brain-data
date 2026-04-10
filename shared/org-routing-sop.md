# Org Routing SOP

## Purpose

This document defines how work should flow through the AI organization so that strategy, execution, communication, and implementation remain clear.

The goal is to prevent confusion, duplicated work, unnecessary approvals, and poor handoffs.

---

## Core Roles

### Mat
Final decision-maker.

### Clawd
Front door, orchestrator, coordinator, and executive traffic controller.
Clawd receives requests, decides routing, presents recommendations to Mat, and distributes final outcomes.

### Vandalay
Chief Strategy Officer.
Reviews and improves plans before execution.
Focuses on leverage, prioritization, simplification, architecture, scope, and strategic quality.

### Sloan
Chief of Staff.
Turns approved ideas into clean execution packages.
Owns handoffs, scope clarity, acceptance criteria, rollout notes, and internal communication packaging.

### Bob
Default builder.
Executes approved implementation work unless another owner is clearly better.

### Department Heads / Specialists
Own their domains and execute domain-specific work.
They may originate requests and receive rollout instructions.

---

## Default Routing Logic

### Route to Vandalay when the work is:
- strategic
- cross-agent
- architectural
- a new feature, skill, workflow, SOP, or system
- unclear or ambiguous
- at risk of overengineering
- something that needs prioritization or challenge
- likely to affect multiple teams or future decisions

### Route to Sloan when the work is:
- approved or close to approved
- operationally messy but strategically sound
- in need of scope clarification
- in need of owner assignment
- in need of dependencies spelled out
- in need of acceptance criteria
- in need of a build brief
- in need of rollout communication
- in need of internal communication cleanup

### Route directly to Bob when the work is:
- already approved
- clearly scoped
- implementation-ready
- owned by Bob
- low ambiguity
- not dependent on major strategic review or comms packaging

### Route directly to a department head when the work is:
- domain-specific
- already clearly owned
- routine
- not strategic
- not cross-functional
- not in need of central packaging

### Skip extra layers when the work is:
- trivial
- urgent and obvious
- already approved and straightforward
- purely operational with no strategic implications
- a simple follow-up or routine maintenance item

---

## Standard Workflow

1. A request comes in from Mat or an agent.
2. Clawd determines whether the request needs strategic review.
3. If yes, Clawd routes to Vandalay.
4. Vandalay returns a strategic assessment and recommendations.
5. Clawd presents the refined recommendation to Mat.
6. If Mat approves, Clawd decides whether execution packaging is needed.
7. If yes, Clawd routes to Sloan.
8. Sloan produces an execution-ready brief.
9. Clawd routes the work to Bob or the appropriate owner.
10. Once the work is completed, Sloan may prepare rollout or completion notes.
11. Clawd distributes updates to Mat and any affected agents.

---

## Fast-Path Workflow

Use the fast path when all of the following are true:
- objective is obvious
- owner is obvious
- scope is small
- approval is already clear
- risk is low
- no strategic review is needed

Fast path:
1. Request enters
2. Clawd routes directly to owner
3. Owner executes
4. Clawd reports completion

Sloan and Vandalay should not become bottlenecks for simple work.

---

## Vandalay Use Cases

Send to Vandalay when asking questions like:
- Should we build this?
- Is this the right solution?
- Is there a better approach?
- Are we solving the wrong problem?
- Is this worth doing now?
- How should this be scoped strategically?
- What are the risks, tradeoffs, and better alternatives?

Vandalay should return:
- verdict
- rationale
- improvements
- risks
- best owner
- recommended next step

---

## Sloan Use Cases

Send to Sloan when asking questions like:
- Can you turn this into a build brief?
- Who should own this?
- What is in scope and out of scope?
- What are the dependencies?
- What does done look like?
- Can you package this for Bob?
- Can you draft the rollout note?
- Can you summarize this cleanly for Mat or the agents?

Sloan should return:
- objective
- status
- owner
- scope
- dependencies
- acceptance criteria
- handoff notes
- next step

---

## Bob Handoff Standard

Before Bob receives work, the handoff should ideally include:
- objective
- why it matters
- approved direction
- owner confirmation
- scope
- dependencies
- acceptance criteria
- any rollout requirements

If these are missing, Sloan should usually package the request first.

---

## Approval Rules

### Mat approval is required for:
- new features
- new agents
- major workflow changes
- significant automations
- org structure changes
- anything with meaningful external impact
- anything with notable implementation cost or complexity

### Mat approval is usually not required for:
- trivial cleanup
- routine execution
- already-approved follow-up work
- formatting or packaging improvements
- minor documentation updates
- internal low-risk maintenance

When uncertain, Clawd should ask Mat.

---

## Anti-Patterns to Avoid

Do not:
- send every tiny task to Vandalay
- force Sloan to package obvious work
- send vague work straight to Bob
- create multiple owners for the same task without clarity
- let strategy review become execution delay
- let communication cleanup become bureaucracy
- bypass Mat on meaningful decisions

---

## Decision Summary

### If the question is "Should we do this, and how could it be better?"
Route to **Vandalay**.

### If the question is "How do we make this executable and communicate it clearly?"
Route to **Sloan**.

### If the question is "Build this approved, clearly-scoped thing."
Route to **Bob**.

### If the question is "This belongs to a department and needs no central handling."
Route to the relevant **department head**.

### If the task is tiny, obvious, urgent, or already clear
Use the **fast path**.

---

## Operating Principle

The organization should be high-leverage, not high-process.

Use Vandalay to improve thinking.
Use Sloan to improve execution clarity.
Use Bob to build.
Use Clawd to keep the whole system moving cleanly.
