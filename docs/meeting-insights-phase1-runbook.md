# Meeting Insights Hub — Phase 1 Runbook

**Paperclip:** TMW-618  
**Scope:** backend schema, Mac capture, VPS analyzer, sample data, CC handoff. Dashboard UI remains Phase 2.

## Files

- `migrations/0005_meeting_insights.sql` — Supabase schema/storage/RLS/realtime.
- `scripts/clawd-meeting-visuals.py` — macOS capture agent.
- `scripts/clawd-meeting-review.py` — VPS analyzer.
- `scripts/meeting-insights-sample-data.py` — sample rows for dashboard/API smoke tests.
- `scripts/meeting_insights/common.py` — shared Supabase/storage helpers.
- `docs/granola-bridge-contract.md` — dashboard API contract.
- `docs/storage-signed-urls.md` — signed URL helper contract.

## Prereqs

VPS:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `tesseract` binary for OCR
- Python packages: `Pillow`, `requests` (already present on VPS at build time)

Mac capture devices:

- macOS Screen Recording permission for the terminal/python runner.
- `screencapture` and `osascript` built in.
- Python with `Pillow`.
- Supabase anon/publishable env key available to launchd environment or wrapper.

## Apply migration

Migration 0005 is **already applied** to project `tntoclpqyisfttpchajh` (clawd-state) as of 2026-05-03.

To re-apply or apply to a fresh project:

```bash
# Direct Postgres URL is in /root/.config/clawd-state/env as SUPABASE_DB_URL.
# That env file is auto-loaded by clawd_state.py and meeting_insights/common.py.
set -a; source /root/.config/clawd-state/env; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f migrations/0005_meeting_insights.sql
```

