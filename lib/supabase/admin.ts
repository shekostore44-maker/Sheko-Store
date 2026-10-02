import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { supabaseUrl } from "./env"

/**
 * Supabase client with the secret key. It bypasses Row Level Security, so use
 * it only in trusted server code (for example creating an order with prices
 * calculated on the server) and never return its raw results to the browser.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set")
  }

  return createSupabaseClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
