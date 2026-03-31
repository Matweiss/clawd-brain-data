# Sarah ManyChat Audit + Build Spec

Date created: 2026-03-26  
Companion to: `shared/sarah-agent/projects/manychat-masterclass-reference.md`

## Purpose

This document turns the ManyChat master reference into an execution plan for Sarah J. Schwartz Fine Art.

It is meant to help Clawd + Arty:
- audit Sarah's current ManyChat setup
- identify what already exists
- find what is messy, missing, or underused
- define the first automations to improve
- create a repeatable build standard going forward

This is a living spec and should be updated as we learn more.

---

# 1) Strategic Goal

Use ManyChat as a **collector-intent capture and nurture layer** for Sarah's social channels.

Not just:
- auto replies
- keyword gimmicks
- generic lead collection

But a system that helps us:
- capture warm demand from Instagram engagement
- collect useful audience data with low friction
- move people into email / CRM / launch lists
- route higher-value leads toward human follow-up
- preserve Sarah's tone and brand trust

---

# 2) Current-State Audit Checklist

This section should be completed by reviewing Sarah's actual ManyChat workspace.

## A. Workspace / Platform audit
- [ ] Confirm connected channels (Instagram, Facebook, other)
- [ ] Confirm which account/workspace is the source of truth
- [ ] Confirm admin access for Sarah / Arty / operators
- [ ] Confirm whether ChatGPT/OpenAI integration is connected
- [ ] Confirm email platform integrations (if any)
- [ ] Confirm Zapier or other middleware connections

## B. Existing automation inventory
For each existing flow, capture:
- [ ] name of flow
- [ ] trigger type
- [ ] campaign/use case
- [ ] destination / CTA
- [ ] tags applied
- [ ] custom fields used
- [ ] follow-up messages
- [ ] whether the flow is active or stale
- [ ] whether performance is known

## C. Data model audit
- [ ] list all tags currently in use
- [ ] list all custom fields currently in use
- [ ] identify duplicates / inconsistent naming
- [ ] identify fields that are collected but never used
- [ ] identify data that should be collected but is missing

## D. Integration audit
- [ ] what system gets the lead after ManyChat?
- [ ] email platform
- [ ] spreadsheet / CRM
- [ ] Shopify / ecommerce tags
- [ ] Zapier / webhook workflows
- [ ] where collector stage is actually stored

## E. Brand / messaging audit
- [ ] does the language sound like Sarah?
- [ ] does it feel warm and premium?
- [ ] does it feel too salesy or robotic?
- [ ] are there messages that overpromise or feel canned?

---

# 3) What We Need to Learn About Sarah's Current Setup

Before building further, we should answer these:

## Funnel / offer questions
1. What are Sarah's current lead magnets or DM-worthy offers?
2. What social posts generate the most comments and DMs?
3. What offers matter most right now?
   - prints
   - originals
   - commissions
   - waitlists
   - educational products
4. What is the real desired next step after a DM?

## Tooling questions
5. Where should ManyChat send collected emails?
6. Is the source of truth Shopify, email software, Sheets, or something else?
7. Are there already Zapier automations tied to ManyChat tags?

## Segmentation questions
8. Which customer types matter most to distinguish?
9. What buying-stage signals do we want to track?
10. What information would make Sarah's follow-up dramatically better?

## Operations questions
11. Which conversations should automatically hand off to Sarah?
12. Which messages are safe to automate?
13. Which collector interactions require approval before sending?

---

# 4) Recommended Standard Data Model

This is the proposed structure unless Sarah's current setup requires adaptation.

## Core fields
- first_name
- email
- instagram_handle (if available / useful)
- interest_primary
- buyer_stage
- use_case
- lead_source
- campaign_name
- raw_intent_response
- ai_intent_bucket
- vip_status
- repeat_collector_status

## Recommended interest buckets
- prints
- originals
- commissions
- gift
- designer_trade
- browsing
- can't_determine

## Recommended buyer-stage buckets
- hot_now
- this_month
- exploring
- inspiration_only
- repeat_buyer
- vip

## Recommended use-case buckets
- home
- office
- gift
- client_project
- nursery_family_space
- unknown

## Recommended lead-source patterns
- ig_comment
- ig_story
- ig_dm
- launch_waitlist
- guide_download
- studio_sale
- collection_drop

---

# 5) Recommended Tag Naming Convention

Tags should be clean, sparse, and purposeful.

## Proposed convention
`category:value`

Examples:
- `source:ig-comment`
- `campaign:fall-drop`
- `interest:prints`
- `interest:originals`
- `stage:hot`
- `stage:exploring`
- `collector:repeat`
- `collector:vip`
- `offer:collector-guide`
- `offer:early-access`
- `offer:commission-inquiry`

## Rules
- avoid near-duplicates
- avoid plain-English one-off tags that don't fit the system
- use tags for routing / categorization
- use custom fields for structured reusable data

---

# 6) First Two Priority Automations

These should be the first focus unless audit findings strongly suggest otherwise.

## Priority Flow 1: Collector Guide / Free Resource Flow

### Purpose
Capture warm social engagement and convert it into email + intent data.

### Best trigger types
- Instagram post comment keyword
- reel comment keyword
- story CTA / DM keyword

### Suggested offer examples
- collector guide
- room styling guide
- early access preview guide
- how to choose the right art for your space

