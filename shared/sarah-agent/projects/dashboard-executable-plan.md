# Sarah Dashboard — Executable Plan for Builder Agent

Generated: 2026-03-30
Owner: Clawd
Audience: Builder agent (GPT-5.4)
Status: Ready for execution in phases

---

## Executive Summary

The daily dashboard is now materially more reliable than before.

### Fixed already
- Shopify sales/orders are live
- Newsletter total is live and no longer hardcoded
- Starter kit waitlist total is live and distinct from newsletter
- Snapshot fallback uses prior real values instead of magic numbers
- Rolling sales/subscriber history is saved
- GraphQL customer pagination is in place

### Current live numbers from latest validation
- Newsletter subscribers: **498**
- Newsletter new yesterday: **7**
- Starter Kit waitlist: **27**
- Starter Kit new yesterday: **0**

### Highest-value next moves
1. Add trend lines/comparison logic from snapshot history
2. Add meaningful traffic/site activity data source
3. Add collector intelligence (repeat buyers / 10x collectors)
4. Add birthday tracking only if birthday data source becomes real

---

## Current Architecture

### Main file
`/root/.openclaw/workspace/shared/sarah-agent/projects/daily-dashboard.mjs`

### Supporting file
`/root/.openclaw/workspace/shared/sarah-agent/projects/dashboard-snapshot.json`

### Delivery path
`/root/.openclaw/workspace/shared/sarah-agent/projects/send-dashboard.sh`

### Schedule
Cron sends at 8am PST.

---

## Audit: What the dashboard now does well

### Reliable now
- Yesterday order count
- Yesterday sales total
- Top orders with customer names
- Newsletter total
- Newsletter new yesterday
- Starter kit waitlist total
- Starter kit new yesterday
- Recent in-transit deliveries
- Mobile-friendly message format

### Still weak / placeholder
- Traffic section = placeholder only
- Birthdays = placeholder only
- Quick insight = simple heuristic
- No repeat buyer / VIP collector intelligence yet
- No trend comparison shown in output despite history being saved

---

## Recommended Product Improvements

## Phase 1 — High-confidence UX improvements

### 1. Add day-over-day trend lines
Use `dashboard-snapshot.json` history to display:
- Sales vs previous day
- Newsletter growth vs previous day
- Starter kit growth vs previous day

**Desired output example:**
- Sales: $592.51 *(up from $0 yesterday)*
- Newsletter: 498 total *(+7 yesterday, +12 vs 7 days ago)*
- Starter Kit Waitlist: 27 total *(+0 yesterday, +3 this week)*

**Implementation notes**
- Read last entry in `salesHistory`
- Read last entry in `subscriberHistory`
- Add starter kit history as a new array in snapshot (`starterKitHistory`)

### 2. Improve Quick Insight logic
Current logic is just based on whether any orders happened.
Upgrade it to use the strongest signal available:
- If newsletter growth > 0 and orders = 0 → mention audience growth
- If orders > 1 → mention collector momentum
- If starter kit waitlist grew → mention passive-income signal
- If recent deliveries > 0 → mention fulfillment momentum

### 3. Add top piece / top SKU summary
From yesterday's orders, count line items and show:
- top-selling piece title
- units sold

This is immediately useful to Sarah and already derivable from Shopify orders.

---

## Phase 2 — Business intelligence upgrades

### 4. Add repeat buyer / collector activity
From recent orders, derive:
- repeat buyers yesterday
- order count per customer over all time if feasible
- identify high-value collectors / frequent buyers

**Lightweight implementation path:**
- Build a helper that counts customer order frequency from Shopify customer/order history
- Surface a simple section:
  - `Returning collectors yesterday: 1`
  - `Top active collector: Ashley Wall (13 orders all time)`

### 5. Add 10x collector tracking
Create explicit logic for collectors with 10+ orders.

**Output example:**
- `⭐ 10x Collectors: Ashley Wall (13), Jane Doe (10)`

If no 10x activity yesterday, this can be a compact line rather than a big section.

### 6. Add basic conversion proxy metrics
If traffic is unavailable, add proxies from order data:
- AOV (average order value)
- items sold
- unique buyers

These are useful now and need no extra integration.

---

## Phase 3 — External data source upgrades

### 7. Replace traffic placeholder with real analytics
Current traffic section is fake/empty.
Possible paths:
- Shopify analytics if available through API/app scope
- GA4 if Mat/Sarah has access
- Cartlytics if API/export exists

**Recommendation:** do not guess this. Confirm the best available source first.

### 8. Add birthday automation only if real data exists
Right now birthdays are not tracked.
Do not fake this section forever.
Choose one path:
- Shopify customer metafield for birthday
- separate CRM sheet
- ManyChat/custom form field

If no real birthday source exists, either:
- hide section, or
- keep explicit “No birthday data source connected yet” internally, but not in Sarah-facing copy

---

## Phase 4 — Polishing / maintainability

### 9. Refactor metrics into isolated helpers
Split `generateDashboard()` support logic into smaller units:
- `getOrderMetrics()`
- `getSubscriberMetrics()`
- `getDeliveryMetrics()`
- `getTrendMetrics()`
- `buildQuickInsight()`

This makes future upgrades safer.

### 10. Add a small validation mode
Add optional CLI flags:
- `--json` for structured debugging output
- `--dry-run` to generate without sending

Useful for maintenance and testing.

---

## Recommended Execution Order for Builder

### Sprint A — immediate value
1. Add starter kit history to snapshot
2. Add day-over-day / 7-day trend lines
3. Add AOV / unique buyers / item count
4. Add top-selling piece summary
5. Improve quick insight logic

### Sprint B — collector intelligence
6. Add repeat buyer logic
7. Add 10x collector tracking

### Sprint C — external integrations
8. Replace traffic placeholder with real source
9. Add birthday data source if one exists

---

## Concrete Builder Tasks

## Task 1 — Trend metrics
Add helpers:
- `getPreviousValue(history)`
- `getWeeklyDelta(history)`
- `formatDelta(current, previous)`

Update snapshot shape to include:
```json
{
  "starterKitHistory": [{ "date": "2026-03-30", "count": 27 }]
}
```

## Task 2 — Order quality metrics
From yesterday orders compute:
- averageOrderValue
- uniqueCustomers
- totalItemsSold
- topSellingItems

## Task 3 — Dashboard output improvements
Add sections/lines:
- AOV
- Unique buyers
- Top piece yesterday
- Weekly newsletter delta
- Weekly starter kit delta

## Task 4 — Quick insight upgrade
Replace simple order-based insight with ranked signals.

Priority order for insight selection:
1. big sales day
2. multiple orders
3. repeat collector activity
4. newsletter growth
5. starter kit growth
6. deliveries in motion
7. quiet day fallback

## Task 5 — Collector intelligence scaffold
Implement helper that maps customer email/name to order counts from fetched orders.
If all-time lookup is too expensive, start with a 90-day view and clearly label it.

---

## Cautions
- Do not reintroduce hardcoded totals
- Do not break mobile readability
- Prefer omission over fake precision
- If a section has no real backing data, keep it out or label it conservatively in code
- Preserve snapshot fallback behavior

---

## Definition of Done for next builder pass
A strong next version should:
- keep current live subscriber/waitlist accuracy
- show at least 2 meaningful trend comparisons
- add 2-3 business-useful derived metrics from orders
- produce a more intelligent quick insight
- remain runnable without Telegram send side effects
