# Memory System - Mission Control Integration

## Overview

The Memory System Dashboard is designed to integrate seamlessly with Mission Control as a new tabbed section.

## Integration Options

### Option 1: Iframe Tab (Recommended)

Add a new tab in Mission Control that loads the Memory Dashboard in an iframe:

```typescript
// In Mission Control's tab configuration
{
  id: 'memory',
  label: '🧠 Memory',
  component: 'iframe',
  props: {
    src: '/memory-dashboard/index.html',
    height: '100%'
  }
}
```

### Option 2: Embedded Component

Embed the Memory Dashboard as a React/Vue component within Mission Control:

```typescript
import { MemoryDashboard } from '@clawd/memory-dashboard';

// In your tab component
<MemoryDashboard 
  apiBaseUrl="/api/memory"
  theme="dark"
/>
```

### Option 3: API Integration

Use the Memory API directly within Mission Control's existing UI:

```typescript
const memoryApi = {
  async getStatus() {
    const res = await fetch('/api/memory/status');
    return res.json();
  },
  async getProjects() {
    const res = await fetch('/api/memory/projects');
    return res.json();
  },
  // ... etc
};
```

## Tab Layout Recommendation

```
┌─────────────────────────────────────────────────────────┐
│  Mission Control                                    🧠  │
├─────────────────────────────────────────────────────────┤
│  Dashboard | Agents | Workflows | 🧠 Memory | Settings  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Memory Dashboard Content]                             │
│                                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ Overview │ Projects │  Media   │ Search   │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                         │
│  [Tab Content]                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

The Memory Dashboard API provides:

- `GET /api/memory/status` - Overview stats
- `GET /api/memory/projects` - All projects
- `GET /api/memory/media` - Archived media
- `GET /api/memory/conversations` - Recent conversations
- `GET /api/memory/search?q=query` - Universal search

## Starting the API Server

```bash
# From workspace root
node memory/dashboard/api-server.cjs

# Or with custom port
MEMORY_API_PORT=3456 node memory/dashboard/api-server.cjs
```

## Environment Variables

```bash
# API Configuration
MEMORY_API_PORT=3456          # API server port
MEMORY_DIR=/path/to/memory    # Custom memory directory

# Feature Flags
MEMORY_AUTO_ARCHIVE=true      # Auto-archive incoming media
MEMORY_SMART_LOGGING=true     # Enable smart conversation detection
MEMORY_CALENDAR_SYNC=true     # Enable calendar integration
```

## Mission Control Components

### Quick Stats Widget

Add to Mission Control dashboard:

```typescript
const MemoryStatsWidget = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('/api/memory/status')
      .then(r => r.json())
      .then(setStats);
  }, []);
  
  return (
    <Widget title="Memory System">
      <Stat label="Active Projects" value={stats?.activeProjects} />
      <Stat label="Archived Media" value={stats?.mediaCount} />
      <Stat label="Stale Projects" value={stats?.staleProjects} alert={stats?.staleProjects > 0} />
    </Widget>
  );
};
```

### Recent Activity Feed

```typescript
const RecentActivityFeed = () => {
  const [activity, setActivity] = useState([]);
  
  // Poll for recent activity
  useEffect(() => {
    const poll = () => {
      fetch('/api/memory/status')
        .then(r => r.json())
        .then(data => setActivity(data.recentActivity));
    };
    
    poll();
    const interval = setInterval(poll, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Feed items={activity} />
  );
};
```

## Styling

The Memory Dashboard uses CSS variables for theming:

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --accent-primary: #00d4ff;
  --accent-secondary: #ff6b6b;
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
}
```

These match Mission Control's existing dark theme.

## File Structure

```
memory/
├── dashboard/
│   ├── index.html           # Dashboard UI
│   └── api-server.cjs       # API backend
├── scripts/
│   ├── heartbeat-integration.cjs
│   ├── calendar-integration.cjs
│   └── smart-logger.cjs
└── archive/
    ├── projects/
    ├── media/
    └── conversations/
```

## Next Steps

1. Choose integration option (1, 2, or 3)
2. Add Memory tab to Mission Control
3. Configure API server startup
4. Test end-to-end flow
