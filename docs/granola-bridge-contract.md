# Meeting Insights Hub — Dashboard API Contract

**Date:** 2026-05-03  
**Consumers:** `clawd-dashboard` Phase 2 `/meetings` UI  
**Providers:** Clawd Phase 1 analyzer + Granola bridge + Supabase

This contract is the handoff surface CC requested before dashboard implementation. Exact route placement can live in Next route handlers, but response shapes should stay stable.

## Status values

`meeting_reviews.status` values:

- `pending_transcript` — Granola meeting exists, transcript is not ready yet; retry loop is active or waiting.
- `analyzing` — analyzer is currently processing frames/OCR/embeddings.
- `complete` — review is ready to render.
- `failed` — review failed; use `failure_code` + `failure_reason` for UI.

`failure_code` values:

- `granola_timeout`
- `ocr_failed`
- `embedding_failed`
- `notion_failed`
- `unknown`

## Attendees shape

`meeting_reviews.attendees` is always JSON array:

```ts
type MeetingAttendee = {
  name: string
  email?: string
  granola_user_id?: string
}
```

## Endpoints

### `GET /api/meetings/list?since=ISO&limit=N`

Returns recent Granola meetings enriched with review/frame counts.

```ts
type MeetingListResponse = {
  meetings: Array<{
    granola_meeting_id: string
    title: string
    started_at: string
    ended_at: string | null
    attendee_count: number
    frame_count: number
    unspoken_count: number
    status: 'pending_transcript' | 'analyzing' | 'complete' | 'failed' | null
    failure_code?: string | null
  }>
}
```

Notes:
- Sort `started_at desc`.
- Meetings without reviews yet may return `status: null`, `frame_count: 0`, `unspoken_count: 0`.

### `GET /api/meetings/:granola_meeting_id`

Returns the full detail payload for the meeting page.

```ts
type MeetingDetailResponse = {
  review: {
    id: string
    granola_meeting_id: string
    status: 'pending_transcript' | 'analyzing' | 'complete' | 'failed'
    failure_code?: 'granola_timeout' | 'ocr_failed' | 'embedding_failed' | 'notion_failed' | 'unknown' | null
    failure_reason?: string | null
    generated_at: string
    summary_md: string
    attendees: MeetingAttendee[]
    unspoken_visuals: Array<{
      frame_id: string
      frame_ts: string
      reason: string
      slide_text?: string | null
      ai_caption?: string | null
      max_chunk_cosine?: number | null
      deictic_fallback_used?: boolean
    }>
    frame_count: number
    notion_page_id?: string | null
    meeting_started_at?: string | null
    meeting_ended_at?: string | null
  }
  visuals: Array<{
    id: string
    frame_ts: string
    image_url: string
    signed_url: string
    signed_url_expires_at: string
    image_hash: string
    device_id: string
    device_label: string
    slide_text?: string | null
    ai_caption?: string | null
    ocr_lang: string
  }>
  transcript_chunks: Array<{
    id: string
    chunk_index: number
    chunk_start_ts: string
    chunk_end_ts: string
    chunk_text: string
  }>
}
```

Ordering:
- `visuals` ordered by `frame_ts asc`.
- `transcript_chunks` ordered by `chunk_index asc`.

### `POST /api/meetings/:granola_meeting_id/reanalyze`

Fires analyzer with `trigger_source='dashboard'` and returns immediately.

```ts
type ReanalyzeResponse = {
  status: 'analyzing'
}
```

Behavior:
- Set `meeting_reviews.status = 'analyzing'` before work starts.
- Dashboard subscribes to Supabase Realtime filtered by `granola_meeting_id`.
- Re-analyze is idempotent: overwrite review fields, preserve existing `notion_page_id`.

### `POST /api/meetings/:granola_meeting_id/push-to-notion`

Creates or updates the Notion review page.

```ts
type PushToNotionResponse = {
  notion_page_id: string
  notion_url: string
}
```

Behavior:
- If `meeting_reviews.notion_page_id` is null, create a page and store it.
- If non-null, update the existing page; do **not** create duplicates.

### `GET /api/devices`

Returns capture device rows for `/meetings/devices`.

```ts
type DevicesResponse = {
  devices: Array<{
    device_id: string
    device_label: string
    last_seen: string
    last_capture_ts?: string | null
    registered_at: string
    stale: boolean // computed as last_seen > 24h
  }>
}
```

Dashboard behavior:
- Poll every 5 minutes on `/meetings/devices` so stale warnings appear without reload.
- Other pages can check at mount only.

### `POST /api/devices/:device_id/rotate-key`

Phase 1 can return a stub if rotation is deferred.

Implemented response:

```ts
type RotateKeyResponse = {
  device_id: string
  anon_key: string
  setup_command: string
}
```

Deferred response:

```ts
type RotateKeyDeferredResponse = {
  error: 'not_implemented'
  message: string
}
```

Use HTTP `501` for deferred stub.

## Realtime subscription

Dashboard should filter updates by `granola_meeting_id`, not subscribe broadly:

```ts
supabase
  .channel(`meeting-review:${granolaMeetingId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'meeting_reviews',
    filter: `granola_meeting_id=eq.${granolaMeetingId}`,
  }, handler)
  .subscribe()
```

## Threshold tuning events

Analyzer logs each frame decision to `agent_event` with fields equivalent to:

```json
{
  "event_type": "meeting_review.frame_decision",
  "granola_meeting_id": "...",
  "frame_id": "...",
  "max_chunk_cosine": 0.41,
  "decision": "discussed|unspoken|deictic_fallback|null_ocr_unresolved",
  "embedding_model": "openrouter/text-embedding-3-large"
}
```

Threshold must be config/env-driven until 3-5 real meetings provide enough distribution data.
