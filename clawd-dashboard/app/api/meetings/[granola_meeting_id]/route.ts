import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  createMeetingFrameSignedUrls,
  isSignedUrlError,
} from "@/lib/meetings/signed-url";
import { granolaGet } from "@/lib/meetings/granola";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { granola_meeting_id: string } }
) {
  const id = params.granola_meeting_id;
  const supabase = createSupabaseServerClient();

  const [reviewRes, visualsRes, chunksRes, meta] = await Promise.all([
    supabase
      .from("meeting_reviews")
      .select("*")
      .eq("granola_meeting_id", id)
      .maybeSingle(),
    supabase
      .from("meeting_visuals")
      .select(
        "id, frame_ts, image_url, image_hash, device_id, device_label, slide_text, ai_caption, ocr_lang"
      )
      .eq("granola_meeting_id", id)
      .order("frame_ts", { ascending: true }),
    supabase
      .from("meeting_transcript_chunks")
      .select("id, chunk_index, chunk_start_ts, chunk_end_ts, chunk_text")
      .eq("granola_meeting_id", id)
      .order("chunk_index", { ascending: true }),
    granolaGet(id),
  ]);

  if (reviewRes.error)
    return Response.json({ error: reviewRes.error.message }, { status: 500 });
  if (visualsRes.error)
    return Response.json({ error: visualsRes.error.message }, { status: 500 });
  if (chunksRes.error)
    return Response.json({ error: chunksRes.error.message }, { status: 500 });

  const visuals = visualsRes.data ?? [];
  const signed = await createMeetingFrameSignedUrls({
    frames: visuals.map((v) => ({ id: v.id, image_url: v.image_url })),
  });
  const signedById = new Map(signed.map((s) => [s.frame_id, s]));

  const visualsOut = visuals.map((v) => {
    const s = signedById.get(v.id);
    if (s && isSignedUrlError(s)) {
      return {
        ...v,
        signed_url: null,
        signed_url_expires_at: null,
        signed_url_error: s.error,
      };
    }
    return {
      ...v,
      signed_url: s?.signed_url ?? null,
      signed_url_expires_at: s?.signed_url_expires_at ?? null,
      signed_url_error: null,
    };
  });

  // Granola meta is included even when a review row exists so the dashboard
  // can render the live title for the unanalyzed/empty-state case without
  // a second fetch. Slight deviation from docs/granola-bridge-contract.md
  // which only lists review/visuals/transcript_chunks.
  return Response.json({
    meeting: meta
      ? {
          granola_meeting_id: meta.id,
          title: meta.title,
          started_at: meta.started_at,
          ended_at: meta.ended_at,
          attendees: meta.participants ?? [],
        }
      : null,
    review: reviewRes.data,
    visuals: visualsOut,
    transcript_chunks: chunksRes.data ?? [],
  });
}
