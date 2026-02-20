# Dashboard Builder — Execution Plan

## Overview

This plan enables you to build custom UI dashboards that pull data from Google Sheets, HubSpot, Gmail, Calendar, and other connected systems. You can deploy to Vercel for persistent dashboards or create artifacts for quick iteration.

---

## Your Available Tools

### Already Connected (Use Immediately):

| Tool | Access Level | Dashboard Use |
|------|--------------|---------------|
| **Vercel MCP** | Full deploy access | Deploy Next.js dashboards |
| **Google Sheets** | Read/write via OAuth | Data storage, logs, cache |
| **HubSpot MCP** | Full CRM read | Pipeline data, contacts, deals |
| **Google Calendar** | Read via OAuth | Meeting data, availability |
| **Gmail** | Read via OAuth | Email metrics, activity |
| **Google Drive** | Read via OAuth | Document references |
| **n8n** | Workflow execution | Webhooks for data access |
| **Bash/Computer** | Full access | Install packages, scaffold projects |
| **Artifacts** | React/HTML creation | Quick dashboard prototypes |

### What You Can Install Yourself:

```bash
# Node.js packages (via npm)
npm install recharts           # Charts (also in artifacts)
npm install swr                # Data fetching with caching
npm install googleapis         # Google Sheets SDK
npm install lucide-react       # Icons
npm install @tanstack/react-query  # Alternative data fetching

# Python packages (via pip)
pip install streamlit --break-system-packages    # Quick dashboards
pip install plotly --break-system-packages       # Interactive charts
pip install pandas --break-system-packages       # Data manipulation
```

---

## Build Approaches

### Approach A: Vercel Deployment (Recommended for Production)

**When to use:** Mat wants a permanent URL, regular use, shared access

**Steps:**

1. **Scaffold Next.js project:**
```bash
cd /home/claude
npx create-next-app@latest dashboard-name --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd dashboard-name
```

2. **Install dependencies:**
```bash
npm install recharts swr lucide-react googleapis
```

3. **Create API routes for data:**
```
/app/api/sheets/route.ts     → Google Sheets data
/app/api/hubspot/route.ts    → HubSpot data (or use MCP in artifact)
/app/api/metrics/route.ts    → Aggregated metrics
```

4. **Build dashboard components:**
```
/components/KPICard.tsx
/components/PipelineChart.tsx
/components/DataTable.tsx
/components/ActivityFeed.tsx
```

5. **Deploy to Vercel:**
```
Use Vercel MCP: deploy_to_vercel
```

6. **Configure environment variables (Mat's help needed):**
```
GOOGLE_CREDENTIALS={"type":"service_account",...}
SHEET_ID=1M9xeBYA9wwU8PE95-QS2FmxH-CHhnp_4-uRx_qjKUp0
HUBSPOT_TOKEN=pat-na1-xxxxx
```

---

### Approach B: Claude Artifact (Quick Iteration)

**When to use:** Prototyping, frequent changes, conversation-based access

**Steps:**

1. **Create React artifact (.jsx file)**

2. **Use persistent storage for data caching:**
```javascript
// Save data
await window.storage.set('dashboard-data', JSON.stringify(data));

// Load data
const result = await window.storage.get('dashboard-data');
const data = result ? JSON.parse(result.value) : null;
```

3. **Fetch live data via Claude API with MCP:**
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ 
      role: "user", 
      content: "Query HubSpot for all deals, return JSON" 
    }],
    mcp_servers: [{
      type: "url",
      url: "https://mcp.hubspot.com/anthropic",
      name: "hubspot"
    }]
  })
});
```

4. **Available libraries in artifacts (no install needed):**
- React + hooks
- Tailwind CSS
- recharts
- lucide-react
- lodash
- d3
- Chart.js
- shadcn/ui
- Plotly
- Three.js

---

### Approach C: n8n + Google Sheets (Lightweight)

**When to use:** Simple data display, no coding needed by Mat

**Steps:**

1. **Create n8n workflow:**
   - Trigger: Schedule (every 15 min) or Webhook
   - Actions: Fetch from HubSpot, Gmail, etc.
   - Output: Write to Google Sheet

2. **Build dashboard in Google Sheets:**
   - Data tabs (hidden)
   - Dashboard tab with charts and summaries
   - Use Sheets' built-in charts

3. **Optional: Apps Script for interactivity**

---

## Log Directory Setup

### Create Log Structure:

```bash
# In your working directory or Google Drive
mkdir -p logs/daily logs/errors logs/metrics

# Initialize log files
echo '{"entries":[]}' > logs/daily/$(date +%Y-%m-%d).json
echo '{"errors":[]}' > logs/errors/errors.json
echo '{"metrics":[]}' > logs/metrics/usage.json
```

### Or Use Google Sheets:

Create tabs in your main Sheet:
- `Logs_Daily` — timestamp, type, details
- `Logs_Errors` — timestamp, error, context
- `Logs_Metrics` — timestamp, metric, value

### Log Entry Function:

```javascript
const logEntry = async (type, details) => {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    details
  };
  
  // Option 1: Append to Sheet
  await appendToSheet('Logs_Daily', entry);
  
  // Option 2: Write to file
  await fs.appendFile(`logs/daily/${today}.json`, JSON.stringify(entry) + '\n');
  
  // Option 3: Persistent storage (artifacts)
  const logs = await window.storage.get('logs');
  const existing = logs ? JSON.parse(logs.value) : [];
  existing.push(entry);
  await window.storage.set('logs', JSON.stringify(existing.slice(-1000))); // Keep last 1000
};
```

---

## Dashboard Templates to Build

### 1. Sales Command Center

**Purpose:** Mat's daily overview of pipeline and activity

**Sections:**
```
┌─────────────────────────────────────────────────────────┐
│  KPIs: Pipeline Value | Deals This Month | Win Rate    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  Pipeline Funnel │  │  Recent Activity Feed        │ │
│  │  (by stage)      │  │  - Emails sent/received      │ │
│  │                  │  │  - Meetings completed        │ │
│  │                  │  │  - Deal stage changes        │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Deals Table (sortable, filterable)                  ││
│  │  Name | Company | Stage | Value | Last Activity     ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Stale Deals Alert                                   ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Data Sources:**
- HubSpot → deals, pipeline stages
- Google Sheets → Today tab, activity log
- Gmail → email counts
- Calendar → meeting counts

