import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const STALE_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("capture_devices")
    .select(
      "device_id, device_label, last_seen, last_capture_ts, registered_at"
    )
    .order("last_seen", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const devices = (data ?? []).map((d) => ({
    ...d,
    stale: now - new Date(d.last_seen).getTime() > STALE_MS,
  }));
  return Response.json({ devices });
}
