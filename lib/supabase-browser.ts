import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null | undefined;

export function getSupabaseBrowser() {
  if (browserClient !== undefined) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  browserClient = url && key
    ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
  return browserClient;
}
