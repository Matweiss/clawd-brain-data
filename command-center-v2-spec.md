# Clawd Command Center V2 — Final Spec

**Created:** 2026-02-03
**Status:** Approved, ready for execution

---

## Sheet Structure (4 tabs)

| Tab | Purpose |
|-----|---------|
| **Today** | Single view: stale deals + today's meetings + pending actions + KPI summary row at top |
| **Pipeline** | Full deal list (agent updates, Mat rarely looks) |
| **Log** | Historical record of actions taken + sign-offs |
| **Research Cache** | Cached contact/company data from browser lookups |

---

## Cron Schedule

| Job | Time | What It Does |
|-----|------|--------------|
| **Weekly Research** | Sunday 8 PM PT | Pre-research all meetings scheduled for the week |
| **Nightly Research** | 10 PM PT, Mon-Thu | Top up any new meetings added that day |
| **Morning Briefing** | 7:00 AM PT, Mon-Fri | Stale deals + today's meetings + inbox scan + update Today tab + check Log for sign-offs |
| **Pre-Meeting Prep** | Every 15 min, Mon-Fri | Check for meetings in 45 min → Battle Card (one per meeting, first trigger wins) |
| **Midday Pulse** | 1:00 PM PT, Mon-Fri | Only fires if urgent trigger detected |

---

## Midday Pulse Triggers (must meet one)

- New inbound email from active deal (🔴 High priority)
- Deal moved to Contract stage
- Meeting added/cancelled for today
- Escalation keyword detected: "urgent", "asap", "contract", "signed", "cancel", "issue"

If no triggers → stays quiet.

---

## Stale Deal Thresholds

| Stage | Name | Stale After |
|-------|------|-------------|
| 0 | Qualification | 7 days |
| 1 | Discovery | 5 days |
| 2 | Proposal | 4 days |
| 3 | Negotiation | 4 days |
| 4 | Contract | 3 days |

### Next Action Proposals

| Scenario | Proposed Action |
|----------|-----------------|
| No response to email | "Call — no email response in X days" |
| Proposal sent, no reply | "LinkedIn touch — they opened proposal but went silent" |
| Generic staleness | "Send check-in email (draft ready)" |
| Meeting no-show | "Reschedule outreach — missed last call" |

---

## Research Cache TTL

| Data Type | TTL | Refresh Trigger |
|-----------|-----|-----------------|
| Contact data | 30 days | Auto-expire |
| Company data | 90 days | Auto-expire |
| Job title | 30 days | Flag for refresh if deal becomes active |

---

## Browser Research Strategy

### Batch Research (not on-demand)

| When | What |
|------|------|
| Sunday 8 PM | Pre-research all meetings for the week |
| Nightly 10 PM | Top up new meetings added that day |
| Morning Briefing | **Never** — too slow |

### Platform Limits

**LinkedIn (highest risk):**
- Max 3 lookups per day
- Random delays 2-5 sec between actions
- If CAPTCHA/block → stop immediately, alert via Telegram
- Consider optional — ZoomInfo often sufficient

**ZoomInfo (lower risk):**
- Max 5 lookups per session
- 30 sec timeout per lookup
- If lookup fails, log and move on (no retry same session)

### Fallback Order

1. HubSpot data
2. Research Cache
3. ZoomInfo (browser)
4. LinkedIn (browser, last resort — only for mutual connections/recent posts)

---

## Battle Card Structure

- HubSpot deal history + notes
- Avoma transcript from last meeting
- Cached research (if available)
- Research Status: `[Cached ✓ | Needs lookup | Skipped — low priority]`

Live browser lookup only if: cache empty AND high-value meeting.

---

## Email Reply Detection

| Inbound Type | Priority | Action |
|--------------|----------|--------|
| From prospect in pipeline (TO:) | 🔴 High | Draft reply, flag in Today |
| From prospect not in pipeline | 🟡 Medium | Flag for review |
| CC'd to Mat (not TO:) | ⚪ Low | Ignore unless keywords |
| Automated / newsletters | ❌ Skip | Ignore |

**Escalation keywords:** "urgent", "asap", "contract", "signed", "cancel", "issue"

---

## Sign-off Feedback Loop

During Morning Briefing:
1. Check Log tab for items marked "Done"
2. Clear completed items from Today tab
3. Track Mat's response time (for tuning alert urgency)

---

## Pre-Meeting Deduplication

**One Battle Card per meeting** (first trigger wins).

No second "starting soon" nudge — single 45-min warning is sufficient.

---

## Voice Evolution (Weekly)

Every Monday:
1. Pull 5 most recent sent emails to prospects
2. Extract patterns (openers, sign-offs, tone shifts)
3. Propose updates to voice guide in Telegram
4. Mat approves before changes take effect

---

## Guardrails

- **Gmail:** Drafts only, NEVER send on Mat's behalf
- **Weekends:** No messages (Sat-Sun are for Sarah, Diggy, Theo, family)
- **Browser:** Rate limits strictly enforced
- **LinkedIn:** Alert immediately if blocked

---

## Execution Phases

### Phase 1 (Today)
- [ ] Create V2 Sheet with 4 tabs
- [ ] Set up Morning Briefing cron (7am Mon-Fri)
- [ ] Set up Pre-Meeting Prep cron (every 15 min Mon-Fri)
- [ ] Run first test briefing

### Phase 2 (Tomorrow)
- [ ] Build Battle Card generator with research cache
- [ ] Wire email draft creation with reply detection
- [ ] Set up Midday Pulse cron
- [ ] Set up Weekly Research cron (Sunday 8pm)
- [ ] Set up Nightly Research cron (10pm Mon-Thu)

### Phase 3 (Week 1)
- [ ] Set up weekly voice evolution job
- [ ] Monitor and tune
- [ ] Add Brave Search if API key provided
