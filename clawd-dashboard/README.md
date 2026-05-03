# clawd-dashboard

Mission Control for Mat's multi-agent system. **Phase 1** of the plan in
`Multi-Agent Work Dashboard — Plan v2 (CONVERGED)`.

Read-only views over the `clawd-state` Supabase project:

- **Mission Control** (`/`) — open tasks, pending approvals, recent events
  with live Realtime updates
- **Contacts** (`/contacts`) — HubSpot contacts mirrored into `crm_objects`
- **Deals** (`/deals`) — HubSpot deals mirrored into `crm_objects`,
  default pipeline only

The dashboard never writes — it observes state that Clawd and Claude Code
put into Supabase. The HubSpot mirror is populated by a one-shot CLI
script (`npm run sync:hubspot`); write-back to HubSpot is Phase 2.

---

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS (custom palette — no shadcn)
- `@supabase/supabase-js` v2 with Realtime
- Auth: **Cloudflare Access** at the edge (already configured for Mat).
  RLS allows `anon SELECT` only on the four read tables.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

`.env.local` should already contain the publishable key — never the
service role.

## Production build

```bash
npm run build && npm start
```

## Deploying to Vercel

The repo is a stock Next.js project; Vercel will detect it automatically.

1. Push this directory to a new GitHub repo (suggested name: `clawd-dashboard`).
2. In Vercel: **Add New… → Project → Import Git Repository**, pick the repo,
   name the project `clawd-dashboard`. Framework auto-detects as Next.js.
3. Add the two environment variables (Production + Preview):

   - `NEXT_PUBLIC_SUPABASE_URL` = `https://tntoclpqyisfttpchajh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_W2mb9CIkmd78hjD7tw_29w_Vh53jX4o`

4. **Settings → Domains** → add `dashboard.thematweiss.com`.
   Vercel will display a CNAME target (`cname.vercel-dns.com` for
   subdomains as of the current Vercel docs).
5. In Cloudflare DNS for `thematweiss.com`, add:

   ```
   Type:    CNAME
   Name:    dashboard
   Target:  cname.vercel-dns.com
   Proxy:   Proxied (orange cloud — required so Cloudflare Access enforces
            the auth policy at the edge before the request reaches Vercel.
            Gray-cloud bypasses Access entirely. This is the inverse of
            most Vercel docs, which assume no Zero Trust layer in front.)
   ```

6. Wait for Vercel to issue the cert (usually < 60s after CNAME propagates).
7. Confirm Cloudflare Access policy still gates `dashboard.thematweiss.com`
   to `thematweiss@gmail.com` and `mat.weiss@lucrasports.com`.

## Project layout

```
app/
  layout.tsx           — root layout, font imports, metadata
  page.tsx             — Mission Control (tasks/approvals/events)
  globals.css          — Tailwind base + grain background + scrollbar
  contacts/page.tsx    — Contacts view (Phase 1)
  deals/page.tsx       — Deals view (Phase 1)
  components/
    tasks-section.tsx       — open tasks, realtime, arrive-animated
    approvals-section.tsx   — pending approvals, realtime
    events-section.tsx      — recent events stream, realtime
    crm-table.tsx           — generic sortable table for crm_objects
    ui/
      section-header.tsx    — display-serif title + meta
      status-pill.tsx       — outlined mono pill, status-aware
      realtime-indicator.tsx — connection state dot
      nav.tsx               — top nav (Mission Control / Contacts / Deals)
      page-shell.tsx        — shared chrome for non-home pages
lib/
  supabase.ts          — browser client (publishable key)
  types.ts             — Task / Approval / AgentEvent / CrmObject shapes
  utils.ts             — cn, timeAgo, truncate, shortId
scripts/
  sync-hubspot.ts      — one-shot HubSpot → Supabase mirror CLI
  tsconfig.json        — Node-flavored tsconfig (separate from Next.js)
  lib/
    env.ts             — strict env loader for the CLI
    hubspot.ts         — minimal HubSpot v3 REST client
    supabase-admin.ts  — service-role Supabase client
    enrich.ts          — label maps for stage/pipeline/owner enrichment
```

