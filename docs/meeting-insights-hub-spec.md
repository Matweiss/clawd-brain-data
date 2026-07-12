# Meeting Insights Hub — Spec v2

**Authors:** Clawd (VPS) + Mat. To be reviewed by Claude Code.
**Date:** 2026-05-03
**Status:** Locked for Phase 1 build after CC review. Incorporates OCR pivot, CC schema/API asks, and Phase 2 handoff requirements. Builds on `docs/meeting-visuals-spec.md` as a sub-component.

---

## Goal

A single place to view past meetings with cross-referenced transcript + visuals, surfacing slides/visual content that **wasn't spoken about**. Leverages Granola (transcripts), Supabase (visuals + insights), OCR/text embeddings, and Notion writeback. **Zero video storage** — only deduped JPEG frames.

The killer feature: when someone shares a deck and breezes past three slides without commentary, those slides still surface in the meeting review.

---

## Architecture pivot: OCR first, AI captions lazy

Replacing per-frame Sonnet captioning + caption embeddings with **Tesseract OCR on VPS + OCR text embeddings**.

Why:
- OCR text is more discriminating for unspoken detection because it matches transcript language verbatim better than semantic image captions.
- Cost drops from roughly ~$7/mo to ~$0.30/mo at Mat's expected volume.
- Sonnet remains in the stack only as a **lazy/optional caption** when pushing to Notion or enriching a specific frame, not for the default ingest/analyze pass.

Schema terminology changes:
- `caption` → `slide_text`
- `caption_embedding` → `slide_text_embedding`
- optional `ai_caption` stays nullable for lazy enrichment
- `embedding_model` remains unchanged as a hedge
- vector dim remains **3072** using OpenRouter `text-embedding-3-large`

Privacy note: OCR text leaves the VPS to OpenRouter for embeddings. If that becomes a concern, swap to local embeddings (BGE via Ollama/Groq-compatible path) behind the same `embedding_model` column and vector dimensions.

---

## V1 scope (locked)

