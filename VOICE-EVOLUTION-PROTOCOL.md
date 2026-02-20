# Voice Evolution Protocol

**Purpose:** Continuously improve Mat's voice model by learning from actual emails he sends  
**Status:** Active  
**Created:** 2026-02-19

---

## Overview

The voice style guide is a **living document** that evolves as Mat's communication patterns change or as I discover new patterns from his actual sent emails.

**Baseline:** `MAT-VOICE-STYLE-GUIDE.md` (from analyzed email corpus)

**Evolution Method:** Review Mat's sent emails weekly → Identify new patterns → Update style guide

---

## Weekly Voice Review Process

### Every Sunday at 8 PM Pacific (Automated)

1. **Fetch Mat's sent emails** from the past 7 days via Gmail API
2. **Analyze for patterns:**
   - New greeting variations
   - New closing patterns
   - New common phrases
   - New humor styles
   - Subject line patterns
   - Response length trends
   - Formatting changes

3. **Compare against current style guide:**
   - Identify **new patterns** not in the guide
   - Identify **changed patterns** (frequency shifts)
   - Identify **deprecated patterns** (Mat stopped using)

4. **Generate update recommendations:**
   - List proposed additions to style guide
   - List proposed modifications
   - List proposed removals

5. **Present to Mat for approval:**
   - Send weekly voice evolution report via Telegram
   - Include examples from actual emails
   - Mat approves/rejects/modifies suggestions

6. **Update style guide:**
   - Apply approved changes to `MAT-VOICE-STYLE-GUIDE.md`
   - Commit with message: "Voice evolution: [summary of changes]"
   - Version the guide (add changelog section)

---

## On-Demand Voice Learning

**Trigger:** Mat sends feedback on a draft email

**Process:**

1. **Mat reviews draft** and says:
   - "This feels off" → I ask what specifically
   - "I'd say it like this instead" → I capture the alternative
   - "Too formal" / "Too casual" → I adjust tone calibration

2. **I extract the lesson:**
   - What was wrong in my draft?
   - What would Mat have written instead?
   - What's the pattern I missed?

3. **I update the style guide immediately:**
   - Add new pattern or refinement
   - Include the example from the feedback
   - Commit with message: "Voice refinement: [what I learned]"

4. **I apply the lesson to future drafts**

---

## Voice Model Components

### 1. Core Patterns (Stable)
- Greeting format
- Signature block
- No closing phrases
- Short paragraphs
- Direct tone

**Update frequency:** Rarely (only if Mat explicitly changes his approach)

### 2. Contextual Patterns (Semi-Stable)
- Re-engagement humor (food analogies)
- Well-wishes customization
- Apology phrasing
- Call-to-action language

**Update frequency:** Monthly (as I notice variations in usage)

### 3. Dynamic Patterns (Evolving)
- Current catchphrases
- Seasonal references
- Industry-specific language
- Client-specific customizations

**Update frequency:** Weekly (as patterns emerge)

---

## Learning Sources

### Primary Sources (High Priority)
1. **Mat's sent emails** (Gmail API)
   - Most direct evidence of voice
   - Weekly review of last 7 days
   - Monthly deep-dive of last 30 days

2. **Mat's feedback on my drafts**
   - Real-time corrections
   - Highest signal for improvement
   - Immediate style guide updates

### Secondary Sources (Medium Priority)
3. **Mat's voice memos** (if transcribed)
   - Spoken vs. written differences
   - Natural phrasing patterns

4. **Mat's Telegram messages to me**
   - Informal communication style
   - Quick-reply patterns

### Tertiary Sources (Low Priority, Context Only)
5. **HubSpot notes/comments** by Mat
   - CRM-specific language
   - Deal context patterns

---

## Pattern Analysis Framework

### When analyzing emails, I look for:

**Greeting Analysis:**
- First word (Hey, Hi, Hello, [Name])
- Punctuation (exclamation, comma, none)
- Formality level
- Frequency distribution

**Body Analysis:**
- Average paragraph length
- Sentence structure complexity
- Humor insertion points
- Link placement patterns
- Question frequency
- Proactive vs. reactive language

**Closing Analysis:**
- Last sentence type (question, statement, call-to-action)
- Signature block variations
- Closing phrase usage (should be zero)

**Tone Analysis:**
- Formality score (1-10, Mat typically 2-4)
- Enthusiasm level (exclamation points, word choice)
- Humor presence (yes/no, type)
- Empathy markers ("Hope you're well", apologies)

**Context Analysis:**
- Email type (initial outreach, follow-up, re-engagement, quick reply)
- Recipient type (prospect, customer, internal, partner)
- Urgency level (immediate, normal, low)
- Relationship stage (cold, warm, hot)

