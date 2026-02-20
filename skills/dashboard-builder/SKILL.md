# Dashboard Builder Skill (Updated for OpenClaw)

## Overview

Build custom UI dashboards using your actual tool access: direct Google API via Mac node, HubSpot/Avoma via Gateway, and browser automation for ZoomInfo/LinkedIn.

**Key Difference:** You have DIRECT API access to Google Sheets — no service account workaround needed. Your Mac node handles OAuth.

---

## Architecture Options

### Option 1: Google Sheets Dashboard (Recommended for Most Cases)

Since you have full read/write access to Google Sheets via your Mac node, you can build dashboards directly in Sheets:

```
┌─────────────────────────────────────────────────────────┐
│                   GOOGLE SHEETS                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tab: Dashboard                                          │
│  ├── KPI row (formulas pulling from data tabs)          │
│  ├── Charts (native Sheets charts)                       │
│  └── Conditional formatting for alerts                   │
│                                                          │
│  Tab: Pipeline (auto-updated by Clawd)                   │
│  Tab: Email_Log (auto-updated by Clawd)                  │
│  Tab: Research_Cache                                     │
│  Tab: Activity_Log                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    Clawd writes         Clawd writes         Clawd writes
    HubSpot data         Gmail data           Research data
```

**Pros:**
- No deployment needed
- Mat already uses Sheets
- You have WRITE access
- Auto-refresh with cron jobs
- Charts update automatically

**Cons:**
- Less interactive than web app
- Looks like a spreadsheet

---

### Option 2: Local HTML Dashboard (Via Mac Node)

Create an HTML file on Mat's Mac that pulls data from Sheets:

```
┌─────────────────────────────────────────────────────────┐
│                   LOCAL HTML FILE                        │
│                   (~/dashboards/sales.html)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  HTML + Tailwind + Chart.js                              │
│  ├── Fetches from Google Sheets API                      │
│  ├── Renders charts and tables                           │
│  └── Auto-refreshes every X minutes                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Full UI control
- Runs locally (no hosting)
- Can open in browser anytime

**Cons:**
- Needs CORS handling for API calls
- Or needs local server

---

### Option 3: Vercel-Deployed Dashboard

If you want a public URL you can bookmark:

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Next.js App                                             │
│  ├── /api/data.js → Fetches from Google Sheets          │
│  ├── Dashboard components                                │
│  └── Auto-refresh with SWR                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Note:** For Vercel, you'd need to either:
- Use a service account (Mat sets up once)
- Or have Clawd pre-populate a public JSON endpoint

---

## Data Fetching Patterns

### Pattern 1: Clawd Writes → Sheets Displays

**Best for:** Dashboards where Clawd controls the data

```
Cron Job (e.g., 7am daily):
1. Clawd fetches HubSpot deals via API
2. Clawd fetches Gmail stats via API  
3. Clawd fetches Calendar events via API
4. Clawd writes aggregated data to Sheets
5. Sheets charts auto-update

Mat opens Sheet → sees current dashboard
```

**Sheets Structure:**
```
Tab: _Data_Pipeline
| Deal Name | Company | Stage | Amount | Last Activity | Days Stale |

Tab: _Data_Email
| Date | Processed | Drafts Created | Urgent | Replies Needed |

Tab: _Data_Meetings  
| Date | Time | Contact | Company | Prep Status |

Tab: Dashboard
| Charts and summaries pulling from _Data_ tabs |
```

---

### Pattern 2: Real-Time via API (For Web Dashboards)

**Best for:** Interactive dashboards needing live data

```javascript
// Clawd can execute this via Mac node
const fetchHubSpotDeals = async () => {
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'dealstage',
          operator: 'NEQ',
          value: 'closedwon'
        }]
      }],
      properties: ['dealname', 'dealstage', 'amount', 'closedate', 'hs_lastmodifieddate']
    })
  });
  return response.json();
};
```

---

### Pattern 3: Browser Scrape → Cache → Display

**Best for:** ZoomInfo/LinkedIn data

```
Weekly Batch Job (Sunday 8pm):
1. Get all contacts from upcoming meetings (Calendar)
2. For each contact not in Research_Cache:
   a. Open ZoomInfo in browser
   b. Search for contact
   c. Extract data
   d. Write to Research_Cache tab
3. Repeat for LinkedIn if needed (sparingly)

Dashboard reads from Research_Cache (fast)
Never does live browser lookups for dashboard display
```

---

## Google Sheets Dashboard Components

### KPI Row with Formulas

```
Cell A1: ="Pipeline Value"
Cell B1: =SUMIF(_Data_Pipeline!C:C,"<>Closed Won",_Data_Pipeline!D:D)

Cell A2: ="Deals This Month"  
Cell B2: =COUNTIFS(_Data_Pipeline!E:E,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))

