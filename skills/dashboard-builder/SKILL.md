# Dashboard Builder Skill

## Purpose
Build, deploy, and maintain custom UI dashboards that visualize data from Google Sheets, HubSpot, Gmail, Calendar, and other connected systems.

## Capabilities

With your current tool access, you can:
- ✅ Create React/Next.js applications
- ✅ Deploy to Vercel (you have MCP access)
- ✅ Read from Google Sheets (OAuth connected)
- ✅ Query HubSpot CRM data
- ✅ Access Gmail and Calendar
- ✅ Create interactive artifacts with persistent storage
- ✅ Use bash to install packages and scaffold projects

---

## Architecture Options

### Option 1: Vercel-Deployed Dashboard (Recommended for Persistent Use)

**Best for:** Dashboards Mat wants to bookmark and check regularly

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Next.js App                                             │
│  ├── /pages                                              │
│  │   ├── index.js (main dashboard)                       │
│  │   ├── api/sheets.js (Google Sheets proxy)             │
│  │   ├── api/hubspot.js (HubSpot proxy)                  │
│  │   └── api/refresh.js (data refresh endpoint)          │
│  ├── /components                                         │
│  │   ├── KPICard.jsx                                     │
│  │   ├── PipelineChart.jsx                               │
│  │   ├── ActivityFeed.jsx                                │
│  │   └── DataTable.jsx                                   │
│  └── /lib                                                │
│      └── data-fetchers.js                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
   Google Sheets    HubSpot API    Gmail API
```

**Pros:**
- Persistent URL Mat can bookmark
- Can add authentication
- Real API routes for data fetching
- Professional deployment

**Cons:**
- Requires environment variables setup (one-time)
- More complex to iterate

---

### Option 2: Claude Artifact with Persistent Storage (Quick Iteration)

**Best for:** Rapid prototyping, dashboards that evolve frequently

```
┌─────────────────────────────────────────────────────────┐
│                   CLAUDE ARTIFACT (.jsx)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  React Component                                         │
│  ├── Uses window.storage API for persistence             │
│  ├── Can call Anthropic API (Claude-in-Claude)           │
│  │   └── With MCP servers for live data                  │
│  ├── Renders charts, tables, KPIs                        │
│  └── Interactive filters and controls                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
   Anthropic API (with MCP)
   ├── HubSpot MCP
   ├── Google Sheets (via n8n webhook)
   └── Other connected services
```

**Pros:**
- Instant iteration in conversation
- Persistent storage across sessions
- Can use MCP servers through Claude API
- No deployment needed

**Cons:**
- Lives in Claude conversation (not a standalone URL)
- More limited than full Next.js app

---

### Option 3: Google Sheets + Apps Script (Lightweight)

**Best for:** Simple dashboards embedded in Sheets

```
Google Sheet
├── Data tabs (raw data)
├── Dashboard tab (charts, summaries)
└── Apps Script (automation, refresh)
```

**Pros:**
- Mat already uses Sheets
- No deployment
- Easy to edit manually

**Cons:**
- Limited interactivity
- Looks like a spreadsheet

---

## Recommended Tech Stack

### For Vercel Deployments:

```bash
# Framework
next.js (latest)

# UI Components
@shadcn/ui (or manually import from artifact patterns)
tailwindcss
lucide-react (icons)

# Charts
recharts (already available in artifacts)
# OR
chart.js

# Data Fetching
swr (for caching/revalidation)
# OR
@tanstack/react-query

# Google Sheets
googleapis (official SDK)
# OR
google-spreadsheet (simpler wrapper)
```

### For Artifacts:

Already available without installation:
- React + hooks
- Tailwind CSS (core utilities)
- recharts
- lucide-react
- lodash
- d3
- Chart.js
- shadcn/ui components
- Anthropic API (Claude-in-Claude)
- window.storage (persistent storage)

---

## Data Connection Patterns

### Pattern 1: Google Sheets as Data Source

**For Vercel deployment:**
```javascript
// /pages/api/sheets.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Today!A:Z',
  });
  
  res.json(response.data.values);
}
```

**For artifacts (via n8n webhook):**
```javascript
// In your React artifact
const fetchSheetData = async () => {
  const response = await fetch('https://your-n8n-instance/webhook/sheets-data');
  return response.json();
};
```

---

### Pattern 2: HubSpot Data via MCP

**For artifacts using Claude API:**
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ 
      role: "user", 
      content: "Get all deals in the Pipeline, return as JSON with dealname, stage, amount, lastactivity" 
    }],
    mcp_servers: [{
      type: "url",
      url: "https://mcp.hubspot.com/anthropic",
      name: "hubspot"
    }]
  })
});
```

