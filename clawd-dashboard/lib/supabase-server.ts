import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase-server.ts must not be imported from client components. Use lib/supabase.ts (createSupabaseBrowserClient) instead."
  );
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    "Missing Supabase server env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_SERVICE_KEY)."
  );
}

// Untyped client to match lib/supabase.ts convention. The hand-written
// shared/db.ts is missing the per-table Relationships field that
// supabase-js's generic constraint expects, which collapses .from()
// inference to `never`. Routes cast row shapes explicitly where needed
// using types from @shared/db.
export function createSupabaseServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "clawd-dashboard-server" } },
  });
}