---

### 2. Email Agent Monitor

**Purpose:** Track what the email agent is doing

**Sections:**
```
┌─────────────────────────────────────────────────────────┐
│  Status: 🟢 Active | Last Run: 5 min ago               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Today's Stats                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │Processed│ │ Drafts │ │ Alerts │ │ Errors │           │
│  │   47    │ │   12   │ │    3   │ │    0   │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Classification   │  │  Processing Timeline         │ │
│  │ Breakdown (pie)  │  │  (emails over time)          │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Recent Activity Log                                 ││
│  │  Time | Action | Details | Status                   ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Pending Actions (awaiting Mat's review)             ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Data Sources:**
- Google Sheets → Email Log, Today tab
- Gmail → real-time counts
- Logs → error tracking

---

### 3. Meeting Prep Dashboard

**Purpose:** Pre-meeting context at a glance

**Sections:**
```
┌─────────────────────────────────────────────────────────┐
│  Next Meeting: [Name] @ [Company] in 45 min            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────┐  ┌────────────────────────────┐│
│  │  Contact Info       │  │  Deal Status               ││
│  │  Name, Title        │  │  Stage: Proposal           ││
│  │  Email, Phone       │  │  Value: $45,000            ││
│  │  LinkedIn link      │  │  Close Date: Feb 15        ││
│  └─────────────────────┘  └────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Last Meeting Summary (from Avoma)                   ││
│  │  Key points, objections, action items               ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Email History (last 5 threads)                      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Talking Points / Agenda                             ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Data Sources:**
- Calendar → meeting details
- HubSpot → contact, deal
- Avoma → meeting transcript
- Gmail → recent threads
- Research Cache → LinkedIn data

---

## Implementation Phases

### Phase 1: Foundation (Day 1)

- [ ] Decide primary approach (Vercel vs Artifact)
- [ ] Set up logging structure (Sheet tabs or files)
- [ ] Create data fetching utilities
- [ ] Build first KPI component
- [ ] Test data flow end-to-end

### Phase 2: Sales Dashboard (Day 2-3)

- [ ] Build pipeline funnel chart
- [ ] Create deals table with sorting
- [ ] Add activity feed
- [ ] Implement stale deals alert
- [ ] Deploy v1

### Phase 3: Email Agent Monitor (Day 4-5)

- [ ] Create status indicators
- [ ] Build classification pie chart
- [ ] Add timeline chart
- [ ] Create activity log table
- [ ] Connect to Sheet data

### Phase 4: Meeting Prep (Day 6-7)

- [ ] Build contact info panel
- [ ] Create deal status card
- [ ] Add meeting summary section
- [ ] Build email history list
- [ ] Auto-populate from calendar

### Phase 5: Polish & Integrate (Week 2)

- [ ] Add refresh controls
- [ ] Implement error handling
- [ ] Create loading states
- [ ] Add filtering/search
- [ ] Mobile responsiveness
- [ ] Connect Telegram notifications for dashboard events

---

## What Mat Needs to Do (One-Time Setup)

### For Vercel Deployments:

1. **Create Google Service Account:**
   - Go to console.cloud.google.com
   - Create project → Enable Sheets API
   - Create Service Account → Download JSON
   - Share target Sheet with service account email

2. **Get HubSpot Private App Token:**
   - HubSpot → Settings → Private Apps → Create
   - Grant CRM read scopes
   - Copy token

3. **Add Environment Variables in Vercel:**
   - Project → Settings → Environment Variables
   - Add: `GOOGLE_CREDENTIALS`, `SHEET_ID`, `HUBSPOT_TOKEN`

### For n8n Data Access:

1. **Create Sheets webhook workflow:**
   - Webhook trigger → Sheets node → Respond to Webhook
   - Activate and copy webhook URL

2. **Create HubSpot webhook workflow:**
   - Webhook trigger → HubSpot node → Respond to Webhook
   - Activate and copy webhook URL

---

## Quick Commands

### Scaffold New Dashboard:
```bash
cd /home/claude
npx create-next-app@latest [name] --typescript --tailwind --app
cd [name]
npm install recharts swr lucide-react
```

### Deploy to Vercel:
```
Use Vercel MCP tool: deploy_to_vercel
```

### Check Vercel Status:
```
Use Vercel MCP tool: list_deployments with projectId
```

### Create Artifact Dashboard:
```
Create .jsx file with React component
Use Tailwind for styling
Use recharts for charts
Use window.storage for persistence
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Dashboard load time | <3 seconds |
| Data freshness | <15 min old |
| Mobile usable | Yes |
| Zero manual data entry | Yes |
| Mat checks daily | Yes |
