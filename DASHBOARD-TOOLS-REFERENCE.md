# Dashboard Builder — Tools & Packages Reference

## Package Installation Commands

### Node.js / Next.js Projects

```bash
# Core framework
npx create-next-app@latest [project-name] --typescript --tailwind --app

# Charts (pick one)
npm install recharts              # Recommended - also available in artifacts
npm install chart.js react-chartjs-2
npm install @nivo/core @nivo/bar @nivo/line @nivo/pie

# Data fetching (pick one)
npm install swr                   # Recommended - simple, caching built-in
npm install @tanstack/react-query # More powerful, more complex

# UI Components
npm install lucide-react          # Icons
npm install @radix-ui/react-*     # Headless components (shadcn uses these)
npm install clsx                  # Conditional classnames
npm install tailwind-merge        # Merge Tailwind classes

# Google Sheets
npm install googleapis            # Official SDK - full featured
npm install google-spreadsheet    # Simpler wrapper

# Date handling
npm install date-fns              # Lightweight
npm install dayjs                 # Alternative

# Tables
npm install @tanstack/react-table # Powerful tables
```

### Python (if using Streamlit)

```bash
pip install streamlit --break-system-packages
pip install plotly --break-system-packages
pip install pandas --break-system-packages
pip install gspread --break-system-packages          # Google Sheets
pip install oauth2client --break-system-packages     # Auth for Sheets
```

---

## Libraries Available in Artifacts (No Install Needed)

These are already available when creating `.jsx` artifacts:

| Library | Import | Use For |
|---------|--------|---------|
| React | `import { useState, useEffect } from "react"` | Core framework |
| Tailwind | Classes in JSX | Styling |
| recharts | `import { LineChart, BarChart, PieChart, ... } from "recharts"` | Charts |
| lucide-react | `import { Icon } from "lucide-react"` | Icons |
| lodash | `import _ from "lodash"` | Utilities |
| d3 | `import * as d3 from "d3"` | Advanced viz |
| Chart.js | `import * as Chart from "chart.js"` | Charts |
| Plotly | `import * as Plotly from "plotly"` | Interactive charts |
| Three.js | `import * as THREE from "three"` | 3D (r128) |
| shadcn/ui | `import { Alert, Button, Card, ... } from "@/components/ui/*"` | UI components |
| mathjs | `import * as math from "mathjs"` | Math operations |
| Papaparse | `import * as Papa from "papaparse"` | CSV parsing |
| SheetJS | `import * as XLSX from "sheetjs"` | Excel files |
| mammoth | `import * as mammoth from "mammoth"` | Word docs |
| Tone | `import * as Tone from "tone"` | Audio |
| TensorFlow | `import * as tf from "tensorflow"` | ML |

---

## MCP Servers Available

Use these with Claude API calls from artifacts:

```javascript
mcp_servers: [
  // HubSpot
  {
    type: "url",
    url: "https://mcp.hubspot.com/anthropic",
    name: "hubspot"
  },
  
  // n8n (Mat's instance)
  {
    type: "url",
    url: "https://n8n.srv882799.hstgr.cloud/mcp/MCP/1/sse",
    name: "n8n"
  },
  
  // Vercel
  {
    type: "url",
    url: "https://mcp.vercel.com",
    name: "vercel"
  },
  
  // ZoomInfo
  {
    type: "url",
    url: "https://mcp.zoominfo.com/mcp",
    name: "zoominfo"
  }
]
```

---

## Vercel MCP Tools

| Tool | Purpose |
|------|---------|
| `deploy_to_vercel` | Deploy current project |
| `list_projects` | List all projects |
| `list_deployments` | List deployments for a project |
| `get_deployment` | Get deployment details |
| `get_deployment_build_logs` | Debug failed builds |
| `get_project` | Get project details |
| `list_teams` | List available teams |

---

## Google Sheets Access Patterns

### From Vercel API Route:

```typescript
// /app/api/sheets/route.ts
import { google } from 'googleapis';

export async function GET() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Today!A:Z',
  });
  
  return Response.json(response.data.values);
}
```

