# Chief of Staff Dashboard - Build Plan

**Goal:** Integrate v0.3 spec into the existing Clawd Command Center dashboard

**Current Status:**
- Dashboard repo: `/data/.openclaw/workspace/clawd-command/`
- Deployed: https://clawd-command.vercel.app
- Backend: Supabase (PostgreSQL)
- Work Agent: Operational (Python scripts in `/data/.openclaw/workspace/agents/`)

---

## What Mat Wants

**Priority:** Build the Chief of Staff dashboard FIRST (Home Assistant + Sarah portal come later)

**Vision:** A work-focused command center powered by the Work Agent with these features:

### 1. Global Sidebar Chat
- Persistent on all views
- Can assign tasks to Clawd
- Natural language commands (draft emails, research, meeting prep)

### 2. Dashboard View
- Clickable KPI cards → navigate to relevant views
- Today's schedule with meeting links + prep buttons
- Pipeline by stage chart (with counts)
- Tasks due today (with suggested tasks)

### 3. Stale Deals View
- Dedicated page for stale deals
- Auto-generated recommended actions
- Auto-create tasks for stale deals

### 4. Pipeline Tab
- Filters (stage, status, last activity)
- Sortable columns
- Contact info in table
- Click row → open in HubSpot

### 5. Tasks Tab
- Drag-and-drop reordering
- Urgent section (red highlight)
- "With Clawd" section (assigned tasks)
- Suggested tasks section
- Undo functionality

---

## Current Architecture

**Frontend:**
- Next.js 14 (App Router)
- Tailwind CSS
- Components in `/data/.openclaw/workspace/clawd-command/components/`
- API routes in `/data/.openclaw/workspace/clawd-command/app/api/`

**Backend:**
- Supabase (PostgreSQL)
- Tables: `deals`, `tasks`, `meetings`
- Connection via `@supabase/supabase-js`

**Work Agent:**
- Python scripts in `/data/.openclaw/workspace/agents/`
- `work_agent.py` - HubSpot pipeline monitoring
- Runs hourly via cron (8am-5pm PST)
- Writes to Supabase

**APIs:**
- HubSpot (deals, contacts, companies)
- Avoma (meeting notes)
- Google Calendar (via OAuth)

---

## Build Strategy

### Option A: Enhance Existing Dashboard (RECOMMENDED)
**Pros:**
- Already deployed and working
- Supabase backend ready
- Work Agent integrated

**Cons:**
- Need to merge v0.3 features into existing structure

### Option B: Start Fresh from Prototype
**Pros:**
- Prototype has all v0.3 features
- Clean slate

**Cons:**
- Lose existing Supabase integration
- Work Agent would need rewiring

**Decision:** Option A - enhance existing dashboard

---

## Implementation Phases

### Phase 1: Core UI Updates (Today)
- [ ] Add global sidebar chat component
- [ ] Make KPI cards clickable (navigate to views)
- [ ] Enhance schedule component (meeting links, prep buttons)
- [ ] Update pipeline chart (show counts + totals)
- [ ] Add task undo functionality

### Phase 2: New Views (Today)
- [ ] Create `/stale-deals` route
- [ ] Auto-generate stale deal tasks
- [ ] Build meeting prep modal

### Phase 3: Task Management (Tomorrow)
- [ ] Drag-and-drop task reordering
- [ ] Urgent tasks section
- [ ] "With Clawd" tasks section
- [ ] Suggested tasks generation
- [ ] Task assignment to Clawd flow

### Phase 4: Pipeline Enhancements (Tomorrow)
- [ ] Add contact info to pipeline table
- [ ] Sortable columns
- [ ] Filter dropdowns
- [ ] Click row → HubSpot link

### Phase 5: Chat Integration (Day 3)
- [ ] `/api/chat` endpoint
- [ ] Natural language command parsing
- [ ] Execute actions from chat
- [ ] Task assignment via chat

### Phase 6: Work Agent Connection (Day 3)
- [ ] Connect Work Agent to dashboard backend
- [ ] Auto-generate suggested tasks
- [ ] Meeting prep generation (45 min before)
- [ ] Stale deal detection

---

## Data Model Updates Needed

### Tasks Table (Supabase)
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority_order INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'mat';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_suggested BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS clawd_result JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Status values: todo, urgent, assigned_to_clawd, clawd_working, awaiting_review, done
```

### Meetings Table (Supabase)
```sql
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS prep_status TEXT DEFAULT 'not_requested';
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS prep_content JSONB;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS notes_url TEXT;

-- prep_status values: not_requested, generating, ready
```

### Deals Table (Supabase)
```sql
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS company_id TEXT;
```

---

## API Endpoints to Build

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Send message to Clawd, get response |
| `/api/chat/action` | POST | Execute action from chat |
| `/api/tasks/suggested` | GET | Get auto-generated task suggestions |
| `/api/tasks/[id]/assign-clawd` | POST | Assign task to Clawd |
| `/api/tasks/[id]/undo` | POST | Undo completed task |
| `/api/tasks/reorder` | POST | Update priority order |
| `/api/meetings/[id]/prep` | POST | Request prep from Clawd |
| `/api/meetings/[id]/prep` | GET | Get prep content |
| `/api/stale-deals` | GET | Get stale deals with recommendations |

---

## Next Steps

1. **Review current dashboard structure**
2. **Migrate v0.3 components from prototype**
3. **Update Supabase schema**
4. **Build new API routes**
5. **Connect Work Agent**
6. **Deploy to Vercel**
7. **Test with Mat**

---

## Questions for Mat

1. **Supabase credentials:** Are they already in Vercel env vars?
2. **HubSpot Hub ID:** What's your Hub ID for constructing deal/contact URLs?
3. **Avoma API:** Still waiting for new key? Proceed with HubSpot activity data?
4. **Dashboard password:** Should I keep it or remove it?

