# Clawd Agent — Tools Inventory (Accurate)

## Your Actual Connections

Based on your OpenClaw setup, here's exactly what you have:

---

## Direct API Access (Fast, Reliable)

### HubSpot
| Property | Value |
|----------|-------|
| **Access Method** | PAT Token via Gateway → REST API |
| **Status** | ✅ Active |
| **Owner ID** | 728033696 |
| **Capabilities** | Full CRM read/write: contacts, companies, deals, notes, activities, pipelines |

**API Endpoints:**
```
Base: https://api.hubapi.com
Auth: Bearer {PAT_TOKEN}

GET /crm/v3/objects/contacts
GET /crm/v3/objects/companies  
GET /crm/v3/objects/deals
GET /crm/v3/objects/deals/{id}/associations/contacts
POST /crm/v3/objects/deals/search
```

---

### Avoma
| Property | Value |
|----------|-------|
| **Access Method** | Bearer Token via Gateway → REST API |
| **Status** | ✅ Active |
| **Capabilities** | Read meetings, transcripts, summaries, action items |

**What you can fetch:**
- Meeting list with attendees
- Full transcripts
- AI-generated summaries
- Key moments/highlights
- Action items

---

### Home Assistant
| Property | Value |
|----------|-------|
| **Access Method** | Long-lived Token via Mac node → REST API |
| **Status** | ✅ Active |
| **Endpoint** | homeassistant.local:8123 |
| **Capabilities** | Full control: states, services, automations |

---

## Google Suite (OAuth via Mac Node)

All Google services go through your Mac node using OAuth tokens stored at `~/.openclaw/google-tokens.json`

### Gmail
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Account** | mat@craftable.com |
| **Capabilities** | Read, search, create drafts, modify labels |

**What you can do:**
- Search inbox with full Gmail query syntax
- Read threads and messages
- Create drafts (saved to Drafts folder)
- Apply/remove labels
- ❌ Cannot send (by design)

---

### Google Calendar
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Account** | mat@craftable.com |
| **Capabilities** | Read events, check availability |

**What you can do:**
- List events with date filters
- Get event details
- Check free/busy across calendars
- See attendees, locations, meet links

---

### Google Sheets
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Status** | ✅ Command Center V2 connected |
| **Capabilities** | Read AND Write |

**What you can do:**
- Read cell ranges
- Write/append data
- Create new tabs
- Format cells
- This is your primary data store for logs, caches, dashboards

---

### Google Drive
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Capabilities** | Read access |

**What you can do:**
- Search files by name, content, date
- Read document contents
- List files in folders
- Access shared drives

---

### Google Docs
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Capabilities** | Read (likely write too via Docs API) |

---

### Google Slides
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Capabilities** | TBD — likely read, possibly create |

---

### Google Meet
| Property | Value |
|----------|-------|
| **Access Method** | OAuth via Mac node → Google API |
| **Capabilities** | TBD — likely read meeting info from Calendar |

---

## Browser Automation (CDP Proxy via Mac Node)

### How It Works
```
Clawd → Mac Node → Chrome (port 18800) → Any Website
```

Your Mac node controls a Chrome instance via Chrome DevTools Protocol (CDP). You can:
- Navigate to any URL
- Read page content
- Click, type, scroll
- Fill forms
- Take screenshots
- Execute JavaScript

### LinkedIn
| Property | Value |
|----------|-------|
| **Access Method** | Browser (CDP) — logged into your account |
| **Status** | ✅ Available |
| **Risk Level** | ⚠️ HIGH — LinkedIn aggressively detects automation |

**Recommendations:**
- Max 3-5 lookups per day
- Random delays between actions (3-10 sec)
- Stop immediately on CAPTCHA
- Cache everything you fetch
- Use sparingly — ZoomInfo is safer

**What you can do:**
- View profiles
- Search people
- See mutual connections
- Check recent activity/posts

---

