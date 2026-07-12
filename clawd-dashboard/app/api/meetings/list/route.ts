import { createSupabaseServerClient } from "@/lib/supabase-server";
import { granolaRecent } from "@/lib/meetings/granola";
import type { UnspokenVisual, MeetingReviewStatus, MeetingReviewFailureCode } from "@shared/db";

export const dynamic = "force-dynamic";

type ListItem = {
  granola_meeting_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  attendee_count: number;
  frame_count: number;
  unspoken_count: number;
  status: MeetingReviewStatus | null;
  failure_code: MeetingReviewFailureCode | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
    200
  );

  // Pull a wider Granola window than `limit` so the since-filter doesnt
  // starve the response when the user requests, e.g., last 7 days but the
  // most recent 50 meetings span only 2 days.
  const recent = await granolaRecent({ limit: 200 });

  let meetings = recent.meetings;
  if (since) {
    const sinceMs = Date.parse(since);
    if (Number.isFinite(sinceMs)) {
      meetings = meetings.filter((m) => Date.parse(m.started_at) >= sinceMs);
    }
  }
  meetings.sort(
    (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)
  );
  meetings = meetings.slice(0, limit);

  const ids = meetings.map((m) => m.id);
  const supabase = createSupabaseServerClient();
  const reviewsRes = ids.length === 0
    ? { data: [], error: null }
    : await supabase
        .from("meeting_reviews")
        .select(
          "granola_meeting_id, status, frame_count, unspoken_visuals, failure_code"
        )
        .in("granola_meeting_id", ids);

  if (reviewsRes.error) {
    return Response.json({ error: reviewsRes.error.message }, { status: 500 });
  }

  const reviewByMeeting = new Map(
    (reviewsRes.data ?? []).map((r) => [r.granola_meeting_id, r])
  );

  const items: ListItem[] = meetings.map((m) => {
    const review = reviewByMeeting.get(m.id);
    const unspoken = (review?.unspoken_visuals ?? []) as UnspokenVisual[];
    return {
      granola_meeting_id: m.id,
      title: m.title,
      started_at: m.started_at,
      ended_at: m.ended_at,
      attendee_count: m.participants?.length ?? 0,
      frame_count: review?.frame_count ?? 0,
      unspoken_count: unspoken.length,
      status: (review?.status as MeetingReviewStatus | undefined) ?? null,
      failure_code:
        (review?.failure_code as MeetingReviewFailureCode | null | undefined) ??
        null,
    };
  });

  return Response.json({ meetings: items });
}