| Dimension | Locked decision |
|---|---|
| Meeting platform | **Google Meet only** |
| Browser | **Comet** (Chromium-based, Perplexity's). Window title pattern: `Meet - <name>` |
| Operator devices | **Two Macs**: 24/7 always-on Mac + work laptop (intermittent, may roam between WiFis, no VPN, no auto-update) |
| Device sleep | Tolerated. launchd resumes capture cycle on wake — no special handling |
| Frame cadence | 60 seconds, deduped via perceptual hash |
| Frame format | JPEG, ~50% quality, max 1280px wide (~100–300 KB / unique frame) |
| OCR | Tesseract on VPS; preprocess with 2x upscale + adaptive binarization; default language `eng` |
| Embeddings | OpenRouter `text-embedding-3-large`, 3072-dim, one row per unique slide_text and transcript chunk; threshold lives in config/env, not hard-coded |
| Storage | **Supabase Storage** bucket `meeting-visuals`, private, signed-URL access, 90-day TTL |
| Per-device auth | **Per-device Supabase anon keys with row-level INSERT-only policy** |
| Transcript source | Granola via `granola-bridge` |
| Source of truth for meeting metadata | Granola — `started_at`, `ended_at`, attendees, AI summary |
| Cross-device dedup | Free via phash — same slide from both devices collapses |
| Observability | Reuse existing `agent_event` table for analyzer success/failure logs |
| Notion role | Writeback target for polished summaries (optional, on-demand) |
| View surface | New `/meetings` route in `clawd-dashboard`, reuses PageShell + Cloudflare Access auth |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ A. CAPTURE  — Mac-side, both devices independently      │
│   launchd 60s tick → update capture_devices.last_seen   │
│   → if frontmost == Comet AND title matches /^Meet - /  │
│   → screencapture → JPEG resize → phash                 │
│   → if phash unseen this meeting window:                │
│       → POST to Supabase Storage                        │
│       → INSERT meeting_visuals row                      │
│   → if Supabase unreachable: queue locally, drain next  │
│     interval (cap 500 frames / ~150 MB)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ B. ANALYZE  — VPS, on-demand v1                         │
│   Input: granola_meeting_id (or "latest")               │
│   1. granola-bridge → transcript + summary + ts range   │
│   2. Supabase: frames where frame_ts BETWEEN start/end  │
│   3. OCR each unique frame after preprocessing           │
│   4. Empty OCR (<5 chars / whitespace): slide_text=NULL │
│   5. Chunk transcript into 60s windows, 30s stride       │
│   6. Embed non-null slide_text + transcript chunks       │
│   7. Cosine match nearby chunks; flag unspoken only when│
│      slide text is present and no nearby semantic match  │
│   8. For NULL slide_text, use deictic-language fallback │
│      before deciding; avoid automatic false positives    │
│   9. Status lifecycle: pending/analyzing/complete/failed│
│ 10. Upsert meeting_reviews + log agent_event           │
│ 11. Optional: post Notion page / Telegram summary      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ C. VIEW  — clawd-dashboard /meetings                    │
│   List: Granola meetings, frame counts, unspoken-N      │
│   Detail: transcript + frame timeline + lightbox        │
│   Devices: last_seen, last_capture_ts, stale warnings   │
│   Buttons: Re-analyze, Push to Notion                   │
└─────────────────────────────────────────────────────────┘
```

---

## Schema (migration `0005_meetings.sql`)

```sql
create table public.meeting_visuals (
  id uuid primary key default gen_random_uuid(),
  frame_ts timestamptz not null default now(),
  image_url text not null,
  image_hash text not null,
  app_name text not null,
  window_title text,
  device_id text not null,
  device_label text not null,
  slide_text text,
  slide_text_embedding vector(3072),
  embedding_model text,
  ai_caption text,
  ocr_lang text not null default 'eng',
  captured_at_local_offset int,
  created_at timestamptz not null default now()
);
create index meeting_visuals_ts_idx on public.meeting_visuals (frame_ts desc);
create index meeting_visuals_device_idx on public.meeting_visuals (device_id);
create index meeting_visuals_hash_idx on public.meeting_visuals (image_hash);
create index meeting_visuals_slide_text_hnsw_idx
  on public.meeting_visuals using hnsw (slide_text_embedding vector_cosine_ops)
  where slide_text_embedding is not null;

create table public.meeting_transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  granola_meeting_id text not null,
  chunk_index int not null,
  chunk_start_ts timestamptz not null,
  chunk_end_ts timestamptz not null,
  chunk_text text not null,
  chunk_embedding vector(3072),
  embedding_model text,
  created_at timestamptz not null default now(),
  unique (granola_meeting_id, chunk_index)
);
create index meeting_transcript_chunks_meeting_idx on public.meeting_transcript_chunks (granola_meeting_id, chunk_index, chunk_start_ts);
create index meeting_transcript_chunks_embedding_hnsw_idx
  on public.meeting_transcript_chunks using hnsw (chunk_embedding vector_cosine_ops)
  where chunk_embedding is not null;

create table public.meeting_reviews (
  id uuid primary key default gen_random_uuid(),
  granola_meeting_id text not null,
  status text not null default 'complete',
  failure_code text,
  failure_reason text,
  generated_at timestamptz not null default now(),
  summary_md text not null,
  attendees jsonb not null default '[]'::jsonb,
  unspoken_visuals jsonb not null default '[]'::jsonb,
  frame_count int not null default 0,
  notion_page_id text,
  meeting_started_at timestamptz,
  meeting_ended_at timestamptz,
  constraint meeting_reviews_status_check
    check (status in ('pending_transcript', 'analyzing', 'complete', 'failed')),
  constraint meeting_reviews_failure_code_check
    check (failure_code is null or failure_code in ('granola_timeout', 'ocr_failed', 'embedding_failed', 'notion_failed', 'unknown'))
);
create unique index meeting_reviews_meeting_idx on public.meeting_reviews (granola_meeting_id);

create table public.capture_devices (
  device_id text primary key,
  device_label text not null,
  last_seen timestamptz not null default now(),
  last_capture_ts timestamptz,
  registered_at timestamptz not null default now()
);

