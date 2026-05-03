# Meeting Insights Hub — Storage Signed URL Contract

**Date:** 2026-05-03  
**Consumers:** `clawd-dashboard` `/meetings` route  
**Provider:** Server-side Supabase helper

Dashboard route handlers should generate signed URLs server-side. The browser should never need device anon keys and should not know about per-device capture credentials.

## Bucket

- Bucket: `meeting-visuals`
- Visibility: private
- Retention: 90 days
- Expired/archived UX copy: `Image archived after 90 days — caption preserved`

## Default TTL

- Signed URL TTL: **6 hours** for dashboard viewing.
- Refresh on `visibilitychange` / tab focus if current URL is expired or expires within the next 5 minutes.
- Refreshing a signed URL must not require re-uploading the image.

## Helper signature

Server-side helper:

```ts
type SignedFrameUrl = {
  frame_id: string
  storage_path: string
  signed_url: string
  signed_url_expires_at: string
}

async function createMeetingFrameSignedUrl(args: {
  storagePath: string
  frameId: string
  ttlSeconds?: number // default 21600 / 6h
}): Promise<SignedFrameUrl>
```

Batch helper for detail page:

```ts
async function createMeetingFrameSignedUrls(args: {
  frames: Array<{ id: string; image_url: string }>
  ttlSeconds?: number
}): Promise<SignedFrameUrl[]>
```

## Error behavior

If storage object is missing/expired:

```ts
type SignedUrlError = {
  frame_id: string
  storage_path: string
  error: 'not_found' | 'expired' | 'storage_error'
  message: string
}
```

Dashboard should render the archived placeholder and keep `slide_text` / `ai_caption` visible.

## Security notes

- Use service-role or server-side privileged Supabase client only in route handlers/server components.
- Do not expose Supabase service key to client components.
- Do not use per-device anon keys for dashboard reads.
- Device anon keys are write-scoped for capture agents only.

## Dashboard refresh pattern

Client-side flow:

1. Initial page load receives signed URLs from `GET /api/meetings/:granola_meeting_id`.
2. `MeetingClient.tsx` tracks `signed_url_expires_at` per frame.
3. On tab focus or visibility change, call a server route to refresh URLs expiring within 5 minutes.
4. Replace URLs in local state without remounting the whole page.

Suggested refresh endpoint:

```ts
POST /api/meetings/:granola_meeting_id/signed-urls/refresh
body: { frame_ids: string[] }
response: { urls: SignedFrameUrl[] }
```
