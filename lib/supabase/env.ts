// Supabase is optional until the project keys are added to .env.local,
// so callers can check this instead of crashing on a missing variable.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
