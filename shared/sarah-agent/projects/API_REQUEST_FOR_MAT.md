# API Request for Mat

**Date:** 2026-03-22
**Requested by:** Sarah
**For:** Daily Morning Dashboard enhancement

---

## Request: Add Shopify Analytics API Scope

**Scope needed:** `read_analytics`

**Purpose:** Enable website traffic data in Sarah's Daily Morning Dashboard

**Current dashboard sections working:**
- ✅ Orders & sales (read_orders)
- ✅ Newsletter subscribers (read_customers)
- ✅ Starter kit waitlist (read_customers)
- ✅ Birthdays (read_customers)
- ✅ Deliveries (read_orders)
- ❌ Traffic (needs read_analytics)

**What this enables:**
- Total website visits (yesterday)
- Traffic sources breakdown (Instagram %, Pinterest %, direct, etc.)
- Most viewed artwork pieces
- Top landing pages

**How to add:**
1. Shopify Admin → Settings → Apps and sales channels
2. Find the custom app with API access
3. Configuration → API scopes
4. Add `read_analytics` to the list
5. Save & re-authorize

**Current API credentials being used:**
- Store: yr5azj-q0.myshopify.com
- Token: [REDACTED - see OpenClaw env]

---

**Dashboard location:** `/root/.openclaw/workspace/shared/sarah-agent/projects/daily-dashboard.mjs`

**Status:** Dashboard is live and auto-sending at 8am PST. Traffic section currently shows "(Analytics API needed)" until this scope is added.
