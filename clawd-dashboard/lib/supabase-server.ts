import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/db";

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

export function createSupabaseServerClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "clawd-dashboard-server" } },
  });
}