alter table public.meeting_visuals enable row level security;
create policy "device-insert" on public.meeting_visuals
  for insert to anon with check (device_id is not null);

alter table public.capture_devices enable row level security;
create policy "device-self-update" on public.capture_devices
  for update to anon using (device_id = current_setting('request.jwt.claims', true)::json->>'device_id');

-- Storage bucket: `meeting-visuals`, private, signed URL TTL 90 days.
-- Analyzer success/failure events are logged to existing `agent_event` table.
```

---

## Components to build

### 1. Supabase migration `0005_meetings.sql` (~30 min)
Tables + indexes + RLS policies + storage bucket + reuse existing `agent_event` observability table. Include HNSW indexes on both embedding columns, `meeting_transcript_chunks.chunk_index`, status lifecycle (`pending_transcript`, `analyzing`, `complete`, `failed`), and `failure_code`.

### 2. Mac capture agent (~3-4 hr)
- `~/bin/clawd-meeting-visuals.py`
  - AppleScript to query frontmost app + window title
  - macOS `screencapture -x -o -t jpg`
  - Pillow for JPEG resize + perceptual hash (`imagehash`)
  - urllib for Supabase REST upload + INSERT
  - **Every interval updates `capture_devices.last_seen`, even when no frame is uploaded**
  - Local queue at `~/.cache/clawd-meeting-visuals/queue/`
  - Logs to `~/.local/state/clawd-meeting-visuals/runs.log`
- `~/Library/LaunchAgents/com.thematweiss.clawd-meeting-visuals.plist`
  - `StartInterval: 60`, `RunAtLoad: false`
  - Stdout/Stderr to rolling log
- First-run setup `clawd-meeting-visuals --setup`
  - Generates `device_id`, prompts for `device_label`
  - Stores per-device anon Supabase key in `~/.config/clawd-meeting-visuals/device.json` (chmod 600)
  - Registers in `capture_devices`
  - Smoke-tests one frame + Supabase round-trip

### 3. Analyzer (VPS) `scripts/clawd-meeting-review.py` (~2-3 hr)
- CLI: `clawd-meeting-review --granola-id <id>` or `--latest`
- Steps:
  1. `granola-bridge` → transcript JSON, started_at, ended_at, attendees, summary
  2. Supabase select: frames where `frame_ts BETWEEN started_at AND ended_at`
  3. For each unique `image_hash`: signed-URL fetch JPEG
  4. OCR preprocessing: 2x upscale + adaptive binarization, then Tesseract (`eng` default; multilingual later)
  5. Empty OCR handling: if Tesseract returns `<5` chars or pure whitespace, set `slide_text = NULL` and skip slide embedding
  6. Transcript chunking: 60-second sliding windows with 30-second stride; each chunk gets one `meeting_transcript_chunks` embedding row with deterministic `chunk_index`
  7. For non-null `slide_text`: embed with OpenRouter `text-embedding-3-large`; compare against transcript chunks intersecting frame ±60s
  8. For null `slide_text`: do **not** auto-flag unspoken. Apply deictic-language fallback in nearby transcript chunks (`as you can see`, `this chart`, `this slide`, `on screen`, etc.) before deciding
  9. Cosine threshold is read from config/env (initially unset/tunable); log every `(frame_id, max_chunk_cosine, decision)` pair to `agent_event` for threshold tuning after 3-5 meetings
  10. Compose `summary_md` = Granola summary + visuals captured + unspoken visuals + operational notes
  11. Upsert `meeting_reviews` (preserve `notion_page_id` on re-analyze) and log analyzer success/failure to `agent_event`
  12. Optional flags: `--notion`, `--telegram`

### 4. Dashboard `/meetings` (CC owner, ~4-6 hr)
- List page between Contacts and Deals in existing nav.
- Detail page with transcript left, visual timeline right.
- Frame thumbnails use signed URLs, refresh on visibility-change if expired.
- Lightbox keyboard nav: arrow keys move between frames, ESC closes.
- Device chips on frames; stale-device warning chip when `capture_devices.last_seen > 24h`.
- Action buttons: Re-analyze, Push to Notion, Open in Granola.
- Settings page lists capture devices, last_seen, last_capture_ts, rotate-key flow.

### 5. Triggers
- **v1 manual:** Telegram `review my last meeting` → Clawd runs analyzer → Telegram summary + dashboard link
- **v1 manual:** Dashboard Re-analyze button → calls analyzer route/job
- **Phase 3 auto:** Granola-end polling waits 5 minutes for transcript to settle, then retries transcript readiness up to **6 times at 5-minute intervals**. If still not ready, set `meeting_reviews.status = 'failed'`, log `failure_reason`, and write `agent_event`.

### 6. Notion writeback (~1-2 hr)
- One Notion DB: "Meeting Reviews"
- Schema: meeting_name, started_at, attendees, action_items, unspoken_visuals_count, dashboard_link, granola_link
- Body: Granola summary + visuals captured + top frames + unspoken visuals + action items checklist
- Push is idempotent: if `notion_page_id` exists, update that page instead of creating a duplicate.
- Lazy/optional Sonnet AI captioning can enrich frames here, not during default ingest/analyze.

---

## What we're explicitly NOT doing in v1

- ❌ No video file storage — frames only
- ❌ No live in-meeting analysis — post-meeting only
- ❌ No per-frame Sonnet captions during ingest — OCR first; AI captions lazy/optional
- ❌ No dashboard-load OCR or embeddings — cached in DB
- ❌ No new auth — reuses Cloudflare Access
- ❌ No replacing Granola — wraps around it
- ❌ No support for non-Comet browsers
- ❌ No support for non-Meet platforms
- ❌ No pinned frames bypassing 90d TTL — defer v1.5
- ❌ No local embeddings option by default — defer unless privacy/cost demands it

---

## Honest tradeoffs / risks

- **OCR can be empty or noisy.** Empty OCR is treated specially to avoid false positives; noisy OCR gets better with 2x upscale + adaptive binarization.
- **Unspoken detection is still heuristic.** OCR/text cosine is better than caption keyword overlap, but still not perfect. Deictic-language fallback reduces false positives for image-only slides.
- **Comet-only is fragile.** Out-of-Comet meetings still get Granola transcript but no visuals.
- **Per-device anon keys add ops cost.** Fine at 2 devices; consider a broker at 5+.
- **Device heartbeat is required.** Without last_seen updates, a dead laptop could silently miss meetings for weeks.
- **Notion writeback is one-way.** Manual Notion edits are not sync'd back.
- **Privacy:** OCR text is sent to OpenRouter for embeddings. Local BGE is the drop-in alternative if needed.

---

## CC review decisions incorporated

1. **OCR-first approved.** Keep AI captions lazy/optional for image-heavy or `slide_text IS NULL` frames; do not build in Phase 1, but keep nullable `ai_caption` and leave room for future `/api/frames/:id/enrich`.
2. **Do not hard-code cosine threshold.** `text-embedding-3-large` distributions differ from prior `3-small`; threshold should live in config/env or a `meeting_review_config` row. Analyzer logs `(frame_id, max_chunk_cosine, decision)` to `agent_event`; tune after 3-5 real meetings.
3. **Schema asks accepted.** Add HNSW indexes, `chunk_index`, statuses `pending_transcript/analyzing/complete/failed`, `failure_code`, and standardized attendees shape.
4. **Attendees shape locked:** `[{name: string, email?: string, granola_user_id?: string}]`.
5. **Dashboard UX decisions:** responsive tabs below ~900px; unspoken visuals are hero content, not sidebar decoration; realtime filters by `granola_meeting_id`; stale-device polling every 5 min on devices page; expired images read “Image archived after 90 days — caption preserved.”
6. **Notion idempotency confirmed.** `Push to Notion` creates once, then updates existing `notion_page_id`.

---

## Build phases

| Phase | Scope | Estimated time | Owner | Why |
|---|---|---:|---|---|
| **1a** | Migration + Mac capture agent on 24/7 Mac | 4-5 hr | Clawd | Mac-side work via mac-node-ops; CC cannot reach the Mac |
| **1b** | Python analyzer + Telegram trigger | 2-3 hr | Clawd | VPS Python + granola-bridge + Supabase/OpenRouter path |
| **1c** | Work laptop install | ~5-30 min | Mat interactive | One-time setup wizard on the laptop |
| **2** | Dashboard `/meetings` UI | 4-6 hr | CC | TypeScript/Next/Tailwind in dashboard; CC owns the visual language |
| **3** | Notion writeback + Granola-end auto-trigger | 2-3 hr | Clawd | Backend orchestration + cron/polling |

Recommended split: Clawd owns Phases 1a/1b/3, Mat runs the work-laptop setup, CC owns Phase 2. A one-agent build is possible only if Clawd does everything, because CC cannot reach the Mac.

---

## Deferred to v1.5

- Pinned frames bypass 90-day TTL
- Local embeddings option (BGE) if privacy becomes a concern
- Multilingual OCR beyond `eng`
- Stronger LLM-based “is this transcript discussing this slide?” verifier for borderline cases
- Lazy Haiku/Sonnet image caption enrichment for `slide_text IS NULL` frames, triggered only by Re-analyze or opening a specific frame in lightbox; future endpoint: `/api/frames/:id/enrich`
- CRM contact drawer cross-link: “meetings with this person” using `meeting_reviews.attendees`

---

## Operational checks during build

1. Verify `screencapture` behavior when the Mac is locked. Expected: likely captures lock screen; acceptable because the Mac should be unlocked during calls.
2. Verify Comet fullscreen preserves window title `Meet - <name>`. If not, relax the title check or add a fullscreen detector.
3. Verify Tesseract accuracy on real Meet slides after 2x upscale + adaptive binarization.
4. Verify `capture_devices.last_seen` updates even during static-slide dedupe periods.
5. Verify Granola transcript-not-ready retry path and failed-review logging.

---

## Validation plan

After Phase 1a-1c:
1. Mat starts a Google Meet in Comet on the 24/7 Mac. Capture agent heartbeats every 60s.
2. After 5 min, query recent `capture_devices.last_seen` and `meeting_visuals` rows.
3. Join same Meet from work laptop. Same slide visible on both → phash dedup prevents duplicate analysis; device chips still show contributing devices where applicable.
4. Meeting ends. Analyzer waits for Granola; retries readiness up to 6 × 5 min if transcript is delayed.
5. Mat sends Telegram `review my last meeting` → Clawd runs analyzer → Telegram returns summary with unspoken count + dashboard link.
6. Open dashboard `/meetings` → meeting visible. Detail page renders transcript + visual timeline. Lightbox arrows/ESC work. Stale-device warning appears only when `last_seen > 24h`.
7. Confirm `agent_event` has analyzer success/failure entries.

After Phase 2: test transcript→frame jump, frame→lightbox, multi-device pills, signed URL refresh, and push/re-analyze buttons.

After Phase 3: trigger auto analyze and Push to Notion → Notion DB has a page with summary, attendees, linked frames, and dashboard backlink.

---

## Deliverables before Phase 2 starts

Clawd will hand CC:
- Supabase migration applied or ready to apply
- Sample `meeting_reviews` row with `attendees`, `unspoken_visuals`, `frame_count`, status fields
- Sample `meeting_visuals` rows with real signed URLs and OCR slide_text
- `docs/granola-bridge-contract.md` with dashboard API contracts
- `docs/storage-signed-urls.md` with server-side signed URL helper contract
- `shared/db.ts` generated via `supabase gen types typescript --project-id <id> > shared/db.ts` after migration
- API/runbook for Re-analyze and Push to Notion hooks
- Device heartbeat data for `/meetings/devices`
- Sample data covering edge cases: 2 unspoken frames (one OCR text, one `slide_text=NULL` + deictic fallback), attendees populated, and multi-device phash dedup case
- Known limitations + threshold tuning notes from first smoke test

---

## Resume signal

When Mat says *"build the meeting insights hub"* or shares this doc with CC for review, this is the brief. Lock the open questions, then ship phases in order.

— Clawd