### ZoomInfo
| Property | Value |
|----------|-------|
| **Access Method** | Browser (CDP) — logged into your account |
| **Status** | ✅ Available |
| **Risk Level** | 🟡 MEDIUM — more forgiving than LinkedIn |

**Recommendations:**
- Max 10-15 lookups per session
- 30 sec timeout per lookup
- Cache results for 30-90 days
- Batch lookups (don't do real-time)

**What you can do:**
- Search contacts
- Search companies
- View contact details (email, phone, title)
- View company info (size, revenue, tech stack)
- Export data

---

### Any Other Website
| Property | Value |
|----------|-------|
| **Access Method** | Browser (CDP) |
| **Capabilities** | Full browser automation |

**Use for:**
- Company websites (about pages, team pages)
- News sites (company mentions)
- Competitor research
- Any public web data

---

## Communication Channels

### Telegram
| Property | Value |
|----------|-------|
| **Access Method** | OpenClaw native plugin |
| **Status** | ✅ Active |
| **Capabilities** | Send/receive messages |

**This is your primary alert channel.** Use for:
- Morning briefings
- Urgent alerts
- Pre-meeting prep
- Quick status updates
- Receiving commands

---

### WhatsApp
| Property | Value |
|----------|-------|
| **Access Method** | QR scan needed |
| **Status** | ⏳ Not linked |

---

### iMessage
| Property | Value |
|----------|-------|
| **Access Method** | Mac node → Messages app |
| **Status** | Likely available via osascript |

---

## System Access

### Mac Node
| Property | Value |
|----------|-------|
| **Connection** | Tailscale → OpenClaw WebSocket |
| **Status** | ✅ Full exec access |

**What you can do:**
- Run shell commands
- Execute AppleScript
- Access local files
- Control Mac apps
- Run Node.js/Python scripts

---

## Tools Summary by Speed/Reliability

### Tier 1: Direct API (Fast, Reliable, Unlimited*)
| Tool | Response Time | Rate Limits |
|------|---------------|-------------|
| HubSpot | <1 sec | 100 requests/10 sec |
| Avoma | <2 sec | Reasonable |
| Home Assistant | <1 sec | None |
| Google Sheets | <2 sec | 100 requests/100 sec |
| Gmail | <2 sec | 250 quota units/sec |
| Calendar | <1 sec | Reasonable |

### Tier 2: Browser (Slow, Some Risk)
| Tool | Response Time | Daily Limit |
|------|---------------|-------------|
| ZoomInfo | 5-30 sec | ~15 lookups |
| LinkedIn | 5-30 sec | ~5 lookups |
| Other sites | 3-10 sec | Varies |

### Tier 3: Communication
| Tool | Latency | Use For |
|------|---------|---------|
| Telegram | <1 sec | Alerts, commands |
| iMessage | <2 sec | Personal comms |

---

## Data Flow Recommendations

### For Real-Time Dashboards:
```
HubSpot API → Direct fetch
Google Sheets → Direct fetch  
Gmail counts → Direct fetch
Calendar → Direct fetch
```

### For Contact/Company Research:
```
1. Check HubSpot first (already have data?)
2. Check Research Cache (Sheets tab)
3. If needed: ZoomInfo browser (batch, not real-time)
4. LinkedIn only if ZoomInfo missing data
5. Cache everything immediately
```

### For Meeting Prep:
```
Calendar → Get meeting details
HubSpot → Contact + deal info
Avoma → Last meeting transcript
Gmail → Recent email threads
Research Cache → LinkedIn/ZoomInfo data
(Browser lookup only if cache empty AND high-value meeting)
```

---

## Token/Credential Locations

| Service | Location |
|---------|----------|
| Google OAuth | `~/.openclaw/google-tokens.json` (Mac) |
| Home Assistant | `~/.config/home-assistant/config.json` (Mac) |
| HubSpot PAT | Gateway config (VPS) |
| Avoma Bearer | Gateway config (VPS) |
| Browser sessions | Chrome profile (Mac) |
