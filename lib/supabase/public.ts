import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { supabaseKey, supabaseUrl } from "./env"

/** Cache tag on every public catalog request; admin edits expire it. */
export const CATALOG_TAG = "catalog"

/**
 * Anonymous client for public store pages. It sends no cookies, so pages that
 * use it can be prerendered and cached. RLS limits it to visible catalog rows.
 * Responses are cached under CATALOG_TAG (see lib/catalog/revalidate.ts).
 */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { tags: [CATALOG_TAG], revalidate: 3600 } }),
    },
  })
}
