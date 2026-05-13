import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// True only if both required Supabase environment variables are present
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey
)

// Supabase client instance — null if environment variables are missing.
// Use getSupabaseClient() in application code to get a guaranteed non-null instance.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null

// Returns the Supabase client or throws a descriptive error if not configured.
// Use this instead of importing supabase directly to avoid null checks throughout the app.
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env."
    )
  }

  return supabase
}
