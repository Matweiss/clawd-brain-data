import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  createMeetingFrameSignedUrls,
  isSignedUrlError,
} from "@/lib/meetings/signed-url";
import { granolaGet, type GranolaParticipant } from "@/lib/meetings/granola";
import type {
  MeetingReviewStatus,
  MeetingReviewFailureCode,
  MeetingAttendee,
  UnspokenVisual,
} from "@shared/db";

export type MeetingDetailVisual = {
  id: string;
  frame_ts: string;
  image_url: string;
  image_hash: string;
  device_id: string;
  device_label: string;
  slide_text: string | null;
  ai_caption: string | null;
  ocr_lang: string;
  signed_url: string | null;
  signed_url_expires_at: string | null;
  signed_url_error: "not_found" | "expired" | "storage_error" | null;
};

export type MeetingDetailReview = {
  id: string;
  granola_meeting_id: string;
  status: MeetingReviewStatus;
  failure_code: MeetingReviewFailureCode | null;
  failure_reason: string | null;
  generated_at: string;
  summary_md: string;
  attendees: MeetingAttendee[];
  unspoken_visuals: UnspokenVisual[];
  frame_count: number;
  notion_page_id: string | null;
  meeting_started_at: string | null;
  meeting_ended_at: string | null;
};

export type MeetingDetailTranscriptChunk = {
  id: string;
  chunk_index: number;
  chunk_start_ts: string;
  chunk_end_ts: string;
  chunk_text: string;
};

export type MeetingDetailMeta = {
  granola_meeting_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  attendees: GranolaParticipant[];
};

export type MeetingDetail = {
  meeting: MeetingDetailMeta | null;
  review: MeetingDetailReview | null;
  visuals: MeetingDetailVisual[];
  transcript_chunks: MeetingDetailTranscriptChunk[];
};

export async function fetchMeetingDetail(
  granolaMeetingId: string
): Promise<MeetingDetail> {
  const supabase = createSupabaseServerClient();

  const [reviewRes, visualsRes, chunksRes, meta] = await Promise.all([
    supabase
      .from("meeting_reviews")
      .select("*")
      .eq("granola_meeting_id", granolaMeetingId)
      .maybeSingle(),
    supabase
      .from("meeting_visuals")
      .select(
        "id, frame_ts, image_url, image_hash, device_id, device_label, slide_text, ai_caption, ocr_lang"
      )
      .eq("granola_meeting_id", granolaMeetingId)
      .order("frame_ts", { ascending: true }),
    supabase
      .from("meeting_transcript_chunks")
      .select("id, chunk_index, chunk_start_ts, chunk_end_ts, chunk_text")
      .eq("granola_meeting_id", granolaMeetingId)
      .order("chunk_index", { ascending: true }),
    granolaGet(granolaMeetingId),
  ]);

  if (reviewRes.error) throw new Error(reviewRes.error.message);
  if (visualsRes.error) throw new Error(visualsRes.error.message);
  if (chunksRes.error) throw new Error(chunksRes.error.message);

  const visuals = (visualsRes.data ?? []) as Array<
    Omit<
      MeetingDetailVisual,
      "signed_url" | "signed_url_expires_at" | "signed_url_error"
    >
  >;
  const signed = await createMeetingFrameSignedUrls({
    frames: visuals.map((v) => ({ id: v.id, image_url: v.image_url })),
  });
  const signedById = new Map(signed.map((s) => [s.frame_id, s]));

  const visualsOut: MeetingDetailVisual[] = visuals.map((v) => {
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

  return {
    meeting: meta
      ? {
          granola_meeting_id: meta.id,
          title: meta.title,
          started_at: meta.started_at,
          ended_at: meta.ended_at,
          attendees: meta.participants ?? [],
        }
      : null,
    review: reviewRes.data as MeetingDetailReview | null,
    visuals: visualsOut,
    transcript_chunks: (chunksRes.data ?? []) as MeetingDetailTranscriptChunk[],
  };
}
