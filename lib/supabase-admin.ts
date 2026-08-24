import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const realtimeChatConfigured = Boolean(supabaseUrl && supabaseSecret);

export function createSupabaseAdmin() {
  if (!supabaseUrl || !supabaseSecret) return null;
  return createClient(supabaseUrl, supabaseSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
