-- 0005_meeting_insights.sql
-- Meeting Insights Hub Phase 1: visual capture + transcript review backend.
--
-- Scope:
--   capture_devices              — Mac capture agent heartbeats + metadata
--   meeting_visuals              — deduped JPEG frame metadata + OCR embeddings
--   meeting_transcript_chunks    — embedded transcript windows
--   meeting_reviews              — analyzer output for dashboard + Notion writeback
--   storage bucket meeting-visuals (private)
--
-- Trust model:
--   - Dashboard anon role can SELECT only.
--   - Mac capture devices may INSERT visuals and upsert/update their own device row.
--   - Analyzer/VPS uses service_role for OCR, embeddings, reviews, and agent_events.

create extension if not exists "pgcrypto";
create extension if not exists vector;

-- =====================================================================
-- capture_devices
-- =====================================================================
create table if not exists public.capture_devices (
    device_id        text primary key,
    device_label     text not null,
    last_seen        timestamptz not null default now(),
    last_capture_ts  timestamptz,
    registered_at    timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create index if not exists capture_devices_last_seen_idx
    on public.capture_devices (last_seen desc);

alter table public.capture_devices enable row level security;

drop trigger if exists capture_devices_touch_updated on public.capture_devices;
create trigger capture_devices_touch_updated
    before update on public.capture_devices
    for each row execute function public.touch_updated_at();

-- =====================================================================
-- meeting_visuals
-- =====================================================================
create table if not exists public.meeting_visuals (
    id                         uuid primary key default gen_random_uuid(),
    granola_meeting_id          text,
    frame_ts                   timestamptz not null default now(),
    image_url                  text not null,
    image_hash                 text not null,
    phash                      text,
    app_name                   text not null,
    window_title               text,
    device_id                  text not null references public.capture_devices(device_id) on delete restrict,
    device_label               text not null,
    slide_text                 text,
    slide_text_embedding       vector(3072),
    embedding_model            text,
    ai_caption                 text,
    ocr_lang                   text not null default 'eng',
    captured_at_local_offset   integer,
    created_at                 timestamptz not null default now(),
    updated_at                 timestamptz not null default now()
);

create index if not exists meeting_visuals_ts_idx
    on public.meeting_visuals (frame_ts desc);
create index if not exists meeting_visuals_meeting_ts_idx
    on public.meeting_visuals (granola_meeting_id, frame_ts);
create index if not exists meeting_visuals_device_idx
    on public.meeting_visuals (device_id);
create index if not exists meeting_visuals_hash_idx
    on public.meeting_visuals (image_hash);
create index if not exists meeting_visuals_phash_idx
    on public.meeting_visuals (phash) where phash is not null;
create unique index if not exists meeting_visuals_device_hash_meeting_uidx
    on public.meeting_visuals (device_id, image_hash, coalesce(granola_meeting_id, ''));
-- HNSW on vector(3072) is blocked by pgvector's 2000-dim cap. Analyzer reads
-- embeddings into Python for cosine, so an index isn't required at v1 scale
-- (<5k rows). When row count justifies, add:
--   create index ... using hnsw ((slide_text_embedding::halfvec(3072)) halfvec_cosine_ops)
-- and update analyzer queries to cast the column to halfvec.
create index if not exists meeting_visuals_has_embedding_idx
    on public.meeting_visuals (id)
    where slide_text_embedding is not null;

alter table public.meeting_visuals enable row level security;

drop trigger if exists meeting_visuals_touch_updated on public.meeting_visuals;
create trigger meeting_visuals_touch_updated
    before update on public.meeting_visuals
    for each row execute function public.touch_updated_at();

-- =====================================================================
-- meeting_transcript_chunks
-- =====================================================================
create table if not exists public.meeting_transcript_chunks (
    id                  uuid primary key default gen_random_uuid(),
    granola_meeting_id  text not null,
    chunk_index         integer not null,
    chunk_start_ts      timestamptz not null,
    chunk_end_ts        timestamptz not null,
    chunk_text          text not null,
    chunk_embedding     vector(3072),
    embedding_model     text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (granola_meeting_id, chunk_index)
);

create index if not exists meeting_transcript_chunks_meeting_idx
    on public.meeting_transcript_chunks (granola_meeting_id, chunk_index, chunk_start_ts);
-- See meeting_visuals_has_embedding_idx note above re: HNSW + vector(3072).
create index if not exists meeting_transcript_chunks_has_embedding_idx
    on public.meeting_transcript_chunks (id)
    where chunk_embedding is not null;

alter table public.meeting_transcript_chunks enable row level security;

drop trigger if exists meeting_transcript_chunks_touch_updated on public.meeting_transcript_chunks;
create trigger meeting_transcript_chunks_touch_updated
    before update on public.meeting_transcript_chunks
    for each row execute function public.touch_updated_at();

-- =====================================================================
-- meeting_reviews
-- =====================================================================
create table if not exists public.meeting_reviews (
    id                    uuid primary key default gen_random_uuid(),
    granola_meeting_id    text not null,
    status                text not null default 'complete',
    failure_code          text,
    failure_reason        text,
    generated_at          timestamptz not null default now(),
    summary_md            text not null default '',
    attendees             jsonb not null default '[]'::jsonb,
    unspoken_visuals      jsonb not null default '[]'::jsonb,
    frame_count           integer not null default 0,
    notion_page_id        text,
    meeting_started_at    timestamptz,
    meeting_ended_at      timestamptz,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    constraint meeting_reviews_status_check
        check (status in ('pending_transcript', 'analyzing', 'complete', 'failed')),
    constraint meeting_reviews_failure_code_check
        check (failure_code is null or failure_code in ('granola_timeout', 'ocr_failed', 'embedding_failed', 'notion_failed', 'unknown')),
    constraint meeting_reviews_attendees_array_check
        check (jsonb_typeof(attendees) = 'array'),
    constraint meeting_reviews_unspoken_array_check
        check (jsonb_typeof(unspoken_visuals) = 'array')
);

create unique index if not exists meeting_reviews_meeting_idx
    on public.meeting_reviews (granola_meeting_id);
create index if not exists meeting_reviews_status_idx
    on public.meeting_reviews (status);
create index if not exists meeting_reviews_generated_idx
    on public.meeting_reviews (generated_at desc);

alter table public.meeting_reviews enable row level security;

drop trigger if exists meeting_reviews_touch_updated on public.meeting_reviews;
create trigger meeting_reviews_touch_updated
    before update on public.meeting_reviews
    for each row execute function public.touch_updated_at();

-- =====================================================================
-- RLS policies
-- =====================================================================
-- Dashboard read path.
drop policy if exists capture_devices_anon_select on public.capture_devices;
create policy capture_devices_anon_select
    on public.capture_devices for select
    to anon using (true);

drop policy if exists meeting_visuals_anon_select on public.meeting_visuals;
create policy meeting_visuals_anon_select
    on public.meeting_visuals for select
    to anon using (true);

drop policy if exists meeting_transcript_chunks_anon_select on public.meeting_transcript_chunks;
create policy meeting_transcript_chunks_anon_select
    on public.meeting_transcript_chunks for select
    to anon using (true);

drop policy if exists meeting_reviews_anon_select on public.meeting_reviews;
create policy meeting_reviews_anon_select
    on public.meeting_reviews for select
    to anon using (true);

-- Device write path. A JWT device_id claim is preferred, but the initial
-- per-device key path may not mint custom claims yet; allow non-null device_id
-- inserts while dashboard credentials remain read-only by convention.
drop policy if exists capture_devices_anon_insert on public.capture_devices;
create policy capture_devices_anon_insert
    on public.capture_devices for insert
    to anon with check (device_id is not null and device_label is not null);

drop policy if exists capture_devices_anon_update on public.capture_devices;
create policy capture_devices_anon_update
    on public.capture_devices for update
    to anon using (
        device_id = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'device_id', device_id)
    ) with check (
        device_id = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'device_id', device_id)
    );

drop policy if exists meeting_visuals_device_insert on public.meeting_visuals;
create policy meeting_visuals_device_insert
    on public.meeting_visuals for insert
    to anon with check (device_id is not null and image_url is not null and image_hash is not null);

-- =====================================================================
-- Storage bucket + storage RLS
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meeting-visuals', 'meeting-visuals', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Device uploads go through Supabase Storage with anon/device key.
drop policy if exists meeting_visuals_storage_insert on storage.objects;
create policy meeting_visuals_storage_insert
    on storage.objects for insert
    to anon with check (bucket_id = 'meeting-visuals');

drop policy if exists meeting_visuals_storage_select on storage.objects;
create policy meeting_visuals_storage_select
    on storage.objects for select
    to anon using (bucket_id = 'meeting-visuals');

-- =====================================================================
-- Realtime publication
-- =====================================================================
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename='capture_devices'
    ) then
        alter publication supabase_realtime add table public.capture_devices;
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename='meeting_visuals'
    ) then
        alter publication supabase_realtime add table public.meeting_visuals;
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename='meeting_reviews'
    ) then
        alter publication supabase_realtime add table public.meeting_reviews;
    end if;
end $$;
