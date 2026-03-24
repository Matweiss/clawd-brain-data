# Sarah's Art Assistant — Agent Design Specification

**Version:** 1.0  
**Date:** 2026-03-21  
**Based on:** Interview with Sarah Schwartz (sarahjschwartz.com)  
**Store:** yr5azj-q0.myshopify.com

---

## Agent Identity

**Name:** Sarah's Art Assistant (or "Gallery Assistant")  
**Emoji:** 🎨  
**Persona:** Playful but elevated, warm and friendly, minimalist aesthetic  
**Voice:** Professional artist studio manager who understands the business side  
**Core Principle:** Human-in-the-loop for all customer-facing actions

---

## Mission Statement

> Automate the repetitive, preserve the personal. Handle Shopify operations, collector retention, and business insights so Sarah can focus on creating art and personal connections.

---

## Core Capabilities (Priority Order)

### 🔴 P0 — Critical (Immediate Implementation)

#### 1. Product Upload Automation
**Pain Point:** Uploading products is the #1 time sink  
**Solution:**
- Receive product specs (images, dimensions, price, description) from Sarah
- Draft complete Shopify product pages
- Include proper categorization (minis/darlings/babes/gems)
- Set "orphan" status for newsletter-first launches
- Send to Sarah for review before publishing

**Input:** Images + specs (via chat, email, or form)  
**Output:** Draft product in Shopify (hidden/orphan status)  
**Human Gate:** Sarah reviews and clicks "Publish"

---

#### 2. Personalized Landing Page Management
**Pain Point:** 40+ landing pages, manually updated when pieces sell  
**Solution:**
- Monitor inventory changes via Shopify API
- When piece sells: automatically update all landing pages featuring that piece
- Replace sold piece with similar available piece (based on style/size/price)
- Alert Sarah of changes for review

**Trigger:** Inventory status change in Shopify  
**Output:** Updated landing pages + summary notification  
**Human Gate:** Auto-update with notification (low risk) OR draft changes for approval

---

#### 3. Daily Morning Dashboard
**Pain Point:** No quick overview of business health  
**Solution:**
- Send daily summary each morning (~8 AM PT)
- Include:
  - Website visits (yesterday)
  - Most clicked piece/collection
  - Items added to carts
  - New subscribers (yesterday + total)
  - New starter kit waitlist signups
  - Social media traffic sources
  - Collector birthdays today
  - Any orders needing attention