## HubSpot sync (Phase 1)

The dashboard reads from `public.crm_objects`. That table is populated
by a one-shot CLI script that pulls from HubSpot. It's manual on purpose
in Phase 1 — the scheduled drain belongs to Phase 4.

### Configuration

Add to `.env.local`:

```bash
HUBSPOT_TOKEN=<HubSpot Private App token>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → API settings>
```

The Vercel project already has `HUBSPOT_TOKEN` set from the legacy
`clawd-command-center` deployment — verify the token still works and is
scoped to read `crm.objects.contacts.read` + `crm.objects.deals.read`
before reusing.

### Running

```bash
# All contacts
npm run sync:hubspot -- --object-type contact

# Default-pipeline deals
npm run sync:hubspot -- --object-type deal

# Override pipeline (e.g., ARR/TCV Annual)
npm run sync:hubspot -- --object-type deal --pipeline 876438867

# Test runs
npm run sync:hubspot -- --object-type contact --limit 50
npm run sync:hubspot -- --object-type deal --dry-run
```

### What the script does

1. Loads the `dealstage`, `pipeline`, and `lifecyclestage` enum options
   plus the full owner list — once per run.
2. Streams `POST /crm/v3/objects/{type}/search` page-by-page (100 rows
   per page, sorted by mod-date desc).
3. For deals: filters `pipeline EQ <pipeline-id>` (defaults to
   `794686386` — Sales Deals Pipeline).
4. Enriches each record with derived `_label` / `_name` fields:
   - Contacts: `lifecyclestage_label`, `hubspot_owner_name`
   - Deals: `dealstage_label`, `pipeline_label`, `hubspot_owner_name`
5. Upserts in batches of 50 into `crm_objects` with
   `onConflict: 'hs_object_type,hs_object_id'`. `synced_by` set to
   `'claude_code'`.
6. Maps `lastmodifieddate` (contacts) / `hs_lastmodifieddate` (deals)
   into the `hs_updated_at` column for conflict reconciliation in Phase 2.

### What the script does NOT do

- Touch `hs_pending_writes` (that's Phase 2).
- Run on a schedule (that's Phase 4).
- Bulk-export beyond HubSpot's 10k search-result cap. Mat's account is
  comfortably under (~7k contacts, ~600 deals). If you exceed that,
  chunk by `lastmodifieddate` ranges.
- Sync archived records.

## Aesthetic notes

- **Direction:** refined editorial dark — operator's HUD. Restraint and
  precision over density and chrome.
- **Type:** Instrument Serif (display) + Geist (body) + JetBrains Mono
  (IDs/timestamps/labels).
- **Color:** ink-black backgrounds, warm bone-white text, single ember
  accent reserved for live/active state. Status palette is intentionally
  narrow (open/progress/blocked/done).
- **Realtime moments:** new rows fade up with a brief ember glow
  (`animate-row-arrive`). The "live" connection dot pulses softly when
  subscribed.

## When you'd change something

- **Add a section:** copy `events-section.tsx` as a template; subscribe
  to the relevant table in `useEffect`, push into local state on change.
- **Add a write affordance (Phase 2):** that means RLS policies for
  `authenticated` role + Supabase Auth in front of Cloudflare Access.
  Out of scope here.
- **Tune realtime channels:** the per-section channel naming
  (`realtime:tasks`, `realtime:approvals`, `realtime:agent_events`) keeps
  them cleanly demuxed in Supabase logs.

## What's intentionally not here (Phase 2+)

- HubSpot write-back via `hs_pending_writes` drain
- Edit affordances of any kind in the UI
- Scheduled sync (manual trigger only — Phase 4)
- Webhook-driven HubSpot → Supabase updates (Phase 4)
- Server-sent events, polling fallback, or stale-while-revalidate logic
- Filters, search, pagination beyond the hard-coded `limit`s on each view
