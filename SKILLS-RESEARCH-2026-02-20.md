# OpenClaw Skills Research - 2026-02-20

**Research Goal:** Identify useful skills from ClawHub to enhance my capabilities as Mat's assistant

**Research Method:** Searched ClawHub registry across key categories relevant to Mat's needs

---

## 🎯 TOP RECOMMENDATIONS (Priority Order)

### 1. **HubSpot Skill** ⭐ HIGHEST PRIORITY
- **Slug:** `hubspot`
- **Version:** v1.0.1
- **Why:** Mat uses HubSpot daily for pipeline management
- **Current Status:** I have HubSpot API access (manual scripts only)
- **Benefit:** Native skill integration could simplify:
  - Pipeline queries
  - Deal updates
  - Contact management
  - Activity logging
- **Next Step:** Review skill to see if it improves on current custom scripts

---

### 2. **Elite Longterm Memory** 🧠 HIGH PRIORITY
- **Slug:** `elite-longterm-memory`
- **Version:** v1.2.3
- **Score:** 3.638 (highest in memory category)
- **Why:** Enhanced memory management beyond current MEMORY.md system
- **Current Capability:** I have MEMORY.md + memory/*.md + qmd search
- **Potential Benefit:**
  - Better memory organization
  - Improved recall accuracy
  - Structured memory tiering
- **Question:** Does this complement or replace existing memory system?

---

### 3. **Google Calendar (gcalcli)** 📅 MEDIUM-HIGH PRIORITY
- **Slug:** `gcalcli-calendar`
- **Version:** v3.0.0
- **Why:** Mat has meetings I need to track for Battle Cards
- **Current Status:** I have Google Calendar OAuth access
- **Benefit:**
  - Easier meeting lookups
  - Calendar event creation (if permissions granted)
  - Availability checking
  - Meeting prep automation
- **Use Case:** "Pull Mat's meetings for next 48h" for proactive Battle Card prep

---

### 4. **Email Daily Summary** 📧 MEDIUM PRIORITY
- **Slug:** `email-daily-summary`
- **Version:** v0.1.0
- **Why:** Supports Mat's inbox monitoring needs
- **Current Status:** I have Gmail API access
- **Benefit:**
  - Auto-generate morning inbox summary
  - Flag important/urgent emails
  - Digest format for quick scan
- **Consideration:** Ensure it respects "draft only, never send" rule

---

### 5. **Schedule Skill** ⏰ MEDIUM PRIORITY
- **Slug:** `schedule`
- **Version:** v1.0.2
- **Why:** General scheduling utilities
- **Current Status:** I use cron for scheduling
- **Potential Benefit:**
  - Easier cron job management
  - Natural language scheduling
  - Recurring task setup
- **Consideration:** May overlap with existing cron capabilities

---

### 6. **Writing Assistant** ✍️ LOW-MEDIUM PRIORITY
- **Slug:** `writing-assistant`
- **Version:** v0.1.0
- **Why:** Could improve email draft quality
- **Current Status:** I draft emails using Mat's voice style guide
- **Benefit:**
  - Grammar/spelling checks
  - Tone analysis
  - Style consistency
- **Note:** Only useful if it respects custom voice guidelines

---

### 7. **Home Assistant Integration** 🏠 LOW PRIORITY
- **Slug:** `homeassistant-assist` or `mcp-hass`
- **Why:** Mat uses Home Assistant
- **Current Status:** I have Home Assistant API access via Mac node
- **Benefit:** Easier control of home automation
- **Priority:** Lower priority (Mat's workflow doesn't require heavy home automation)

---

## 🚫 SKILLS TO AVOID

### Salesforce Skills
- **Why:** Mat uses HubSpot, not Salesforce
- **Action:** Skip these

### Social Media Schedulers
- **Why:** Not part of Mat's current workflow
- **Action:** Skip unless Mat requests social posting capability

### Baby/Personal Tracking
- **Why:** Not relevant to Mat's use case
- **Action:** Skip

---

## 📊 RESEARCH SUMMARY

**Total Categories Searched:** 7
- Memory (10 results)
- Email (10 results)
- Calendar (10 results)
- CRM (10 results)
- HubSpot (2 results)
- Schedule (10 results)
- Assistant (10 results)

**Top 3 Most Relevant:**
1. HubSpot native skill (CRM integration)
2. Elite Longterm Memory (better recall)
3. Google Calendar/gcalcli (meeting automation)

**Installation Process:**
- Use `clawhub install <slug>` to install
- Skills go to `/data/.openclaw/workspace/skills/`
- Review SKILL.md before activating

---

## 🤔 QUESTIONS FOR MAT

Before installing, I need clarity on:

1. **HubSpot Skill:**
   - Should I install native HubSpot skill or keep custom scripts?
   - Current scripts work well — is there value in switching?

2. **Memory Enhancement:**
   - Do you want elite-longterm-memory to replace or complement current system?
   - Worth the complexity vs. current MEMORY.md + qmd?

3. **Calendar Integration:**
   - Should I install gcalcli for better calendar access?
   - Do you want me to CREATE calendar events, or just READ?

4. **Email Summary:**
   - Want daily inbox digest automation?
   - What time should it run? (Suggestion: 7 AM Pacific)

5. **Priority:**
   - Which ONE skill should I install first?
   - Should I install multiple, or test one at a time?

---

## 💡 MY RECOMMENDATION

**Install Order (if Mat approves all):**

1. **Start with `gcalcli-calendar`** — Low risk, high value for meeting prep
2. **Then `elite-longterm-memory`** — Test if it improves recall
3. **Then `hubspot`** — Only if it's better than current custom scripts
4. **Consider `email-daily-summary`** — If Mat wants morning digests
5. **Skip the rest** — Current capabilities are sufficient

**Reasoning:**
- Calendar skill has clear, immediate value (Battle Card automation)
- Memory skill could significantly improve long-term performance
- HubSpot skill needs evaluation (might not beat custom code)
- Email summary is "nice to have" but not critical
- Other skills don't address current pain points

---

## 🔧 NEXT STEPS

**Waiting for Mat's approval on:**
1. Which skills to install (recommend starting with gcalcli-calendar)
2. Permission to proceed with installation
3. Clarification on questions above

**Once approved, I will:**
1. Install skill via `clawhub install <slug>`
2. Review SKILL.md documentation
3. Test integration with existing workflow
4. Document results in memory
5. Report back to Mat with findings

---

**Research Completed:** 2026-02-20 04:18 AM EST
**Status:** Awaiting Mat's approval and guidance
