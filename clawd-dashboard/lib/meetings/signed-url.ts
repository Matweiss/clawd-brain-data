import { createSupabaseServerClient } from "@/lib/supabase-server";

export const MEETING_VISUALS_BUCKET = "meeting-visuals";
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

export type SignedFrameUrl = {
  frame_id: string;
  storage_path: string;
  signed_url: string;
  signed_url_expires_at: string;
};

export type SignedUrlError = {
  frame_id: string;
  storage_path: string;
  error: "not_found" | "expired" | "storage_error";
  message: string;
};

export type SignedUrlResult = SignedFrameUrl | SignedUrlError;

export function isSignedUrlError(r: SignedUrlResult): r is SignedUrlError {
  return "error" in r;
}

// meeting_visuals.image_url is stored as "<bucket>/<path>", e.g.
// "meeting-visuals/sample/sample-unspoken-ocr.jpg". The Storage API
// expects just "<path>" relative to the bucket.
export function imageUrlToStoragePath(image_url: string): string {
  const prefix = `${MEETING_VISUALS_BUCKET}/`;
  const idx = image_url.indexOf(prefix);
  return idx >= 0 ? image_url.slice(idx + prefix.length) : image_url;
}

export async function createMeetingFrameSignedUrl(args: {
  storagePath: string;
  frameId: string;
  ttlSeconds?: number;
}): Promise<SignedUrlResult> {
  const ttl = args.ttlSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(MEETING_VISUALS_BUCKET)
    .createSignedUrl(args.storagePath, ttl);

  if (error || !data?.signedUrl) {
    const message = error?.message ?? "no signed URL returned";
    // Supabase wraps a 404 from storage as a generic StorageError; sniff
    // the message so callers can render the archived-image fallback.
    const errorType: SignedUrlError["error"] = /not.?found/i.test(message)
      ? "not_found"
      : "storage_error";
    return {
      frame_id: args.frameId,
      storage_path: args.storagePath,
      error: errorType,
      message,
    };
  }

  return {
    frame_id: args.frameId,
    storage_path: args.storagePath,
    signed_url: data.signedUrl,
    signed_url_expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
  };
}

export async function createMeetingFrameSignedUrls(args: {
  frames: Array<{ id: string; image_url: string }>;
  ttlSeconds?: number;
}): Promise<SignedUrlResult[]> {
  return Promise.all(
    args.frames.map((f) =>
      createMeetingFrameSignedUrl({
        frameId: f.id,
        storagePath: imageUrlToStoragePath(f.image_url),
        ttlSeconds: args.ttlSeconds,
      })
    )
  );
}
