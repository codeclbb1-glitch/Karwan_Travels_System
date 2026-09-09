import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn("[KMR] Supabase env vars not set — running in offline mode.");
}

const anonKey = supabaseAnonKey ?? "placeholder-anon-key";

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        apikey: anonKey,
      },
    },
  },
);