Cell A3: ="Stale Deals"
Cell B3: =COUNTIF(_Data_Pipeline!F:F,">0")
```

### Conditional Formatting for Alerts

```
Select stale column → Format → Conditional formatting
- If value > 0: Red background
- If value > 3: Bold red text
```

### Native Charts

```
Insert → Chart
- Pipeline funnel: Stacked bar chart of deals by stage
- Activity timeline: Line chart of emails processed per day
- Meeting load: Calendar heatmap (custom)
```

### Sparklines (Inline Charts)

```
=SPARKLINE(_Data_Email!B2:B8, {"charttype","column"})
```

---

## Dashboard Templates

### Template 1: Sales Command Center (Google Sheets)

**Tab: Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│  SALES COMMAND CENTER                   Last Updated: [NOW] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Pipeline │ │  Deals   │ │  Stale   │ │ Win Rate │       │
│  │ $245,000 │ │    12    │ │    3     │ │   34%    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  [PIPELINE CHART - Deals by Stage]                          │
│  ████████████████████ Qualification (5)                     │
│  ████████████████ Discovery (4)                             │
│  ████████ Proposal (2)                                      │
│  ████ Negotiation (1)                                       │
│                                                              │
│  ⚠️ STALE DEALS NEEDING ACTION                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Deal          │ Company    │ Stage     │ Days │ Action │ │
│  │ Acme Rollout  │ Acme Corp  │ Proposal  │ 6    │ Call   │ │
│  │ Beta Pilot    │ Beta Inc   │ Discovery │ 8    │ Email  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📅 TODAY'S MEETINGS                                        │
│  • 10:00 AM - John Smith @ Acme (Prep: ✅)                  │
│  • 2:00 PM - Sarah Jones @ Beta (Prep: ⏳)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Tabs:**
- `_Pipeline` — Full deal list from HubSpot
- `_Meetings` — Today's meetings from Calendar
- `_Activity` — Recent activity log

---

### Template 2: Email Agent Monitor (Google Sheets)

**Tab: Agent_Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│  EMAIL AGENT STATUS                    🟢 Active            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TODAY'S STATS                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Processed │ │ Drafts   │ │ Alerts   │ │ Errors   │       │
│  │    47    │ │    12    │ │    3     │ │    0     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  [CLASSIFICATION PIE CHART]                                  │
│  🔴 Urgent: 3                                                │
│  🟠 Needs Reply: 8                                           │
│  🟡 Review: 5                                                │
│  🔵 FYI: 15                                                  │
│  ⚫ Low Priority: 16                                         │
│                                                              │
│  RECENT ACTIVITY                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Time  │ Action              │ Details          │ Status│ │
│  │ 10:32 │ Draft created       │ Reply to John    │ ✅    │ │
│  │ 10:15 │ Email classified    │ 🔴 Urgent from.. │ ✅    │ │
│  │ 10:01 │ Morning scan        │ 47 emails        │ ✅    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  PENDING ACTIONS (Awaiting Mat)                             │
│  • Review draft for Acme proposal response                  │
│  • Approve follow-up to Beta Inc                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Cron Jobs for Dashboard Updates

| Job | Schedule | Actions |
|-----|----------|---------|
| **Pipeline Refresh** | 7am, 12pm, 5pm | Fetch HubSpot deals → Write to _Pipeline tab |
| **Email Stats** | Every hour | Count Gmail by label → Write to _Email tab |
| **Meeting Sync** | 6am daily | Fetch today's Calendar → Write to _Meetings tab |
| **Research Batch** | Sunday 8pm | Browser lookups → Write to Research_Cache |
| **Activity Log** | After each action | Append to _Activity tab |

---

## Implementation Steps

### Step 1: Set Up Google Sheet Structure

Create tabs:
```
Dashboard (formatted view)
_Pipeline (raw HubSpot data)
_Email (raw email stats)
_Meetings (raw calendar data)  
_Activity (action log)
_Research_Cache (contact/company data)
_Config (thresholds, settings)
```

### Step 2: Create Data Fetch Functions

```python
# Via Mac node - fetch and write to Sheets

def refresh_pipeline():
    # 1. Fetch from HubSpot API
    deals = hubspot_get_deals()
    
    # 2. Clear and write to Sheet
    sheets_clear_range('_Pipeline!A2:Z')
    sheets_write_range('_Pipeline!A2', deals)
    
    # 3. Log the action
    log_activity('pipeline_refresh', f'{len(deals)} deals updated')

def refresh_email_stats():
    # 1. Count emails by label
    stats = {
        'urgent': gmail_count('label:Urgent-Reply'),
        'needs_reply': gmail_count('label:Needs-Reply'),
        'processed_today': gmail_count('after:today')
    }
    
    # 2. Write to Sheet
    sheets_write_range('_Email!A2', [stats])
```

### Step 3: Set Up Cron Jobs

```
# Morning pipeline refresh
0 7 * * 1-5 /path/to/refresh_pipeline.py

# Hourly email stats
0 * * * * /path/to/refresh_email_stats.py

# Weekly research batch
0 20 * * 0 /path/to/batch_research.py
```

### Step 4: Build Dashboard Tab

Use Sheets formulas and charts that reference data tabs. Everything auto-updates when Clawd writes new data.

---

## Advanced: Web Dashboard via Mac Node

If you want a web UI beyond Sheets:

### Option A: Serve Static HTML from Mac

```bash
# Clawd creates HTML file
cat > ~/dashboards/sales.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-100 p-8">
  <div id="dashboard"></div>
  <script>
    // Fetch data from local JSON (Clawd updates this)
    fetch('data.json')
      .then(r => r.json())
      .then(data => renderDashboard(data));
  </script>
</body>
</html>
EOF

# Clawd updates data.json periodically
echo '{"pipeline_value": 245000, "deals": 12}' > ~/dashboards/data.json

# Serve locally
cd ~/dashboards && python3 -m http.server 8080
```

Mat opens: `http://localhost:8080/sales.html`

### Option B: Deploy to Vercel

See separate Vercel deployment guide. Requires service account setup for Sheets access from Vercel's servers.

---

## Summary: Recommended Approach

**For Mat's use case, Google Sheets is the best choice because:**

1. ✅ You already have full read/write access
2. ✅ No deployment or hosting needed
3. ✅ Mat already uses Sheets daily
4. ✅ Charts and formatting are built-in
5. ✅ Clawd can update data via cron jobs
6. ✅ Works on any device (Sheets app)

**Use web dashboard only if:**
- You need complex interactivity
- You want to share publicly
- Sheets formatting is too limiting
