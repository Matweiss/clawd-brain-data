# Daily Morning Dashboard — Sarah J. Schwartz Fine Art

## Purpose
Automated morning report delivered daily at 8am PST with key business metrics from the previous day.

## Data Sources Needed

### 📊 Website Analytics (Previous Day)
- Total website visits
- Most clicked individual piece
- Most clicked collection (by category/size: minis, darlings, babes, gems)
- Items added to carts (Cartlytics data from Shopify)
- Traffic sources breakdown (Instagram, Pinterest, Google, direct, etc.)

### 📧 Email & List Growth
- New newsletter subscribers (previous day count + running total)
- New starter kit waitlist subscribers (previous day + running total)
- Note: Starter kit is a passive income digital product in development

### 🎂 Collector Management
- Any collector birthdays TODAY (so Sarah can send personal wishes)
- Recent 10x star collector activity (collectors with 10+ orders get free shipping for life)

### 💰 Sales Metrics
- Total sales (previous day)
- Conversion rate
- Top performing pieces

## Format Requirements
- Clean, scannable bullet list
- Brief insights/context where helpful
- Mobile-friendly (Sarah checks on phone)

## Delivery
- Send via Telegram at 8am PST daily
- Subject/Header: "Your Morning Dashboard — [Date]"

## Technical Notes
- Requires Shopify API access (already configured)
- Cartlytics app integration needed
- Customer birthday data tracking needed
- 10x Star Collector order counting automation
- Cron job or scheduled execution at 8am PST (11am EST)

## Implementation Status (updated 2026-03-30)

### ✅ Implemented & Live
- Yesterday's orders and sales (Shopify REST API)
- Top orders with customer names
- Newsletter subscriber total (Shopify GraphQL + REST fallback)
- Starter Kit waitlist total (via customer tags)
- New subscribers yesterday (delta)
- Unsubscribed yesterday count
- Deliveries in transit (last 3 days)
- 7-day sales trend with visual bar chart
- Star Collector detection (10+ lifetime orders flagged in dashboard)
- Hardened delivery script (exit-code checked, openclaw path explicit, errors never sent to Sarah)
- Request timeouts on all Shopify API calls (15s)
- DST-safe timezone handling (America/Los_Angeles via Intl API)

### ⏳ Deferred / Not Yet Implemented
- Website traffic analytics (requires separate analytics API — Cartlytics or GA4)
- Conversion rate (requires analytics)
- Collector birthday tracking (requires birthday metafields on customer records)
- Most clicked piece / collection (requires analytics)
- Pinterest/Instagram traffic source breakdown (requires analytics)

### 🔧 Known Constraints
- Subscriber totals come from Shopify customer records (email marketing status), not a separate email platform
- Birthday tracking is a future feature — requires adding birthday metafields to customer records in Shopify
