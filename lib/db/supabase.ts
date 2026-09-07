import { createClient } from "@supabase/supabase-js";
import { mockDb } from "./mock-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes("placeholder") ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes("placeholder");

// Standard client for public / attendee reads with anon key
export const supabase = !isPlaceholder
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client with service-role key (server-side only, never exposed to client)
export const supabaseAdmin = !isPlaceholder && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null;

export function isUsingLiveSupabase(): boolean {
  return !isPlaceholder && Boolean(supabaseAdmin);
}

export { mockDb };
