import { spawn } from "node:child_process";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { granola_meeting_id: string } }
) {
  const id = params.granola_meeting_id;
  const supabase = createSupabaseServerClient();

  // Synchronous status flip so Realtime fires before the analyzer's own
  // entry-point write — keeps the spinner from flickering.
  const { error } = await supabase
    .from("meeting_reviews")
    .upsert(
      { granola_meeting_id: id, status: "analyzing", summary_md: "" },
      { onConflict: "granola_meeting_id" }
    );
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const workspace =
    process.env.CLAWD_WORKSPACE_ROOT ?? "/root/.openclaw/workspace";
  spawn(
    "python3",
    [`${workspace}/scripts/clawd-meeting-review.py`, "--granola-id", id],
    { detached: true, stdio: "ignore" }
  ).unref();

  return Response.json({ status: "analyzing" });
}
