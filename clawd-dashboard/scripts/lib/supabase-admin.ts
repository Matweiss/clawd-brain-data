import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Privileged Supabase client used only by server-side scripts.
// NEVER imported from any file under app/ — that would leak the service
// role key into the browser bundle. The sync script invokes this via
// scripts/sync-hubspot.ts; nothing else does.
export function createSupabaseAdminClient(
  url: string,
  serviceRoleKey: string
): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: "public" },
  });
}