### From Artifact (via n8n webhook):

```javascript
// Create n8n workflow first:
// Webhook trigger → Google Sheets node → Respond to Webhook

const fetchSheetData = async (range) => {
  const response = await fetch(
    `https://n8n.srv882799.hstgr.cloud/webhook/sheets?range=${range}`
  );
  return response.json();
};
```

### From Artifact (via Claude API):

```javascript
// Use Claude to fetch and return data
const fetchData = async (query) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ 
        role: "user", 
        content: `${query}. Return ONLY valid JSON, no explanation.` 
      }],
      mcp_servers: [/* relevant MCP servers */]
    })
  });
  
  const data = await response.json();
  // Parse the text response as JSON
  const textContent = data.content.find(c => c.type === "text");
  return JSON.parse(textContent.text);
};
```

---

## Artifact Persistent Storage

```javascript
// SAVE data
await window.storage.set('my-key', JSON.stringify(data));

// GET data
const result = await window.storage.get('my-key');
const data = result ? JSON.parse(result.value) : null;

// LIST keys with prefix
const keys = await window.storage.list('dashboard:');

// DELETE data
await window.storage.delete('my-key');

// SHARED data (visible to all users)
await window.storage.set('shared-key', data, true);  // true = shared
```

**Limits:**
- Keys: <200 characters, no whitespace/slashes/quotes
- Values: <5MB per key
- Rate limited — batch related data

**⚠️ NEVER use localStorage or sessionStorage in artifacts — they don't work!**

---

## Chart Quick Reference

### Recharts (Recommended)

```jsx
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Line Chart
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>

// Bar Chart
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#82ca9d" />
  </BarChart>
</ResponsiveContainer>

// Pie Chart
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
      {data.map((entry, index) => (
        <Cell key={index} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

---

## Tailwind Quick Reference

### Layout
```
flex, flex-col, flex-row
items-center, justify-between, justify-center
grid, grid-cols-2, grid-cols-3, grid-cols-4
gap-2, gap-4, gap-6
p-4, px-6, py-2, m-4, mx-auto
w-full, h-full, min-h-screen
```

### Cards/Containers
```
bg-white, bg-gray-50, bg-gray-100
rounded-lg, rounded-xl
shadow, shadow-md, shadow-lg
border, border-gray-200
```

### Typography
```
text-sm, text-base, text-lg, text-xl, text-2xl
font-medium, font-semibold, font-bold
text-gray-500, text-gray-700, text-gray-900
```

### Colors
```
text-blue-500, bg-blue-500
text-green-500, bg-green-500
text-red-500, bg-red-500
text-yellow-500, bg-yellow-500
```

### Interactive
```
hover:bg-gray-100
cursor-pointer
transition-colors
```

---

## Component Patterns

### KPI Card
```jsx
const KPICard = ({ title, value, change, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </p>
        )}
      </div>
      {Icon && <Icon className="w-8 h-8 text-gray-400" />}
    </div>
  </div>
);
```

### Loading Skeleton
```jsx
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Usage
<Skeleton className="h-8 w-32" />
<Skeleton className="h-64 w-full" />
```

### Data Table
```jsx
const DataTable = ({ columns, data }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map(col => (
            <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {columns.map(col => (
              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

### Status Badge
```jsx
const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
};
```

---

## Error Handling Pattern

```jsx
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <EmptyState />;
  
  return <DashboardContent data={data} />;
};
```

---

## Deployment Checklist

### Before Deploying to Vercel:

- [ ] All API keys in environment variables (not hardcoded)
- [ ] Error boundaries around data fetching
- [ ] Loading states for all async operations
- [ ] Mobile responsive (test at 375px width)
- [ ] No console errors
- [ ] Data refreshes work

### After Deploying:

- [ ] Test all data connections
- [ ] Verify environment variables are set
- [ ] Check build logs for warnings
- [ ] Test on mobile device
- [ ] Share URL with Mat for feedback