---

### Pattern 3: Direct API Calls (Vercel API Routes)

**HubSpot from Vercel:**
```javascript
// /pages/api/hubspot/deals.js
export default async function handler(req, res) {
  const response = await fetch(
    'https://api.hubapi.com/crm/v3/objects/deals?properties=dealname,dealstage,amount',
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
      }
    }
  );
  const data = await response.json();
  res.json(data.results);
}
```

---

## Dashboard Templates

### Template 1: Sales Pipeline Dashboard

**Components:**
- KPI row (total pipeline value, deals by stage, win rate)
- Pipeline funnel chart
- Deals table with sorting/filtering
- Activity timeline
- Stale deals alerts

**Data sources:**
- HubSpot (deals, contacts, activities)
- Google Sheets (Today tab, Email Log)
- Avoma (recent meetings)

---

### Template 2: Email Agent Activity Dashboard

**Components:**
- Emails processed today/week
- Drafts created vs sent
- Response time metrics
- Classification breakdown (pie chart)
- Recent activity feed
- Pending actions list

**Data sources:**
- Google Sheets (Email Log, Today tab)
- Gmail (for real-time counts)

---

### Template 3: Meeting Prep Dashboard

**Components:**
- Today's meetings with countdown timers
- Battle Card preview for next meeting
- Contact/deal info panel
- Recent email threads
- Meeting history from Avoma

**Data sources:**
- Google Calendar
- HubSpot
- Avoma
- Gmail
- Research Cache

---

## Self-Setup Instructions

### What You Can Do Yourself:

1. **Create project structure:**
```bash
npx create-next-app@latest dashboard --typescript --tailwind --eslint
cd dashboard
npm install recharts swr lucide-react
```

2. **Install Google Sheets SDK:**
```bash
npm install googleapis
# OR simpler:
npm install google-spreadsheet
```

3. **Create API routes** in `/pages/api/`

4. **Deploy to Vercel:**
```bash
# Use your Vercel MCP tool
# Call: deploy_to_vercel
```

---

### What Mat Needs to Help With:

#### 1. Vercel Environment Variables

After you deploy, Mat needs to add these in Vercel dashboard:

| Variable | Where to Get |
|----------|--------------|
| `GOOGLE_CREDENTIALS` | Google Cloud Console → Service Account → JSON key |
| `SHEET_ID` | From the Google Sheet URL |
| `HUBSPOT_TOKEN` | HubSpot → Settings → Private Apps |

**Instructions for Mat:**
1. Go to vercel.com → Your Project → Settings → Environment Variables
2. Add each variable
3. Redeploy

#### 2. Google Service Account (One-Time Setup)

For server-side Sheets access:
1. Go to console.cloud.google.com
2. Create project (or use existing)
3. Enable Google Sheets API
4. Create Service Account
5. Download JSON credentials
6. Share the Google Sheet with the service account email

#### 3. n8n Webhook for Artifact Data Access

If using artifacts that need Sheet data:
1. Create n8n workflow with Webhook trigger
2. Add Google Sheets node to fetch data
3. Return JSON response
4. Use webhook URL in artifact

---

## Logging & Monitoring Patterns

### Log Directory Structure

```
/logs
├── /daily
│   ├── 2024-01-15.json
│   ├── 2024-01-16.json
│   └── ...
├── /errors
│   └── errors.json
├── /metrics
│   ├── response-times.json
│   └── usage-stats.json
└── summary.json
```