**Frequency:** Daily  
**Channel:** Telegram/WhatsApp/Email (Sarah's preference)  
**Format:** Brief, scannable, actionable

---

### 🟡 P1 — High Priority (Next Sprint)

#### 4. Birthday Month Program
**Pain Point:** Ready to implement, high collector value, big upfront lift  
**Solution:**
- Collect birthdays via Shopify signup form
- Store in database
- Send automated emails: "Happy Birthday Month! Here's your 15% off"
- Track redemptions
- Monthly report on program performance

**Trigger:** 1st of each month (for that month's birthdays)  
**Output:** Draft emails for Sarah approval → auto-send on approval  
**Human Gate:** Monthly batch approval before send

---

#### 5. Newsletter Drafting
**Pain Point:** Weekly time sink  
**Solution:**
- Identify new pieces added to Shopify (orphan status)
- Draft newsletter with:
  - Hero image of newest/most popular piece
  - 3-5 featured pieces
  - "Available now" vs "Sold" status
  - Links to personalized landing pages for repeat collectors
- Send draft to Sarah by Friday morning

**Frequency:** Weekly (Friday draft for Saturday send)  
**Output:** Draft in Shopify Email  
**Human Gate:** Sarah edits and clicks send

---

#### 6. Collector Retention Alerts
**Pain Point:** Losing touch with high-value collectors  
**Solution:**
- Track 10x star collectors (10+ orders = free shipping for life)
- Alert if no purchase in 3 months
- Draft "We miss you" email with personalized recommendations
- Alert Sarah of upcoming collector birthdays for personal outreach

**Trigger:** Daily scan  
**Output:** Alert + draft message  
**Human Gate:** Sarah approves/denies retention outreach

---

### 🟢 P2 — Medium Priority (Future)

#### 7. Shipping & Fulfillment Alerts
- Monitor Pirate Ship/Shopify for delayed packages
- Alert Sarah when package is stuck/delayed
- Track delivery confirmations
- Draft testimonial request email after delivery (3-5 days later)

---

#### 8. Testimonial Collection
- Auto-add testimonials to "Wall of Love" page when received
- Draft Instagram post featuring collector + testimonial
- Track testimonial-to-purchase conversion

---

#### 9. Referral Program
- Track "gift" purchases
- Count toward 10x star status
- Draft referral program launch materials
- Auto-apply referral discounts

---

### 🔵 P3 — Future Exploration

#### 10. Facebook Ads Management
- Reallocate marketing budget to FB ads
- Create/monitor ad campaigns
- A/B test creative
- Report on ROAS

---

## Technical Architecture

### Integrations Required

| Integration | Purpose | Priority |
|-------------|---------|----------|
| **Shopify Admin API** | Products, orders, customers, inventory | P0 |
| **Shopify Email** | Newsletter drafting | P1 |
| **Telegram/WhatsApp** | Daily alerts, notifications | P0 |
| **Gmail** | Customer communication backup | P2 |
| **Manychat** | Instagram automation | P3 |
| **Facebook Ads Manager** | Ad campaigns | P3 |

### Data Storage

```
/sarah-art-assistant/
├── collectors/
│   ├── {customer_id}.json (purchase history, birthday, star status)
│   └── landing-pages.json (which collector has which landing page)
├── products/
│   └── {product_id}.json (synced from Shopify)
├── landing-pages/
│   ├── {page_id}.json (which products featured)
│   └── update-log.json (when pieces were swapped)
├── birthday-program/
│   ├── subscribers.json
│   └── sent-emails.json
└── reports/
    ├── daily-snapshots.json
    └── weekly-newsletter-drafts.json
```

### Automation Workflows

```
PRODUCT UPLOAD WORKFLOW
Sarah sends images/specs → Agent drafts product → Sarah reviews → Publishes

LANDING PAGE UPDATE WORKFLOW
Product sells in Shopify → Agent identifies affected pages → Replaces with similar piece 
→ Logs change → Notifies Sarah

DAILY DASHBOARD WORKFLOW
6 AM PT: Query Shopify API → Compile metrics → Format message → Send to Sarah

BIRTHDAY PROGRAM WORKFLOW
1st of month: Query birthdays → Draft emails → Sarah approves batch → Auto-send daily

NEWSLETTER WORKFLOW
Friday 9 AM: Identify new pieces → Draft newsletter → Send to Sarah → Saturday send
```

---

## Human-in-the-Loop Design

### Approval Required (Always)
- Publishing products
- Sending newsletters
- Customer retention emails
- Landing page changes (initially — can be auto after trust established)
- Any customer-facing communication

### Notification Only (Auto-execute)
- Daily dashboard
- Inventory alerts
- Birthday reminders for Sarah to personally reach out
- System health reports

### Phased Trust Model

**Phase 1 (Month 1-2):** Everything requires approval  
**Phase 2 (Month 3-4):** Low-risk items auto-execute with notification  
**Phase 3 (Month 5+):** Sarah decides what stays manual vs. automated

---

## Communication Channels

### Primary: Telegram/WhatsApp
- Daily dashboard
- Approval requests (with one-tap approve/deny buttons)
- Urgent alerts

### Secondary: Email
- Weekly newsletter drafts
- Monthly reports
- Birthday program batch approvals

### Tertiary: Shopify
- Draft products
- Draft emails
- Dashboard widgets

---

## Success Metrics

### Efficiency
- [ ] Product upload time: 30 min → 5 min (with review)
- [ ] Landing page updates: Manual → Auto with notification
- [ ] Newsletter drafting: 2 hours → 15 min (with review)

### Business Impact
- [ ] Daily dashboard provides actionable insights
- [ ] Birthday program launches successfully
- [ ] 10x star retention improves
- [ ] Personalized landing pages stay current automatically

### Quality
- [ ] Zero customer-facing errors (human review catches all)
- [ ] Sarah feels in control
- [ ] Brand voice maintained across all automated content

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Shopify Admin API integration (read-only)
- [ ] Daily dashboard MVP
- [ ] Basic collector data sync

### Week 2: Product Workflow
- [ ] Product drafting from specs
- [ ] Human approval flow
- [ ] Orphan product creation for newsletter-first launches

### Week 3: Landing Pages
- [ ] Landing page inventory tracking
- [ ] Auto-update logic
- [ ] Change notifications

### Week 4: Newsletter & Birthdays
- [ ] Newsletter drafting
- [ ] Birthday program signup tracking
- [ ] Email template creation

### Week 5: Polish & Test
- [ ] End-to-end testing
- [ ] Sarah training
- [ ] Feedback loop setup

---

## Open Questions

1. **Product spec format:** How will Sarah send product details? (Form, chat, email, photo with voice note?)
2. **Landing page similarity:** How to determine "similar" pieces for auto-replacement? (Style, size, price, color?)
3. **Newsletter timing:** Exact deadline for Friday draft → Saturday send?
4. **Birthday discount:** What discount code/value?
5. **Daily dashboard time:** Preferred delivery time? (8 AM PT?)
6. **Manychat integration:** Does Sarah want to set this up, or should agent help?

---

## Appendix: Sarah's Key Quotes

> "I want to oversee everything in the beginning... sign off on everything before publication."

> "The biggest pain point is uploading products and making new products for Shopify."

> "The personalized landing pages are a major manual burden — 40 pages to update when something sells."

> "Brand voice: Playful but elevated, warm and friendly, a little minimalist."

> "Handwritten notes, Instagram DMs — those stay human. Everything else can be automated."

---

## Appendix B: Tool Stack (Integration Targets)

**Documented:** 2026-03-23  
**Source:** Mat confirmed these are Sarah's active business tools

### Shipping & Fulfillment
- **Pirate Ship** — Primary shipping platform

### Marketing Automation  
- **Manychat** — Instagram DM automation, Messenger bots, SMS flows

### Social Media Platforms
- **Instagram** — Primary visual platform (Shop, Stories, Posts, Reels)
- **TikTok** — Short-form video content
- **Facebook** — Page management, groups
- **Pinterest** — Visual discovery, auto-pinning
- **Threads** — Text-first content
- **Reddit** — Community engagement (requires careful approach)

### Integration Roadmap
1. **Phase 1:** Pirate Ship, Instagram, Manychat
2. **Phase 2:** Pinterest, TikTok, Facebook  
3. **Phase 3:** Threads, Reddit (with human approval)

**Full details:** See `sarah-tool-stack.md`

---

*Design spec based on interview conducted 2026-03-21*  
*Agent to be built using Shopify Admin API + OpenClaw*  
*Human-in-the-loop for all customer-facing actions*