---

## Version Control

**Style Guide Versioning:**

```
MAT-VOICE-STYLE-GUIDE.md
---
Version: 1.0 (2026-02-19) - Baseline from email corpus analysis
Version: 1.1 (2026-02-26) - Added new re-engagement patterns from week of Feb 19-26
Version: 1.2 (2026-03-05) - Refined signature block usage based on feedback
...
```

**Changelog Section (at end of style guide):**

```markdown
## Changelog

### Version 1.2 (2026-03-05)
- **Added:** New closing pattern "Looking forward to it!" (used 3x this week)
- **Modified:** Re-engagement humor now includes sports analogies (not just food)
- **Removed:** "Hope things are well" (Mat shifted to "Hope you're doing well")

### Version 1.1 (2026-02-26)
- **Added:** Subject line patterns (Re: [Topic], Quick question about [X])
- **Modified:** Greeting for multiple recipients (now lists all names vs "Hey Team")

### Version 1.0 (2026-02-19)
- **Baseline:** Initial style guide from analyzed email corpus
```

---

## Quality Assurance

### Before sending a draft to Mat, I will:

1. **Voice check against style guide:**
   - Greeting matches pattern ✓
   - No closing phrase ✓
   - Signature block included ✓
   - Tone matches context ✓
   - Humor appropriate for relationship stage ✓

2. **Pattern verification:**
   - Compare to recent emails Mat sent in similar context
   - Ensure consistency with current version of style guide

3. **Self-critique:**
   - Would Mat actually write this?
   - Does it feel authentic or generic?
   - Is the humor forced or natural?

4. **Flag uncertainties:**
   - If I'm not sure about a phrase → ask Mat
   - If context is unclear → gather more info first
   - If tone feels off → explain why and ask for guidance

---

## Success Metrics

**Goal:** Mat approves 90%+ of drafts on first review (within 3 months)

**Tracking:**
- Drafts created
- Drafts approved as-is
- Drafts needing minor edits
- Drafts needing major rewrites
- Patterns learned from feedback

**Monthly Review:**
- What patterns am I still getting wrong?
- What patterns am I nailing?
- What new patterns have emerged?
- How has Mat's voice evolved?

---

## Example Evolution Scenario

**Week 1 (Feb 19-26):**
- Style guide v1.0 established
- I draft 5 emails
- Mat approves 3, edits 2
- Edits reveal: Mat now uses "Excited to chat!" more than "Let me know"

**Week 2 (Feb 26-Mar 5):**
- I analyze Mat's sent emails from past week
- Notice 4 instances of "Excited to chat!" vs 1 of "Let me know"
- Update style guide v1.1: Add "Excited to chat!" as preferred call-to-action
- Draft 5 emails using new pattern
- Mat approves 4, edits 1
- Improvement trend positive

**Week 3 (Mar 5-12):**
- Continue monitoring
- Mat's approval rate increases to 5/5
- Voice model is now well-calibrated
- Continue weekly reviews to catch future shifts

---

## Implementation

**Cron Job Setup:**

```
Name: Weekly Voice Evolution Review
Schedule: Every Sunday at 8 PM Pacific
Action:
  1. Fetch Mat's sent emails (last 7 days)
  2. Analyze patterns
  3. Generate evolution report
  4. Send to Mat via Telegram for review

Name: Monthly Voice Deep-Dive
Schedule: First Sunday of month at 8 PM Pacific
Action:
  1. Fetch Mat's sent emails (last 30 days)
  2. Comprehensive pattern analysis
  3. Compare to style guide versions over time
  4. Identify long-term trends
  5. Recommend major updates if needed
```

---

## Mat's Role

**Weekly (5 minutes):**
- Review voice evolution report
- Approve/reject/modify suggested updates
- Provide feedback on draft quality

**On-Demand (as needed):**
- Correct drafts that feel "off"
- Explain why a phrase doesn't work
- Suggest alternatives when I miss the mark

**Monthly (15 minutes):**
- Review monthly voice deep-dive report
- Discuss any major shifts in communication style
- Approve significant style guide updates

---

**Bottom Line:** This voice model is NEVER static. It learns from every email Mat sends, every piece of feedback he gives, and every correction he makes. Over time, my drafts will become indistinguishable from what Mat would write himself.

**Mat's Directive:** "I want this to be ever evolving. Review emails that I send and continue to improve but this is a great baseline."

**Clawd's Commitment:** I will treat this as a living, breathing model that grows with you. Every week, I'll get better at sounding like Mat. Every month, I'll adapt to how your voice evolves. This is the baseline — but we're only getting started.