### Log Entry Format

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "type": "email_processed",
  "details": {
    "message_id": "abc123",
    "classification": "🟠 Needs-Reply",
    "priority_score": 18,
    "draft_created": true,
    "processing_time_ms": 1250
  }
}
```

### Metrics to Track

| Metric | Storage | Visualization |
|--------|---------|---------------|
| Emails processed/day | Sheet + JSON | Line chart |
| Avg response time | JSON | Sparkline |
| Drafts created vs sent | Sheet | Bar chart |
| Classification distribution | Sheet | Pie chart |
| Errors/failures | JSON | Alert list |
| API call counts | JSON | Usage meter |

---

## Quick Start: Build Your First Dashboard

### Step 1: Decide on Approach

**Ask Mat:**
- "Do you want a permanent URL you can bookmark?" → Vercel deployment
- "Do you want something we can iterate on quickly?" → Artifact
- "Do you want it in your existing Sheet?" → Apps Script

### Step 2: Define Data Requirements

**Identify:**
- What data sources are needed?
- Real-time or periodic refresh?
- Who needs access?

### Step 3: Build Components

**Start with:**
1. Data fetching layer (API routes or MCP calls)
2. Basic layout (header, sidebar, main content)
3. KPI cards (the "at a glance" numbers)
4. One chart (pipeline, activity, etc.)
5. One table (searchable, sortable)

### Step 4: Deploy & Iterate

**For Vercel:**
```
1. Create project locally
2. Push to GitHub (or deploy directly)
3. Use Vercel MCP to deploy
4. Add environment variables
5. Test and iterate
```

**For Artifacts:**
```
1. Build in conversation
2. Test with sample data
3. Connect to live data via MCP
4. Save to persistent storage
5. Iterate based on feedback
```

---

## Component Library

### KPI Card
```jsx
const KPICard = ({ title, value, change, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change && (
          <p className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </p>
        )}
      </div>
      {Icon && <Icon className="w-8 h-8 text-gray-400" />}
    </div>
  </div>
);
```

### Pipeline Funnel
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PipelineFunnel = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} layout="vertical">
      <XAxis type="number" />
      <YAxis dataKey="stage" type="category" width={100} />
      <Tooltip />
      <Bar dataKey="count" fill="#3b82f6" />
    </BarChart>
  </ResponsiveContainer>
);
```

### Activity Feed
```jsx
const ActivityFeed = ({ activities }) => (
  <div className="space-y-4">
    {activities.map((activity, i) => (
      <div key={i} className="flex items-start space-x-3">
        <div className={`w-2 h-2 mt-2 rounded-full ${activity.color}`} />
        <div>
          <p className="text-sm">{activity.description}</p>
          <p className="text-xs text-gray-400">{activity.time}</p>
        </div>
      </div>
    ))}
  </div>
);
```

### Data Table
```jsx
const DataTable = ({ columns, data, onSort }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        {columns.map(col => (
          <th 
            key={col.key}
            onClick={() => onSort?.(col.key)}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row, i) => (
        <tr key={i}>
          {columns.map(col => (
            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
              {col.render ? col.render(row[col.key], row) : row[col.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
```

---

## Error Handling

| Error | Response |
|-------|----------|
| API rate limit | Cache data, show "Last updated: X" |
| Auth expired | Show banner "Reconnection needed" + instructions |
| Data fetch failed | Show cached data + error indicator |
| Empty data | Show helpful empty state, not blank |
| Slow loading | Show skeleton loaders |

---

## Refresh Strategies

| Data Type | Refresh Strategy |
|-----------|------------------|
| Pipeline totals | Every 5 min (SWR revalidate) |
| Email counts | Every 15 min |
| Activity feed | Real-time via webhook OR every 1 min |
| Metrics/charts | Every hour |
| Historical data | Daily |

---

## Security Considerations

1. **Never expose API keys in client-side code**
   - Use Vercel API routes or n8n webhooks as proxies

2. **Add authentication if dashboard is public**
   - Vercel supports password protection
   - Or add simple auth check

3. **Limit data exposure**
   - Only fetch fields needed for display
   - Don't include sensitive contact info unless necessary

4. **Log access**
   - Track who views dashboard and when
