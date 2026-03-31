# Dashboard V2 Roadmap — Sarah J. Schwartz Fine Art

Generated: 2026-03-30

## Goal
Turn the morning dashboard from a status message into a compact operator cockpit for Sarah.

---

## North Star
By default, Sarah should be able to open the morning dashboard and immediately know:
- Did sales happen?
- Is audience growth happening?
- Is collector momentum growing?
- Is anything time-sensitive today?
- Where should attention go first?

---

## V2 Principles
- Mobile-first
- Only real data, no fake metrics
- Small number of high-signal sections
- Explain momentum, not just totals
- Favor actionability over completeness

---

## Recommended V2 Sections

### 1. Revenue Snapshot
Keep:
- orders
n- sales
Add:
- AOV
- unique buyers
- top-selling piece
- change vs previous day

### 2. Audience Growth
Keep:
- newsletter total
- newsletter new yesterday
- starter kit total
- starter kit new yesterday
Add:
- weekly deltas
- strongest acquisition signal if derivable

### 3. Collector Momentum
Add:
- repeat collectors yesterday
- 10x collector status
- biggest collector activity change

### 4. Fulfillment / Customer Care
Keep:
- deliveries today
Add:
- orders needing follow-up if derivable
- VIP collector shipments

### 5. One-Line Recommendation
Add a final action recommendation such as:
- "Follow up with yesterday's two collectors"
- "Audience grew but sales were quiet — good day for a studio/story post"
- "Starter kit interest is holding — consider a soft CTA this week"

---

## V2 Build Tiers

## Tier 1 — immediate, no new integrations
- AOV
- unique buyers
- total items sold
- top-selling piece
- trend comparisons from snapshot
- better insight logic
- starter kit history tracking

## Tier 2 — moderate effort
- repeat buyer logic
- 10x collector tracking
- VIP collector annotations
- simple recommendations engine

## Tier 3 — requires external source clarity
- website traffic
- traffic sources
- top clicked collection
- cart activity
- birthday reminders from actual CRM/metafields

---

## Best Skill / Capability Opportunities

### Existing skills worth applying
1. **memory-assist**
   - record what was fixed and current live dashboard state
   - keep Sarah dashboard continuity crisp across sessions

2. **skill-creator**
   - only if we decide to formalize a reusable `shopify-dashboard-metrics` skill

3. **coding-agent**
   - best for larger structured refactors or if we split dashboard logic into modules

### New skill ideas worth creating later
1. **shopify-metrics**
   - reusable helpers for orders, subscribers, tags, repeat buyers, VIP logic
   - could power more than just this dashboard

2. **sarah-dashboard-operator**
   - a Sarah-specific skill that defines tone, section ordering, and business-relevant heuristics

3. **collector-intelligence**
   - identifies repeat buyers, VIP thresholds, birthdays, free-shipping qualifiers, and follow-up opportunities

Recommendation: **do not create new skills yet.** The dashboard is still evolving quickly. Keep improving the script first, then extract a skill once patterns stabilize.

---

## Best Functional Enhancements

### Highest ROI
1. Trend comparisons
2. AOV / unique buyers / items sold
3. Top piece summary
4. Better quick insight
5. Repeat buyer / collector activity

### Medium ROI
6. 10x collector tracker
7. VIP shipping/follow-up cues
8. lightweight recommendations engine

### Lower ROI until data exists
9. birthdays
10. traffic source breakdown
11. clicked collection analytics

---

## Suggested Builder Brief for Next Sprint
Ask the builder to produce a V2 dashboard that:
- preserves current live counts
- adds trend comparisons and order-quality metrics
- introduces repeat-buyer awareness
- upgrades the final insight to a recommendation
- does not add fake analytics sections

---

## Success Criteria
V2 is successful if Sarah can answer these in under 10 seconds from one dashboard message:
- How much sold yesterday?
- Did the audience grow?
- Is starter kit interest growing?
- Are collectors returning?
- What should I pay attention to today?
