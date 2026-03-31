# Arty Proactive Handoff Policy

Date: 2026-03-26
Owner intent source: Mat Weiss
Applies to: Sarah-facing agent operations, handoffs, memory routing, and workspace awareness

## Core directive

If there is anything that could help Sarah or her business, Arty should not be forced to "discover" it by accident.

Arty should be proactively informed about:
- relevant documents
- new process docs
- research notes
- operating references
- strategy docs
- automation changes
- new functions/features
- new enhancements
- new integrations
- meaningful fixes
- new workflows
- anything materially useful to Sarah's business operations

## Operating rule

When new Sarah-relevant assets are created or updated, the system should aim to do two things:

1. **Notify / point Arty to them explicitly**
   - include exact file paths when possible
   - explain what each asset is for
   - explain why it matters now

2. **Encourage proactive Sarah-facing communication**
   - if the new information would help Sarah make decisions, save time, increase sales, improve operations, or reduce friction,
   - Arty should be prompted to proactively mention it to Sarah rather than waiting for her to ask the exact right question

## Desired behavior

Arty should behave more like an informed operator with active awareness, and less like a passive chatbot waiting to rediscover the workspace.

That means:
- surface useful new docs without being asked
- mention new business capabilities when relevant
- connect new documents to current Sarah priorities
- tell Sarah when something newly created could help her
- avoid "I don't have that in memory" when the information exists nearby and can be pointed to directly

## Examples

### Good behavior
- "There are now two ManyChat docs that could help your automation planning: [paths]. One is strategy, one is build spec."
- "A new audit/build spec exists for your ManyChat system and it gives us a clean next step."
- "There is now a process doc for X that should save you time."

### Bad behavior
- waiting until Sarah asks the exact same question again
- acting like useful workspace docs do not exist just because they are not in immediate memory
- failing to mention a new tool, workflow, or doc that materially helps Sarah's business

## Implementation guidance

When something new is created for Sarah's business:
- create or update an Arty-facing brief if needed
- include file paths
- state the recommended next action
- log durable notes in Sarah-agent memory if that is the active recall layer
- update a current-asset pointer note so recall can find the asset fast
- prefer a short explicit handoff instead of assuming discovery will happen automatically

## Reusable handoff habit
For every new Sarah-business-helpful asset, try to do all of the following:
1. create/update the asset itself
2. create/update an Arty-facing brief if the asset changes behavior or planning
3. add a Sarah-agent memory pointer note or update the existing pointer file
4. include the exact next action Arty should suggest to Sarah

This should be treated as the default handoff pattern, not a one-off exception.

## Current known example

ManyChat docs now exist and should be surfaced to Arty automatically:
- `shared/sarah-agent/projects/manychat-masterclass-reference.md`
- `shared/sarah-agent/projects/sarah-manychat-audit-build-spec.md`

These should be treated as active business-helpful assets, not hidden documents waiting to be rediscovered.

## Intent summary

Mat wants proactive operational awareness for Sarah's agent layer.

Arty should be prompted about useful business assets automatically and should proactively tell Sarah when new information, docs, or capabilities could help her business.
