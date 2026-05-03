// Strict env loader for server-side scripts.
// Browser-side code uses NEXT_PUBLIC_* via lib/supabase.ts; this is the
// privileged side and uses SUPABASE_SERVICE_ROLE_KEY + HUBSPOT_TOKEN.

interface SyncEnv {
  hubspotToken: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export function loadEnv(): SyncEnv {
  const missing: string[] = [];

  const hubspotToken = process.env.HUBSPOT_TOKEN;
  if (!hubspotToken) missing.push("HUBSPOT_TOKEN");

  // Reuse the public URL — same project, same hostname
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    console.error(
      `\n  Missing required env vars: ${missing.join(", ")}\n` +
        `  Add them to .env.local — see .env.example for the full list.\n`
    );
    process.exit(1);
  }

  return {
    hubspotToken: hubspotToken!,
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
  };
}
