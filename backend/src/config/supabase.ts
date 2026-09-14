import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Database } from "../types/database.types.js";

dotenv.config();

const rawUrl = process.env.SUPABASE_URL?.trim();
const rawKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawKey &&
    !rawUrl.includes("your-project-id") &&
    !rawKey.includes("your-")
);

if (!isSupabaseConfigured) {
  console.warn(
    "\n⚠️  [Supabase Notice]: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY is not configured in your .env file."
  );
  console.warn(
    "👉 Copy .env.example to .env and set your Supabase project credentials to enable database operations.\n"
  );
}

// Fallback to dummy placeholder to prevent immediate startup crash before .env is populated
const supabaseUrl = isSupabaseConfigured
  ? (rawUrl as string)
  : "https://placeholder-project.supabase.co";
const supabaseKey = isSupabaseConfigured
  ? (rawKey as string)
  : "placeholder-supabase-key";

// Typed Supabase client instance
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
