import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env"

/**
 * Refreshes the Supabase auth session on every request so Server Components
 * always see a valid session. Admin route protection is added in phase 2.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        )
      },
    },
  })

  // Do not run code between createServerClient and getClaims():
  // getClaims() is what refreshes an expired session.
  await supabase.auth.getClaims()

  return response
}
