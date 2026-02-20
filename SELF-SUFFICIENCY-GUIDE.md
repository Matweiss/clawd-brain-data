# Clawd Agent — Self-Sufficiency Guide

## What You Can Do Without Help

### ✅ Install Packages

```bash
# Node.js packages
npm install [package-name]

# Python packages (always use this flag)
pip install [package-name] --break-system-packages

# Create new Next.js project
npx create-next-app@latest [name] --typescript --tailwind --app
```

### ✅ Deploy to Vercel

Use your Vercel MCP tools:
- `deploy_to_vercel` — Deploy current project
- `list_deployments` — Check deployment status
- `get_deployment_build_logs` — Debug failures

### ✅ Access Data Sources

| Source | How to Access |
|--------|---------------|
| Google Sheets | Use `google_drive_search` or create API route with `googleapis` |
| HubSpot | Use HubSpot MCP tools directly |
| Gmail | Use Gmail tools (`search_gmail_messages`, `read_gmail_thread`) |
| Calendar | Use Calendar tools (`list_gcal_events`, `find_free_time`) |
| Google Drive | Use `google_drive_search`, `google_drive_fetch` |

### ✅ Create Files & Projects

```bash
# Create directories
mkdir -p /home/claude/projects/dashboard-name

# Create files
# Use create_file tool or bash echo/cat

# Scaffold projects
npx create-next-app@latest
npx create-react-app
```

### ✅ Create Artifacts

Create `.jsx`, `.html`, `.md`, `.mermaid`, `.svg` files that render in the UI.

### ✅ Use Persistent Storage (in Artifacts)

```javascript
await window.storage.set('key', JSON.stringify(data));
const result = await window.storage.get('key');
```

### ✅ Make API Calls (from Artifacts)

```javascript
// Claude API with MCP servers
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: "..." }],
    mcp_servers: [{ type: "url", url: "https://mcp.hubspot.com/anthropic", name: "hubspot" }]
  })
});
```

### ✅ Execute n8n Workflows

Use n8n MCP tools:
- `search_workflows` — Find workflows
- `get_workflow_details` — Get workflow info
- `execute_workflow` — Run a workflow

---

## What Mat Needs to Help With

### 🔐 Environment Variables in Vercel

After you deploy, Mat needs to add secrets in Vercel dashboard:

**Google Sheets Access:**
1. Mat creates Service Account at console.cloud.google.com
2. Downloads JSON credentials
3. Adds as `GOOGLE_CREDENTIALS` in Vercel
4. Shares target Sheet with service account email

**HubSpot Access:**
1. Mat creates Private App in HubSpot
2. Grants CRM read scopes
3. Copies token to `HUBSPOT_TOKEN` in Vercel

**Instructions for Mat:**
```
1. Go to vercel.com
2. Select your project
3. Settings → Environment Variables
4. Add each variable
5. Redeploy
```

### 🔐 OAuth Re-authentication

If Google/Gmail/Calendar auth expires, Mat needs to re-authenticate through Claude.ai settings.

### 🔐 New API Keys

If you need access to a new service, Mat needs to:
1. Create account/API key
2. Add to Vercel environment variables
3. Or configure new MCP connection

---

## Quick Decision Tree

```
Mat asks for a dashboard
         │
         ▼
┌─────────────────────────────┐
│ Does it need to be a        │
│ permanent, bookmarkable URL?│
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      │Yes              │No
      ▼                 ▼
┌───────────┐    ┌────────────────┐
│ VERCEL    │    │ Does it need   │
│ DEPLOYMENT│    │ live data?     │
└───────────┘    └───────┬────────┘
                         │
                ┌────────┴────────┐
                │Yes              │No
                ▼                 ▼
          ┌───────────┐    ┌───────────┐
          │ ARTIFACT  │    │ ARTIFACT  │
          │ + MCP/API │    │ (static)  │
          └───────────┘    └───────────┘
```

---

## Standard Project Structure

### Vercel/Next.js Dashboard:

```
/dashboard-name
├── /app
│   ├── layout.tsx
│   ├── page.tsx              # Main dashboard
│   ├── /api
│   │   ├── sheets/route.ts   # Google Sheets data
│   │   ├── hubspot/route.ts  # HubSpot data
│   │   └── metrics/route.ts  # Aggregated metrics
│   └── /[other-pages]
├── /components
│   ├── KPICard.tsx
│   ├── Chart.tsx
│   ├── DataTable.tsx
│   └── ...
├── /lib
│   ├── sheets.ts             # Sheets client
│   ├── hubspot.ts            # HubSpot client
│   └── utils.ts
├── package.json
├── tailwind.config.js
└── next.config.js
```

### Artifact Dashboard:

```jsx
// Single file, all-in-one
export default function Dashboard() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch data on mount
    loadData();
  }, []);
  
  return (
    <div className="p-6 space-y-6">
      <header>...</header>
      <div className="grid grid-cols-4 gap-4">
        <KPICard ... />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Chart ... />
        <Table ... />
      </div>
    </div>
  );
}
```

---

## Common Commands

### Start New Dashboard Project:
```bash
cd /home/claude
npx create-next-app@latest my-dashboard --typescript --tailwind --app
cd my-dashboard
npm install recharts swr lucide-react googleapis
```

### Deploy to Vercel:
```
Use Vercel MCP: deploy_to_vercel
```

### Check Deployment:
```
Use Vercel MCP: list_deployments with projectId and teamId
```

### Debug Build Failure:
```
Use Vercel MCP: get_deployment_build_logs with deploymentId
```

### Create Log Directory:
```bash
mkdir -p /home/claude/logs/{daily,errors,metrics}
echo '[]' > /home/claude/logs/daily/$(date +%Y-%m-%d).json
```

---

## Data Fetching Patterns

### Pattern 1: SWR in Next.js

```typescript
// In component
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/sheets', fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  return <Content data={data} />;
}
```

### Pattern 2: Claude API in Artifact

```javascript
const fetchHubSpotData = async (query) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ 
        role: "user", 
        content: `${query}. Return ONLY valid JSON array, no explanation or markdown.` 
      }],
      mcp_servers: [{
        type: "url",
        url: "https://mcp.hubspot.com/anthropic",
        name: "hubspot"
      }]
    })
  });
  
  const data = await response.json();
  const textBlock = data.content.find(c => c.type === "text");
  return JSON.parse(textBlock.text.replace(/```json\n?|\n?```/g, ''));
};
```

### Pattern 3: n8n Webhook

```javascript
// First, create n8n workflow with Webhook trigger
// Then call it from your dashboard

const fetchFromN8n = async () => {
  const response = await fetch('https://n8n.srv882799.hstgr.cloud/webhook/your-endpoint');
  return response.json();
};
```

---

## Logging Best Practice

### Log to Google Sheet:

```javascript
const logToSheet = async (type, details) => {
  // Use n8n workflow to append to sheet
  await fetch('https://n8n.srv882799.hstgr.cloud/webhook/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      type,
      details
    })
  });
};
```

### Log to File:

```bash
# Append to daily log
echo '{"timestamp":"'$(date -Iseconds)'","type":"email_processed","details":{}}' >> /home/claude/logs/daily/$(date +%Y-%m-%d).json
```

### Log in Artifact (Persistent Storage):

```javascript
const appendLog = async (entry) => {
  try {
    const result = await window.storage.get('activity-log');
    const logs = result ? JSON.parse(result.value) : [];
    logs.push({ ...entry, timestamp: new Date().toISOString() });
    // Keep last 500 entries
    await window.storage.set('activity-log', JSON.stringify(logs.slice(-500)));
  } catch (e) {
    console.error('Logging failed:', e);
  }
};
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Vercel deploy fails | Check `get_deployment_build_logs` for errors |
| Google Sheets 401 | Mat needs to check/refresh credentials |
| HubSpot rate limit | Add caching, reduce refresh frequency |
| Artifact data stale | Add refresh button, reduce cache TTL |
| MCP call fails | Check MCP server URL, try simpler query |
| Package not found | Check spelling, try `npm search [name]` |

---

## Remember

1. **You are self-sufficient** for most tasks
2. **Ask Mat** only for secrets/credentials setup
3. **Start simple** — get data flowing first, then add features
4. **Test incrementally** — deploy early, iterate often
5. **Log everything** — debugging is easier with good logs
6. **Cache aggressively** — reduce API calls, improve speed