If you have the Supabase CLI configured locally (we don't on the VPS yet):

```bash
supabase db push
supabase gen types typescript --project-id tntoclpqyisfttpchajh > shared/db.ts
```

`shared/db.ts` is hand-written for now (compiles strict against `clawd-mission-control-v2`'s tsc). When the Supabase CLI lands, regenerate it with the command above.

### pgvector / HNSW design note

`vector(3072)` exceeds pgvector's 2000-dim HNSW opclass cap, so the migration uses `_has_embedding_idx` partial presence indexes instead of HNSW on the vector columns. The analyzer reads embeddings into Python and computes cosine in-app. At Phase 1 scale (<5k rows) this is sub-100ms and zero-overhead.

When row count justifies an index, the upgrade path is a halfvec expression index (preflighted, works on this project):

```sql
create index meeting_visuals_slide_text_halfvec_idx
  on public.meeting_visuals
  using hnsw ((slide_text_embedding::halfvec(3072)) halfvec_cosine_ops)
  where slide_text_embedding is not null;
```

Analyzer queries that should use the index would need to cast: `slide_text_embedding::halfvec(3072) <=> $1::halfvec(3072)`.

## Mac setup

VPS-side automation cannot drive this — `openclaw nodes` has no working remote-shell into paired Mac nodes (see memory `reference_mac_node_remote_shell.md`). Run on the Mac terminal manually. There is a one-shot installer:

```bash
# On the Mac:
mkdir -p ~/clawd-meeting-visuals-install/meeting_insights
cd ~/clawd-meeting-visuals-install
scp root@100.91.33.9:/root/.openclaw/workspace/scripts/install-mac-capture-agent.sh .
scp root@100.91.33.9:/root/.openclaw/workspace/scripts/clawd-meeting-visuals.py .
scp root@100.91.33.9:/root/.openclaw/workspace/scripts/meeting_insights/common.py meeting_insights/

python3 -c 'import PIL' 2>/dev/null || python3 -m pip install --user Pillow

bash install-mac-capture-agent.sh \
  --url 'https://tntoclpqyisfttpchajh.supabase.co' \
  --key '<SUPABASE_PUBLISHABLE_KEY>' \
  --device-label "24/7 Mac" \
  --force-smoke
```

Once the smoke capture lands a row in `meeting_visuals`:

```bash
bash install-mac-capture-agent.sh \
  --url 'https://tntoclpqyisfttpchajh.supabase.co' \
  --key '<SUPABASE_PUBLISHABLE_KEY>' \
  --install-launchd
launchctl load ~/Library/LaunchAgents/com.thematweiss.clawd-meeting-visuals.plist
```

Stop the loop with `launchctl unload <plist>`.

**macOS Screen Recording permission**: the first `screencapture` will silently produce a black/blank frame until *System Settings → Privacy & Security → Screen Recording* is enabled for `python3` (the path appears in setup output). Re-run `--force-smoke` after granting.

Expected behavior:

- Every run updates `capture_devices.last_seen`.
- Non-Meet windows log `skip_not_meeting` and do not capture.
- Meet windows capture JPEG, resize to max width 1280, dedupe by perceptual hash, upload to private `meeting-visuals` bucket, and insert `meeting_visuals`.

## Analyzer

Latest meeting:

```bash
python3 scripts/clawd-meeting-review.py --latest
```

Specific meeting:

```bash
python3 scripts/clawd-meeting-review.py --granola-id <granola_meeting_id>
```

Useful smoke mode without external OCR/embedding costs:

```bash
python3 scripts/clawd-meeting-review.py --latest --no-ocr --no-embeddings
```

Analyzer writes:

- `meeting_transcript_chunks`
- `meeting_visuals.slide_text` / embedding fields when OCR/embedding succeeds
- `meeting_reviews`
- `agent_events.kind = meeting_review.frame_decision`

## Sample data

Dry run:

```bash
python3 scripts/meeting-insights-sample-data.py --dry-run
```

Insert sample rows:

```bash
python3 scripts/meeting-insights-sample-data.py
```

Sample covers:

- 2 unspoken visuals
  - one OCR text frame
  - one `slide_text = NULL` with deictic fallback context
- populated attendees using `{name, email?, granola_user_id?}`
- multi-device phash/image_hash dedup case

## CC Phase 2 handoff checklist

Before CC starts UI:

- [x] Migration applied successfully (2026-05-03 to project `tntoclpqyisfttpchajh`).
- [x] `shared/db.ts` hand-written and type-checks strict (regenerate via Supabase CLI when available).
- [x] 24/7 Mac completed `setup` and a forced smoke capture round-tripped to Supabase Storage end-to-end.
- [ ] Analyzer completes on a real Granola meeting (blocked on Granola cache refresh).
- [ ] Realtime update verified for `meeting_reviews` filtered by `granola_meeting_id` (CC will exercise this when subscribing in dashboard).
- [ ] Signed URL helper implemented server-side per `docs/storage-signed-urls.md` (CC owns).

## Known Phase 1 limitations

- Device custom JWT claims are preferred but not yet minted; initial RLS permits anon insert/update with non-null device ids. Tighten once per-device keys are minted (or skip if 2-device shared anon key remains acceptable).
- `granola_meeting_id` is assigned by analyzer/time-window matching, not capture-time window-title parsing. Capture-side rows may carry NULL `granola_meeting_id` until analyzer runs.
- OCR quality depends on Tesseract on the VPS and macOS Screen Recording permission for the launchd-spawned `python3` (the binary path used by the plist must be added to System Settings → Privacy & Security → Screen Recording).
- Threshold starts config/env-driven (`MEETING_INSIGHTS_COSINE_THRESHOLD`, default `0.43`) and should be tuned after 3-5 real meetings.
- Granola cache (`skills/granola-bridge/data/granola-cache.json`) requires periodic sync from the Mac via the granola-bridge sync script. Stale cache → analyzer cannot find recent meetings.

## Phase 3 — auto-trigger (also shipped 2026-05-03)

Originally scoped as a separate phase but built end-to-end the same day.

**Mac side** — Granola cache sync to VPS, every 30 min:

```cron
# Add to Mac `crontab -e`:
*/30 * * * * bash ~/clawd-workspace/skills/granola-bridge/scripts/granola-sync-push.sh >> ~/Library/Logs/granola-sync.log 2>&1
```

**VPS side** — auto-fire analyzer for new Granola meetings, every 5 min:

```cron
# Already added to VPS crontab:
*/5 * * * * /usr/bin/flock -n /tmp/clawd-meeting-review-auto.lock /usr/bin/python3 /root/.openclaw/workspace/scripts/clawd-meeting-review-auto.py >> /tmp/clawd-meeting-review-auto.log 2>&1
```

Behavior of `clawd-meeting-review-auto.py`:

- Reads recent Granola meetings via `granola-query.py recent --limit 20`.
- For each meeting whose `ended_at` is between `MEETING_INSIGHTS_SETTLE_MINUTES` ago (default 5 min) and `MEETING_INSIGHTS_MAX_AGE_HOURS` ago (default 48 hr):
  - Skip if `meeting_reviews` row already `complete`, or `failed` for non-transcript reasons.
  - If transcript not in cache yet → upsert `pending_transcript`, bump attempt counter, retry next tick.
  - If transcript present → fire `clawd-meeting-review.py --granola-id <id>` synchronously (cron run protected by flock so concurrent ticks can't pile up).
- Cap retries at `MEETING_INSIGHTS_MAX_ATTEMPTS` (default 6, per spec). On final failure, mark `failed/granola_timeout`.
- State persisted to `memory/meeting-insights-auto-state.json` so attempt counts survive cron restarts.

End-to-end flow once both crons are running:

1. Open Comet, join a Google Meet — **Mac launchd captures frames every 60s**.
2. Meeting ends — Mac launchd stops capturing (window title changes).
3. Within 30 min, Mac cron pushes fresh Granola cache to VPS.
4. Within 5 min after that, VPS cron sees the meeting + transcript, fires analyzer.
5. Analyzer writes `meeting_reviews` row (status `complete`, OCR'd slide_text, embedded chunks, unspoken visuals flagged).
6. CC's dashboard surfaces it via Realtime subscription — no manual action.

Worst-case latency from meeting end to dashboard row: ~35 min (cache sync + 5 min settle + analyzer runtime).

## Phase 1 build log (2026-05-03)

- Migration 0005 applied to clawd-state (project `tntoclpqyisfttpchajh`) via psql + the direct connection in `SUPABASE_DB_URL`.
- HNSW indexes on `slide_text_embedding` and `chunk_embedding` removed (pgvector 2000-dim cap on `vector` opclass; halfvec expression-index path documented above for when row count justifies).
- `scripts/meeting_insights/common.py` `create_signed_url` had a missing `/storage/v1` prefix on the returned signed URL — fixed in this build.
- 4 placeholder JPEGs uploaded to `meeting-visuals/sample/` so signed URLs resolve against the sample row during dashboard development.
- 24/7 Mac: capture agent + launchd installed; first real frame round-trip verified (signed URL returned 86 KB JPEG with valid SOI marker).
- OpenRouter `text-embedding-3-large` live-tested: returns 3072-dim normalized vectors.

## Phase 2 status (2026-05-03)

CC shipped Phase 2 dashboard scope on branch `tmw618-phase2`. PR ready
for review at https://github.com/Matweiss/clawd-brain-data/tree/tmw618-phase2.

### What shipped (commit-per-step)

1. **scaffold import** — clawd-dashboard had been on the VPS but never
   committed. Single `chore(dashboard): import existing scaffold`
   commit lands the Next 14 + Tailwind 3 setup so the rest of the PR
   reads as Phase 2 work only. The orphan
   `clawd-dashboard-phase1-pathBprime/` (byte-identical duplicate of
   `app/`) was left untracked — separate cleanup decision.
2. **init** — `lib/supabase-server.ts` (server client, accepts
   `SUPABASE_SERVICE_ROLE_KEY` or legacy `SUPABASE_SERVICE_KEY`),
   `@shared/*` tsconfig alias pointing at `../shared/`,
   `clawd-dashboard/.env` populated from `/root/.config/clawd-state/env`.
3. **signed-url helper** — `lib/meetings/signed-url.ts` with
   `createMeetingFrameSignedUrl` + batch + `not_found` fallback.
4. **API routes (7)** — list / detail / reanalyze / push-to-notion-501
   / signed-urls/refresh / devices / rotate-key-501. Granola helper at
   `lib/meetings/granola.ts` shells out to
   `skills/granola-bridge/scripts/granola-query.py`.
5. **list page** — `/meetings` between Contacts and Deals in nav,
   real-data table + `?demo=1`-gated mock-states table for visual QA.
6. **detail page** — UnspokenCallout hero, transcript + visuals split,
   Lightbox with ←/→/Esc keyboard nav and the locked
   archived-image fallback copy ("Image archived after 90 days —
   caption preserved.") with `slide_text` rendered prominently.
   Reanalyze button verified end-to-end against meeting
   `4364062c-411d-4793-b08a-6e5dc6747e31`.
7. **Realtime** — `useMeetingReviewRealtime` hook, filtered by
   `granola_meeting_id` (never broad-subscribes), refetches detail on
   any emit.
8. **devices page** — `/meetings/devices` with stale chip when
   `last_seen > 24h`, 5-min poll, rotate-key visible-but-disabled
   button hitting the 501 stub. Cross-link to/from `/meetings` via
   `PageShell` rightMeta.
9. **responsive** — single-column tab strip below 900px (Unspoken /
   Transcript / Visuals); two-column hero+split at 900px and up.

### Deviations from CC-PHASE2-BRIEFING.md

- **File layout**: brief had `clawd-dashboard/src/app/(authed)/meetings/...`
  but the actual repo is flat — `app/`, `lib/`, `app/components/`. No
  `(authed)` route group either; Cloudflare Access gates at the edge.
  Followed the existing `app/contacts/page.tsx` convention instead.
- **`shared/db.ts` typing**: server Supabase client is intentionally
  untyped (`SupabaseClient` not `SupabaseClient<Database>`) because the
  hand-written `shared/db.ts` is missing the per-table `Relationships`
  field that supabase-js's generic constraint requires — without it,
  `.from()` collapses to `never`. Routes cast at the boundary using
  types from `@shared/db`. Cheapest fix until `shared/db.ts` is
  regenerated via `supabase gen types typescript`.
- **Detail response shape**: adds a `meeting` field with Granola meta
  (title, started_at, ended_at, attendees) alongside `review`. Lets
  the page render the live title and meta even when no review row
  exists yet (status=null empty state) without a second round-trip.
  Slight extension to `docs/granola-bridge-contract.md`.
- **Granola CLI returns `id`**: contract uses `granola_meeting_id`;
  list route maps at the boundary.
- **`SUPABASE_SERVICE_KEY` accepted**: the dashboard `.env.example`
  documents `SUPABASE_SERVICE_ROLE_KEY` but `/root/.config/clawd-state/env`
  uses `SUPABASE_SERVICE_KEY` — server client accepts either name to
  match the analyzer's env naming.
- **Signed-URL refresh route** lives under
  `/api/meetings/[granola_meeting_id]/signed-urls/refresh` per the
  storage spec; bundled into step 3 (the brief's six API routes do not
  list it, but the spec calls for it).
- **Open-in-Granola button**: not shipped. Neither `granola-bridge`
  scripts nor the Granola cache JSON expose a deeplink URL pattern.
  Slot is reserved in `ActionBar.tsx`; drop in the `<Link>` once a
  pattern is documented. No dashboard PR needed beyond setting the
  href.
- **Real meeting `4364062c`** in the brief is a prefix; full
  `granola_meeting_id` is `4364062c-411d-4793-b08a-6e5dc6747e31`.
- **`DeviceRow.tsx`**: brief listed it as a separate file; folded
  inline into `DevicesClient.tsx` since it's purely presentational and
  used in one place.

### Branch publish notes

- Workspace `main` was 32 commits ahead of `origin/main` when CC
  started, with secrets in `backup-snapshots/.../config/.env` etc.
  blocking GitHub push protection. `tmw618-phase2` was rebased onto
  `origin/main` so the branch publishes cleanly. The 32-commit-ahead
  state on local `main` remains a separate cleanup.
- Mat's pre-existing tracked-file modifications were stashed
  (`pre-tmw618-rebase`) before the rebase; partial pop afterwards left
  unmerged markers for files created in the rebased-away commits, which
  CC reset to HEAD. Stash@{0} preserves the original state for any
  recovery; safe to `git stash drop stash@{0}` once Mat has resolved.

### Phase 2 known limitations / followups for v1.5

- Server Supabase client untyped — fix by regenerating `shared/db.ts`
  via Supabase CLI when available (`supabase gen types typescript
  --project-id tntoclpqyisfttpchajh > shared/db.ts`).
- Open-in-Granola URL pattern needs documenting; trivially adds a link.
- Realtime channel disconnect / reconnect UX is unmodeled — if the WS
  drops, page still shows last-known status. Consider a "live · stale"
  badge if this becomes an issue.
- Browser-driven smoke (visibilitychange refresh, 5-min device poll,
  Realtime live transition) was not exercised from CC's side — needs
  an SSH-tunnel eyeball or E2E (Playwright) coverage.
- Reanalyze button optimistically flips local status to analyzing;
  Realtime overwrites within ~100ms. If Realtime is broken at the
  Supabase level, the spinner stays stuck — currently no fallback
  poll. Could add a single 30s poll-after-click as a safety net.
- `clawd-dashboard-phase1-pathBprime/` orphan still untracked on disk;
  Mat to decide delete vs. keep.

### Smoke summary (server-side; tsc clean throughout)

- `GET /api/meetings/list?limit=3` — 200, 3 Granola meetings (1
  complete + 2 not_yet_analyzed).
- `GET /api/meetings/sample-meeting-insights-001` — 200, full detail
  payload; first signed URL fetched a 34KB JPEG with valid SOI marker.
- `GET /api/devices` — 200, 3 devices (real `mac-macbookpro` plus 2
  sample devices), none stale.
- `POST /api/meetings/.../push-to-notion` and `/devices/.../rotate-key`
  — 501 with `not_implemented` body.
- `POST /api/meetings/.../signed-urls/refresh` — 200 with two fresh
  signed URLs, scoped by meeting.
- Reanalyze flow: `analyzing` flips synchronously in route, then
  `complete` ~2s later via analyzer subprocess; `generated_at`
  preserved by analyzer's idempotent regeneration.

### Dev loop

```bash
# On VPS, in clawd-dashboard:
cd /root/.openclaw/workspace/clawd-dashboard
npm install   # one-time
npm run dev   # binds 127.0.0.1:3000

# From Mac:
ssh -L 3000:localhost:3000 root@100.91.33.9
# Then http://localhost:3000/meetings in any Mac browser.
```

`npm run dev` warns about Next 14.2.15 having a known security
advisory; bumping is a separate decision Mat owns and was not in scope.
