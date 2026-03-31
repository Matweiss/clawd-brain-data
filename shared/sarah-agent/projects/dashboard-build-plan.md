# Dashboard Build Plan — Sonnet → GPT-5.4 Builder

Generated: 2026-03-30
Audited by: Clawd (Sonnet)
Execute: GPT-5.4 builder agent

---

## Current State (Audit)

File: `/root/.openclaw/workspace/shared/sarah-agent/projects/daily-dashboard.mjs`

### What works ✅
- Shopify orders (yesterday's sales, customer names, totals) — live API
- New subscribers yesterday (Shopify customer API, `email_marketing_status=subscribed`, date-filtered)
- Deliveries in transit (fulfilled orders, last 3 days)
- Snapshot save/load (`dashboard-snapshot.json`)
- Telegram delivery via `send-dashboard.sh`
- Cron at `0 16 * * *` (8am PST)

### Critical bugs 🔴

**BUG 1: Hard-coded subscriber totals (highest priority)**
Lines in `generateDashboard()`:
```js
const newsletterTotal = 471; // HARDCODED
const starterKitTotal = 19;  // HARDCODED
```
These override the live `getSubscriberMetrics()` result. `allSubsData.customers` is fetched but discarded. 
Fix: Use the live count from `getSubscriberMetrics().total` instead of hardcoded values.

**BUG 2: Shopify API pagination cap**
`/customers.json?limit=250` only returns 250 customers max. If total subscribers > 250, count will be wrong.
Fix: Implement cursor-based pagination using `Link` response header (`rel="next"`), or use GraphQL `customerCount` query which returns exact totals without pagination.

**BUG 3: Starter kit waitlist count is always 0**
`getSubscriberMetrics()` only tracks `email_marketing_status=subscribed` — no logic for starter kit waitlist (which is a separate customer tag/segment).
Fix: Add a separate API call: `/customers.json?limit=250&tag=starter-kit-waitlist` with pagination, count total.

**BUG 4: Duplicate function definitions**
`daily-dashboard.mjs` has function bodies defined twice (once at top, once duplicated lower in file). The file has both a top section and a duplicate bottom section. Clean up the duplicates — keep only the top definitions.

### Enhancements 🟡 (implement after bugs fixed)

**ENHANCEMENT 1: GraphQL for accurate subscriber count**
Replace REST `/customers.json` count with Shopify GraphQL:
```graphql
query {
  customersCount(query: "email_marketing_state:SUBSCRIBED") {
    count
  }
}
```
Endpoint: `POST /admin/api/2024-01/graphql.json`
Headers: same `X-Shopify-Access-Token`
This returns exact counts without pagination issues.

**ENHANCEMENT 2: Daily delta tracking**
Currently shows `+N new yesterday` but no running trend.
Add to snapshot: store last 7 days of subscriber counts as an array. Dashboard can show: `471 total (+7 yesterday, +23 this week)`.

**ENHANCEMENT 3: Revenue trend**
Add to snapshot: yesterday's sales total. Dashboard can show: `$592 yesterday (vs $0 day before)`.

**ENHANCEMENT 4: Starter kit waitlist new signups**
Currently hardcoded to `+0`. 
Fix: date-filter the starter kit tag query same as newsletter new-subs query.

**ENHANCEMENT 5: Quiet error handling**
Currently `getSubscriberMetrics()` catch block falls back to hardcoded `471`.
Fix: Fall back to snapshot value (`readSnapshot().newsletterSubscribers`) instead of a magic number.
This means stale = yesterday's real number, not a forever-stale hardcode.

---

## Execution Instructions for GPT-5.4 Builder

Work on file: `/root/.openclaw/workspace/shared/sarah-agent/projects/daily-dashboard.mjs`

### Step 1 — Fix Bug 4 first (clean the file)
Remove the duplicate function block at the bottom of the file. Keep only one copy of each function. The canonical versions are the ones defined at the top of the file.

### Step 2 — Fix Bug 1 (hardcoded totals)
In `generateDashboard()`, replace:
```js
const newsletterTotal = 471;
const starterKitTotal = 19;
```
With:
```js
const newsletterTotal = subscriberMetrics.total || snapshot.newsletterSubscribers || 0;
const starterKitTotal = subscriberMetrics.starterKitTotal || snapshot.starterKitWaitlist || 0;
```
And update `getSubscriberMetrics()` to return `starterKitTotal` from a tag-based query.

### Step 3 — Fix Bug 2 (pagination)
Replace the simple `allSubsData` fetch in `getSubscriberMetrics()` with a paginated count function:
```js
async function countCustomers(query) {
  let count = 0;
  let url = `/customers.json?limit=250&${query}`;
  while (url) {
    const { data, nextUrl } = await shopifyRequestWithHeaders(url);
    count += (data.customers || []).length;
    url = nextUrl; // parse from Link header
  }
  return count;
}
```
You'll need a new `shopifyRequestWithHeaders()` helper that returns both body and `Link` header.

### Step 4 — Fix Bug 3 (starter kit count)
Add to `getSubscriberMetrics()`:
```js
const starterKitData = await countCustomers('tag=starter-kit-waitlist');
const starterKitNewYesterday = await shopifyRequest(
  `/customers.json?created_at_min=${yesterday}T00:00:00-07:00&created_at_max=${yesterday}T23:59:59-07:00&limit=250&tag=starter-kit-waitlist`
);
```
Return `starterKitTotal` and `starterKitNewYesterday` from the function.

### Step 5 — Enhancement 5 (fallback to snapshot, not magic number)
In the catch block of `getSubscriberMetrics()`, change:
```js
return { total: 471, newYesterday: 0, unsubscribedYesterday: 0 };
```
To:
```js
const snap = readSnapshot();
return { total: snap.newsletterSubscribers || 0, starterKitTotal: snap.starterKitWaitlist || 0, newYesterday: 0, unsubscribedYesterday: 0 };
```

### Step 6 — Enhancement 2 (7-day trend in snapshot)
Update `saveSnapshot()` to append to a rolling 7-day array:
```js
const snapshot = {
  lastUpdated: today,
  newsletterSubscribers: newsletter,
  starterKitWaitlist: starterKit,
  salesHistory: [...(existing.salesHistory || []).slice(-6), { date: today, sales: salesTotal }],
  subscriberHistory: [...(existing.subscriberHistory || []).slice(-6), { date: today, count: newsletter }]
};
```
Update `generateDashboard()` to pass `salesTotal` to `saveSnapshot()`.

### Step 7 — Test run
After all fixes, run:
```bash
SARAH_SHOPIFY_STORE=yr5azj-q0.myshopify.com SARAH_SHOPIFY_ACCESS_TOKEN=<token> node /root/.openclaw/workspace/shared/sarah-agent/projects/daily-dashboard.mjs
```
Verify:
- Subscriber total is NOT 471 (or if it is, it's live-fetched not hardcoded)
- Starter kit total is live
- No JS errors
- Output looks clean

### Environment
- Token env var: `SARAH_SHOPIFY_ACCESS_TOKEN`
- Check if set: `grep -r "SARAH_SHOPIFY" /root/.openclaw/workspace/shared/sarah-agent/ --include="*.sh" --include="*.env" -l`

---

## Priority Order
1. Bug 4 (clean duplicates) — prerequisite
2. Bug 1 (hardcoded totals) — highest impact, simplest fix
3. Bug 5/Enhancement 5 (fallback to snapshot) — makes failures graceful
4. Bug 2 (pagination) — correctness at scale
5. Bug 3 (starter kit live count) — completeness
6. Enhancement 2 (7-day trend) — nice to have

Stop after Step 5 if anything breaks. Do not auto-deploy — just edit the file and confirm it runs cleanly.
