import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env"

const ADMIN_LOGIN = "/admin/login"

function isProtectedAdminPath(pathname: string) {
  return pathname.startsWith("/admin") && !pathname.startsWith(ADMIN_LOGIN)
}

function isAccountPath(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/")
}

/**
 * Refreshes the Supabase auth session on every request so Server Components
 * always see a valid session, and sends signed-out visitors of /admin and /account to
 * the matching login page. This is only an optimistic check: the admin role itself is
 * verified in lib/auth/dal.ts and by RLS in the database.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured) {
    if (isProtectedAdminPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url))
    }
    return response
  }

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
  const { data } = await supabase.auth.getClaims()

  const { pathname, search } = request.nextUrl
  const needsLogin = isProtectedAdminPath(pathname) || isAccountPath(pathname)
  if (!data?.claims && needsLogin) {
    const loginUrl = new URL(
      isAccountPath(pathname) ? "/login" : ADMIN_LOGIN,
      request.url,
    )
    loginUrl.searchParams.set("next", pathname + search)
    const redirect = NextResponse.redirect(loginUrl)
    // Keep any refreshed auth cookies on the redirect response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}