### Proposed flow structure
1. Trigger via keyword/comment
2. DM reply with clear CTA button
3. Check if email already exists
4. Collect email if missing
5. Check if first name exists
6. Collect first name if missing
7. Deliver promised resource
8. Ask one intent question
9. Save raw response
10. Bucket user into segment manually or via AI
11. Apply relevant tags
12. Route into appropriate follow-up

### Intent question examples
- "Are you mostly looking for prints, originals, or something custom?"
- "What kind of space are you shopping for?"
- "Are you collecting for yourself, a client, or as a gift?"

### Success metrics
- opt-in completion rate
- email capture rate
- intent-question completion rate
- clickthrough to next step
- downstream purchase or inquiry rate

---

## Priority Flow 2: Collection Early-Access / Waitlist Flow

### Purpose
Convert launch interest into a segmented warm list before public drop.

### Best trigger types
- comment keyword on teaser post
- story DM keyword
- launch announcement CTA

### Proposed flow structure
1. Trigger from launch content
2. DM opt-in button
3. Check for existing contact fields
4. Collect missing data
5. Add to early-access list
6. Ask one segmentation question
7. Tag by interest / buying context
8. Route toward reminders / previews / VIP follow-up

### Example segmentation questions
- "Are you hoping to find an original, a print, or just get first look access?"
- "Are you shopping for your home, a client, or as a gift?"
- "Do you want the first preview only, or the full launch reminders too?"

### Success metrics
- waitlist growth
- preview engagement
- launch-day clicks
- purchases attributed to waitlist

---

# 7) Secondary Automations to Consider Later

## A. Commission Qualification Flow
Use for warm inbound interest, but keep handoff strong.

## B. VIP / Repeat Collector Flow
Useful for high-value relationship nurture.

## C. Event / Open Studio RSVP Flow
If Sarah runs live or local events.

## D. Starter Kit / Educational Flow
Only if educational offers remain strategic.

---

# 8) Human Handoff Rules

ManyChat should route, qualify, and support — not overplay its role.

## Auto-safe interactions
- guide delivery
- waitlist signup
- launch reminders
- category routing
- FAQ-lite answers
- email collection

## Human review / handoff required
- commissions with specifics
- custom pricing nuance
- shipping exceptions
- VIP collector relationship management
- one-of-one hold requests
- emotionally personal customer messages
- discount or negotiation scenarios

## Suggested handoff triggers
If a user mentions:
- budget
- custom size
- gift urgency
- emotional life event
- shipping concern
- wanting Sarah's opinion personally

...the system should tag for human follow-up.

---

# 9) Suggested AI Use Inside ManyChat

AI should be used selectively.

## Good uses
- bucketing open-text intent responses
- classifying buyer type
- identifying likely product category interest
- identifying if a response needs human follow-up

## Bad uses
- writing long fake-personal messages automatically
- improvising nuanced commission responses
- making promises on Sarah's behalf
- replacing judgment for VIP/high-value leads

## Rule
Always preserve:
- the original user response
- the AI bucket

Never keep only the AI interpretation.

---

# 10) Build Standards for Every New Flow

Every new flow should document:
- objective
- trigger
- promised value
- required collected data
- custom fields used
- tags used
- integration destination
- human handoff conditions
- metrics to watch
- owner / maintainer

## Required quality checks
- Does it sound like Sarah?
- Does it ask for only necessary info?
- Does it skip fields we already know?
- Does it deliver value quickly?
- Does it have a handoff path?
- Does it avoid awkward over-automation?

---

# 11) Audit Template for Existing Flows

Use this block repeatedly for each current ManyChat automation.

## Flow record template
**Flow name:**  
**Status:** active / paused / stale / broken  
**Primary purpose:**  
**Trigger:**  
**Channel:**  
**Main CTA:**  
**Tags applied:**  
**Custom fields used:**  
**Destination system:**  
**Follow-up logic:**  
**Human handoff present?:** yes / no  
**Known performance:**  
**Problems observed:**  
**Keep / improve / retire:**  

---

# 12) Recommended Immediate Next Actions

## Action 1
Audit Sarah's live ManyChat account and inventory every active automation.

## Action 2
Extract all current tags + custom fields into this doc or a companion appendix.

## Action 3
Identify the current best candidate for:
- guide flow
- early-access flow

## Action 4
Choose the system of record for contact data and buyer-stage tracking.

## Action 5
Build or refine the two priority flows using the standards above.

---

# 13) Lessons Learned Log

Add findings here as we work.

## Initial assumptions
- ManyChat is best used as a friction-reducing, intent-capturing layer.
- Sarah's brand needs softer, more human messaging than generic creator funnels.
- Segmentation should improve product fit and handoff quality, not just push sales.
- Conditions and clean data structure are mandatory from the start.

## To learn from real usage
- Which keywords convert best
- Which offers produce the best opt-in rate
- Which segmenting question produces the best data
- Which tags actually help Sarah follow up
- Where automation helps vs annoys
- Whether voice-note style messaging improves trust or feels too automated

---

# 14) Companion Docs

- `shared/sarah-agent/projects/manychat-masterclass-reference.md`
- future suggested doc: `shared/sarah-agent/projects/sarah-manychat-live-audit.md`
- future suggested doc: `shared/sarah-agent/projects/sarah-manychat-tag-map.md`

---

# 15) Owner Note for Clawd + Arty

When using ManyChat for Sarah, optimize for:
- trust
- warmth
- elegance
- signal capture
- smart handoff

Not just raw automation.

The system should make Sarah feel more present and more organized — not more robotic.
