# Sarah's Tool Stack — Integration Research

**Date:** 2026-03-23  
**Agent:** Arty (Sarah Art Assistant)  
**Status:** Research Complete — Ready for Implementation

---

## 📦 Pirate Ship — Shipping Automation

### API Status: ❌ No Official API
**Official stance:** "Pirate Ship doesn't offer an API. We're focused on making shipping cheap & fun."

### ✅ Integration Path: Shopify Native
**Good news:** Pirate Ship has **native Shopify integration**

**How it works:**
1. Connect Pirate Ship to Sarah's Shopify store (already done)
2. Orders sync automatically to Pirate Ship
3. When labels are bought, Pirate Ship auto-marks orders as fulfilled in Shopify
4. **Arty can:** Read order status via Shopify API to confirm shipping

### 🤖 What Arty Can Do:
- Check if orders have been shipped (via Shopify fulfillment status)
- Send shipping confirmation messages to customers (via Manychat)
- Alert Sarah when orders need shipping labels

### 📋 Setup Needed:
- Confirm Pirate Ship is connected to Shopify
- Test the sync between Shopify ↔ Pirate Ship

---

## 💬 Manychat — Chat Automation

### API Status: ✅ Available (Pro Account Required)

**Capabilities:**
- Send messages to users
- Manage subscriber data
- Trigger flows
- Set custom fields
- Add/remove tags

**Integration Methods:**
1. **Public API** — REST API with OAuth
2. **Dynamic Blocks** — Webhooks within flows
3. **Zapier/Make** — No-code connectors (7,000+ apps)

### 🤖 What Arty Can Do:
- Send Instagram DM responses automatically
- Trigger welcome sequences for new collectors
- Update subscriber info based on Shopify purchases
- Send birthday month notifications
- Answer FAQs via AI-generated responses

### 📋 Setup Needed:
```
1. Sarah upgrades to Manychat Pro (if not already)
2. Generate API token: Settings → API
3. Connect to Arty via webhook or direct API
```

**Key Endpoints:**
- `POST /fb/page/subscriber` — Get subscriber info
- `POST /fb/page/sendContent` — Send messages
- `POST /fb/page/setCustomField` — Update custom data

---

## 📱 Meta Graph API — Instagram, Facebook, Threads

### API Status: ✅ Well Documented (OAuth 2.0)

**Prerequisites:**
- Facebook Developer account
- Business account (not personal)
- Facebook Page connected to Instagram Business account
- App review for advanced features

### 🤖 What Arty Can Do:
- **Instagram:** Post photos, reels, stories, carousels
- **Facebook:** Post to page, schedule content
- **Threads:** Post text updates (via same Graph API)
- Cross-post content between platforms
- Schedule posts for optimal times
- Auto-respond to comments (with human approval)

### 📋 Setup Steps:
1. Create Facebook Developer app
2. Add Instagram Graph API product
3. Connect Instagram Business account to Facebook Page
4. Generate long-lived access token (60 days)
5. Implement token refresh logic

**Key Permissions Needed:**
- `instagram_basic` — Read profile info
- `instagram_content_publish` — Post content
- `pages_manage_posts` — Facebook posting
- `pages_read_engagement` — Analytics

**Content Posting Flow:**
```
1. Upload media → Get container ID
2. Publish container → Post goes live
3. For scheduling: Set `scheduled_time` parameter (UNIX timestamp)
```

---

## 📌 Pinterest — Visual Discovery

### API Status: ✅ Pinterest API v5 (REST + OAuth 2.0)

**Official Resources:**
- GitHub: `pinterest/api-quickstart`
- Docs: `developers.pinterest.com`
- OpenAPI spec available

### 🤖 What Arty Can Do:
- **Auto-pin new artworks** to boards
- Create new boards for collections
- Get analytics on pin performance
- Search trending keywords for art niche
- Schedule pins for optimal times

### 📋 Setup Steps:
1. Create Pinterest Developer app at `pinterest.com/developers`
2. Get App ID and Secret
3. OAuth flow for Sarah's Pinterest Business account
4. Store access token (with refresh capability)

**Key Scopes:**
- `pins:read` / `pins:write` — Create/manage pins
- `boards:read` / `boards:write` — Manage boards
- `user_accounts:read` — Profile info

**Pin Creation Endpoint:**
```python
POST /v5/pins
{
  "title": "Artwork Title",
  "description": "Description with #hashtags",
  "link": "https://sarahjschwartz.com/products/...",
  "board_id": "board_id_here",
  "media_source": {
    "source_type": "image_url",
    "url": "https://cdn.shopify.com/.../image.jpg"
  }
}
```

---

## 🎵 TikTok — Short-Form Video

### API Status: ✅ Content Posting API (with caveats)

**Important:** TikTok requires **app approval/audit** for full functionality

**Two Posting Modes:**
1. **Direct Post** — Publishes immediately (requires audit approval)
2. **Draft Upload** — Uploads to drafts, user manually publishes (easier approval)

### 🤖 What Arty Can Do:
- Upload videos (as drafts initially)
- Add captions, hashtags, mentions
- Schedule posts (with `scheduled_time` parameter)
- Check video status/processing
- Pull analytics data

