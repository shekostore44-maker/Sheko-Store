import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

export type SessionUser = { id: string; email: string | null }
export type AdminUser = SessionUser & { fullName: string | null }

/** The signed-in user, verified from the auth token. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  return { id: claims.sub, email: (claims.email as string | undefined) ?? null }
})

/** The signed-in user if their profile has the admin role, otherwise null. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") return null
  return { ...user, fullName: profile.full_name }
})

/**
 * Call at the top of every admin page and admin Server Action.
 * Redirects to the login page when the visitor is not an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/admin/login")

  const admin = await getAdmin()
  if (!admin) redirect("/admin/login?error=forbidden")

  return admin
}
