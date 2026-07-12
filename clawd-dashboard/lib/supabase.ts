import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Surface a clear error at module load — easier to debug than a silent null client
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
}

// Browser/edge client — uses the publishable key (NOT service_role).
// Cloudflare Access gates the dashboard at the edge; RLS allows anon SELECT
// only on the four read tables (tasks, approvals, agent_events, agent_memories).
export function createSupabaseBrowserClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}
