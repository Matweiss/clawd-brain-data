# Sarah's Art Business Tool Stack

**Date:** 2026-03-23  
**Agent:** Arty (Sarah Art Assistant)  
**Status:** Integration planning needed

---

## 📦 Shipping & Fulfillment
- **Pirate Ship** - Primary shipping platform for art prints and originals
  - Integration needed: API access for automated label generation
  - Use case: Auto-generate shipping labels when orders come in

---

## 💬 Marketing Automation
- **Manychat** - Chatbot/flow automation
  - Instagram DM automation
  - Messenger bots
  - SMS marketing flows
  - Integration needed: API for automated responses, lead capture

---

## 📱 Social Media Platforms

### Content Publishing
- **TikTok** - Short-form video content
  - Integration: Auto-posting, hashtag optimization
  - Use case: Schedule/queue content, cross-post from Instagram

- **Instagram** - Primary visual platform
  - Stories, Posts, Reels
  - Shop integration
  - Integration needed: Publishing API, engagement tracking

- **Facebook** - Page management, groups, marketplace
  - Integration: Cross-posting, event creation

- **Threads** - Meta's Twitter competitor
  - Integration: Text-first content cross-posting

### Discovery/SEO
- **Pinterest** - Visual search/discovery
  - Integration: Auto-pinning new artworks, board management
  - Use case: When new art uploaded → auto-create pins

- **Reddit** - Community engagement
  - Subreddit: r/art, r/painting, niche art communities
  - Integration: Post scheduling, engagement monitoring
  - **Note:** Requires careful human-in-the-loop (Reddit hates promotion)

---

## 🎯 Integration Priorities

### Phase 1 (High Impact, Easy)
1. **Pirate Ship** - Shipping automation
2. **Instagram** - Content scheduling/publishing
3. **Manychat** - DM response flows

### Phase 2 (Medium Priority)
4. **Pinterest** - Auto-pinning workflow
5. **TikTok** - Cross-posting from Instagram
6. **Facebook** - Page sync

### Phase 3 (Later)
7. **Threads** - Text content distribution
8. **Reddit** - Community engagement (manual approval required)

---

## 🔧 Technical Notes

### APIs to Research:
- Pirate Ship API (if available) or webhook-based automation
- Manychat API for flow triggers
- Meta Graph API (Instagram, Facebook, Threads)
- Pinterest API v5
- TikTok for Business API
- Reddit API (PRAW)

### Authentication Needed:
- Sarah's Pirate Ship account
- Manychat workspace access
- Meta Business account (for Instagram/Facebook)
- Pinterest Business account
- TikTok Business account
- Reddit account (with appropriate karma for posting)

---

## 💡 Potential Automations

**Order Flow:**
Shopify order → Pirate Ship label created → Customer notified → Manychat follow-up sequence

**New Artwork Flow:**
Artwork uploaded → Instagram post drafted → Pinterest pins created → Manychat subscribers notified

**Engagement Flow:**
Instagram DM received → Manychat bot responds → Complex queries → Human (Sarah) notified

---

*Logged from conversation 2026-03-23 - Mat noted these are the tools Sarah uses and we need to build Arty integrations*