### 📋 Setup Steps:
1. Register at `developers.tiktok.com`
2. Create app and request `video.publish` scope
3. Submit for audit (may take weeks)
4. Implement OAuth 2.0 flow
5. Handle chunked video uploads (5MB chunks)

**Workflow:**
```
1. Initiate upload → Get upload_id and upload_url
2. Upload video in chunks → Confirm completion  
3. Create post with metadata → Scheduled or immediate
4. (Optional) Webhook for publish confirmation
```

**⚠️ Limitations:**
- Audit process can be lengthy
- Unaudited apps may have restricted visibility
- Some features (Stories) not officially supported

---

## 🔴 Reddit — Community Engagement

### API Status: ✅ PRAW (Python Reddit API Wrapper)

**Easiest integration** — Well-documented Python library

### 🤖 What Arty Can Do:
- Post to art subreddits (r/art, r/painting, etc.)
- Monitor mentions of Sarah's work
- Cross-post Instagram content
- **⚠️ Human approval required** — Reddit hates promotion

### 📋 Setup Steps:
1. Go to `reddit.com/prefs/apps`
2. Create app (type: "script")
3. Get Client ID and Secret
4. Install PRAW: `pip install praw`
5. Authenticate with username/password

**Sample Code:**
```python
import praw

reddit = praw.Reddit(
    client_id='your_client_id',
    client_secret='your_client_secret',
    user_agent='Arty Art Assistant v1.0',
    username='sarahjschwartz',
    password='app_password'  # Use app password if 2FA enabled
)

subreddit = reddit.subreddit('art')
subreddit.submit(
    title='My latest piece — Oil on canvas',
    url='https://sarahjschwartz.com/products/...'
)
```

**⚠️ Critical Warning:**
- Reddit has strict self-promotion rules
- Build karma/engagement before posting links
- Use "90/10 rule" — 90% community participation, 10% promotion
- **Always require Sarah's approval before posting**

---

## 🎯 Integration Priority Matrix

| Platform | Priority | Complexity | Value | Human-in-Loop? |
|----------|----------|------------|-------|----------------|
| **Manychat** | 🔴 P0 | Medium | HIGH | No (DMs auto) |
| **Instagram** | 🔴 P0 | Medium | HIGH | Yes (approval) |
| **Pinterest** | 🟡 P1 | Low | HIGH | No (auto-pin) |
| **Shopify** | 🔴 P0 | Done | CRITICAL | Yes (products) |
| **Reddit** | 🟢 P2 | Low | MEDIUM | **REQUIRED** |
| **TikTok** | 🟢 P2 | High | MEDIUM | Yes (draft mode) |
| **Facebook** | 🟡 P1 | Medium | MEDIUM | Yes (approval) |
| **Threads** | 🟢 P2 | Medium | LOW | Yes (approval) |

---

## 🔧 Recommended Implementation Order

### Phase 1 (Week 1-2): Foundation
1. ✅ Shopify integration (already done)
2. 🔧 Manychat API — DM automation, welcome flows
3. 🔧 Instagram Graph API — Post scheduling

### Phase 2 (Week 3-4): Content Distribution
4. 🔧 Pinterest — Auto-pin new products
5. 🔧 Facebook cross-posting from Instagram
6. 🔧 Manychat + Shopify sync (order notifications)

### Phase 3 (Week 5+): Advanced
7. 🔧 Reddit — Community engagement (manual approval)
8. 🔧 TikTok — Draft uploads (pending audit)
9. 🔧 Threads — Text content sync

---

## 🔐 Authentication Summary

| Platform | Auth Type | Token Lifespan | Refreshable? |
|----------|-----------|----------------|--------------|
| Manychat | API Key | Permanent | N/A |
| Meta | OAuth 2.0 | 60 days | ✅ Yes |
| Pinterest | OAuth 2.0 | ~30 days | ✅ Yes |
| TikTok | OAuth 2.0 | Varies | ✅ Yes |
| Reddit | Password/OAuth | Permanent | ✅ Yes |
| Shopify | OAuth 2.0 | Permanent* | ✅ Built-in |

*With offline access scope

---

## 💡 Automation Ideas

### New Product Workflow:
```
Shopify product created → Arty notified
    ↓
Draft Instagram post (Sarah approves)
    ↓
Pin to Pinterest "New Arrivals" board
    ↓
Manychat subscribers notified
    ↓
Post to Facebook (cross-post)
```

### Birthday Month Workflow:
```
Scheduled check (1st of month)
    ↓
Query Shopify for birthday month collectors
    ↓
Generate personalized Manychat messages
    ↓
Send with birthday discount code
```

### Sold Artwork Workflow:
```
Shopify order marked fulfilled
    ↓
Update landing pages (remove sold piece)
    ↓
Send thank you DM via Manychat
    ↓
Add to "Collectors" tag for future nurture
```

---

## 📚 Next Steps

1. **Get Sarah's credentials** for each platform
2. **Set up developer accounts** where needed
3. **Start with Manychat** (highest impact, medium effort)
4. **Build Instagram posting** (core to her business)
5. **Add Pinterest** (art discovery platform)

---

*Research compiled 2026-03-23 — Ready for implementation planning*
