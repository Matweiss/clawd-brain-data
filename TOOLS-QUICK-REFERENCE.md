# Clawd Tools — Quick Access Reference

## At a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        DIRECT API ACCESS                         │
│                    (Fast, Reliable, Use First)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HubSpot ──────── PAT Token ──────── Gateway (VPS)              │
│  Avoma ─────────── Bearer Token ──── Gateway (VPS)              │
│  Home Assistant ── Long-lived Token ─ Mac Node                   │
│                                                                  │
│  Gmail ─────────── OAuth ──────────── Mac Node                   │
│  Calendar ──────── OAuth ──────────── Mac Node                   │
│  Sheets ────────── OAuth ──────────── Mac Node                   │
│  Drive ─────────── OAuth ──────────── Mac Node                   │
│  Docs ──────────── OAuth ──────────── Mac Node                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER AUTOMATION                          │
│                 (Slow, Rate-Limited, Use Sparingly)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZoomInfo ──────── CDP Proxy ──────── Mac Node → Chrome:18800   │
│  LinkedIn ──────── CDP Proxy ──────── Mac Node → Chrome:18800   │
│  Any Website ───── CDP Proxy ──────── Mac Node → Chrome:18800   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       COMMUNICATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Telegram ──────── Native Plugin ──── OpenClaw Direct           │
│  iMessage ──────── osascript ──────── Mac Node                   │
│  WhatsApp ──────── Pending ────────── QR Scan Needed            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree: Which Tool to Use

```
Need contact/company data?
│
├─► Check HubSpot first (API) ───────────► Found? ✅ Done
│
├─► Check Research_Cache (Sheets) ───────► Found? ✅ Done
│
├─► ZoomInfo (Browser) ──────────────────► Cache result → Done
│
└─► LinkedIn (Browser) ──────────────────► Last resort, cache result


Need email data?
│
└─► Gmail API (via Mac Node) ────────────► Direct, fast


Need meeting data?
│
├─► Calendar API (via Mac Node) ─────────► Events, times
│
└─► Avoma API (via Gateway) ─────────────► Transcripts, summaries


Need to store/retrieve data?
│
└─► Google Sheets (via Mac Node) ────────► Read AND Write access


Need to alert Mat?
│
└─► Telegram (Native) ───────────────────► Instant delivery
```

---

## Speed & Reliability Tiers

### 🟢 Tier 1: Use Freely (API)
| Tool | Response | Daily Limit | Best For |
|------|----------|-------------|----------|
| HubSpot | <1 sec | ~10k requests | CRM data, deals, contacts |
| Gmail | <2 sec | High | Email search, threads |
| Calendar | <1 sec | High | Events, availability |
| Sheets | <2 sec | High | Data storage, dashboards |
| Avoma | <2 sec | Reasonable | Meeting transcripts |
| Telegram | <1 sec | Unlimited | Alerts, updates |

### 🟡 Tier 2: Use Carefully (Browser)
| Tool | Response | Daily Limit | Best For |
|------|----------|-------------|----------|
| ZoomInfo | 5-30 sec | ~15 lookups | Contact enrichment |
| LinkedIn | 5-30 sec | ~5 lookups | Mutual connections, posts |
| Websites | 3-10 sec | Varies | Company research |

### 🔴 Tier 3: Avoid Unless Necessary
| Tool | Issue |
|------|-------|
| LinkedIn | High ban risk, aggressive bot detection |

---

## API Endpoints Reference

### HubSpot (REST API)
```
Base: https://api.hubapi.com
Auth: Bearer {PAT_TOKEN}

Deals:     GET/POST /crm/v3/objects/deals
Contacts:  GET/POST /crm/v3/objects/contacts
Companies: GET/POST /crm/v3/objects/companies
Search:    POST /crm/v3/objects/{type}/search
```

### Avoma (REST API)
```
Base: https://api.avoma.com (or similar)
Auth: Bearer {TOKEN}

Meetings:    GET /meetings
Transcripts: GET /meetings/{id}/transcript
Notes:       GET /meetings/{id}/notes
```

### Google (via OAuth)
```
Sheets:   https://sheets.googleapis.com/v4/spreadsheets
Gmail:    https://gmail.googleapis.com/gmail/v1
Calendar: https://www.googleapis.com/calendar/v3
Drive:    https://www.googleapis.com/drive/v3
```

---

## Browser Automation Guidelines

### ZoomInfo Session
```
Max per session:  10-15 lookups
Timeout per page: 30 seconds
Delay between:    2-5 seconds
Cache duration:   30-90 days

If CAPTCHA: Stop immediately, alert Mat
If slow:    Skip and log, don't block workflow
```

### LinkedIn Session
```
Max per DAY:      3-5 lookups (not session!)
Timeout per page: 30 seconds
Delay between:    5-10 seconds (randomize)
Cache duration:   30 days

If CAPTCHA:    Stop ALL LinkedIn for 24 hours
If "unusual":  Stop immediately, alert Mat
```

### Best Practice: Batch Research
```
Don't:  Lookup contact during meeting prep (slow, risky)
Do:     Batch lookup all week's meeting contacts on Sunday
Store:  In Research_Cache tab in Sheets
Fetch:  From cache during actual prep (fast, safe)
```

---

## What You CAN'T Do (Boundaries)

| Action | Why Not |
|--------|---------|
| Send emails | By design — drafts only |
| Create calendar events | Read-only access |
| Write to HubSpot | Safety choice (could change) |
| Access WhatsApp | Not linked yet |
| Bypass LinkedIn limits | Will get Mat's account banned |

---

## Credential Locations

| Service | Where |
|---------|-------|
| Google OAuth tokens | `~/.openclaw/google-tokens.json` (Mac) |
| Home Assistant token | `~/.config/home-assistant/config.json` (Mac) |
| HubSpot PAT | Gateway config (VPS) |
| Avoma Bearer | Gateway config (VPS) |
| Browser sessions | Chrome profile on Mac |
