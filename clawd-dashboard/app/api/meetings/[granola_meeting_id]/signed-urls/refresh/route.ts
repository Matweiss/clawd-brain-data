import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createMeetingFrameSignedUrls } from "@/lib/meetings/signed-url";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { granola_meeting_id: string } }
) {
  let body: { frame_ids?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!Array.isArray(body.frame_ids) || body.frame_ids.length === 0) {
    return Response.json(
      { error: "frame_ids must be a non-empty array of strings" },
      { status: 400 }
    );
  }
  const frameIds = body.frame_ids.filter(
    (x): x is string => typeof x === "string"
  );
  if (frameIds.length === 0) {
    return Response.json(
      { error: "frame_ids must contain strings" },
      { status: 400 }
    );
  }

  // Scope by granola_meeting_id so a caller cannot refresh URLs for
  // frames that belong to a different meeting.
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meeting_visuals")
    .select("id, image_url")
    .eq("granola_meeting_id", params.granola_meeting_id)
    .in("id", frameIds);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const urls = await createMeetingFrameSignedUrls({ frames: data ?? [] });
  return Response.json({ urls });
}
