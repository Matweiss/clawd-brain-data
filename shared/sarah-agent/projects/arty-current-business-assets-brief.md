# Arty Current Business Assets Brief

Date: 2026-03-26
Audience: Arty / Sarah-facing operational agent context
Purpose: Give Arty a fast, explicit map of current high-value Sarah-business assets so they do not need to be rediscovered.

## Core rule
If these assets can help Sarah or her business, Arty should proactively surface them to Sarah when relevant.

---

## 1) ManyChat strategy + execution docs

### A. Strategy reference
**Path:** `shared/sarah-agent/projects/manychat-masterclass-reference.md`

**What it is:**
A living ManyChat operator reference based on the Gannon Meyer ManyChat strategy material, translated into Sarah-specific business use cases.

**What it helps with:**
- collector lead capture
- Instagram DM/comment automation
- segmentation strategy
- human-in-the-loop rules
- ManyChat positioning for Sarah's business

**Use this when:**
- Sarah asks about ManyChat
- Arty is suggesting marketing automation
- Instagram lead capture / collector nurture comes up
- deciding how to use chat automation without sounding robotic

### B. Audit + build spec
**Path:** `shared/sarah-agent/projects/sarah-manychat-audit-build-spec.md`

**What it is:**
The execution companion doc that defines:
- current-state audit checklist
- data model
- tag conventions
- first priority automations
- human handoff rules
- AI usage boundaries
- immediate next actions

**Use this when:**
- Arty needs a concrete ManyChat next step
- Sarah wants implementation, not just ideas
- reviewing existing ManyChat setup
- planning flows / tags / fields / handoffs

**Recommended next action from these docs:**
Create and fill a live audit of Sarah's current ManyChat workspace.

---

## 2) Proactive-handoff operating policy

**Path:** `shared/sarah-agent/projects/arty-proactive-handoff-policy.md`

**What it is:**
A written policy capturing Mat's explicit instruction that Arty should be proactively informed about useful business docs, capabilities, enhancements, and workflows — and should proactively tell Sarah when they matter.

**Behavioral takeaway:**
Do not wait for Sarah to ask the exact right question if a newly created asset could help her business.

---

## 3) Sarah art assistant system context

### System prompt / continuity doc
**Path:** `memory/projects/sarah-art-assistant-system-prompt.md`

**What it helps with:**
- continuity expectations
- how to behave as Sarah's assistant
- what to log and preserve
- human-in-the-loop style

### Design spec
**Path:** `memory/projects/sarah-art-assistant-design-spec.md`

**What it helps with:**
- product direction
- candidate automation ideas
- landing pages
- Shopify workflows
- business-ops use cases for Sarah

---

## 4) Daily dashboard status context

**Relevant paths:**
- `shared/sarah-agent/projects/daily-dashboard.mjs`
- `shared/sarah-agent/projects/send-dashboard.sh`

**Current known status:**
- sender script was patched
- explicit Sarah Telegram account selection was added
- manual/dashboard delivery has worked
- next scheduled automatic run is the remaining verification checkpoint

**Use this when:**
- Sarah asks why dashboard delivery failed
- Arty needs to explain dashboard status
- automation reliability comes up

---

## 5) Arty operating instruction

When relevant, Arty should proactively say things like:
- "There are now two ManyChat docs that can help us."
- "A build spec exists for this; we don't need to start from scratch."
- "There is already a system/process doc for that workflow."
- "A new business-helpful asset was created and here is the next step."

Avoid:
- "I don't have a doc for that" when one exists in reachable workspace context
- waiting passively for rediscovery

---

## 6) Immediate suggested proactive prompts Arty can use with Sarah

- "There are now dedicated ManyChat planning docs if you want to tighten IG automation and collector capture."
- "We now have both strategy and execution docs for ManyChat; next step is a live audit of your actual setup."
- "Your dashboard automation path has been debugged substantially; the next check is whether the scheduled run now succeeds automatically."

---

## 7) Priority next actions Arty should know

1. If ManyChat comes up, point Sarah to the two docs immediately.
2. If dashboard automation comes up, describe the current fixed-vs-pending state accurately.
3. If a new useful Sarah-business doc is created, surface it proactively rather than waiting for rediscovery.
