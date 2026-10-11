import type { User } from "@supabase/supabase-js"
import { isSupabaseConfigured } from "./supabase/config"
import { createClient } from "./supabase/server"

export type AppUser = {
  id: string
  email: string
  name: string
  firstName: string
  avatarUrl: string | null
  provider: string
}

/**
 * Resolve a display name from a Supabase user.
 *
 * This is the piece that usually breaks: `user.name` does not exist.
 * Google puts the name in `user_metadata.full_name` (and mirrors it as
 * `name`), while an email/password signup only has it if it was passed
 * as `options.data.full_name`. We check every shape, then fall back to
 * the email handle so the UI is never blank.
 */
export function resolveDisplayName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>

  const candidates = [
    meta.full_name,
    meta.name,
    meta.preferred_username,
    meta.user_name,
    meta.nickname,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  if (user.email) return user.email.split("@")[0]
  return "there"
}

export function resolveAvatarUrl(user: User): string | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const candidates = [meta.avatar_url, meta.picture]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate
    }
  }
  return null
}

function toAppUser(user: User): AppUser {
  const name = resolveDisplayName(user)
  return {
    id: user.id,
    email: user.email ?? "",
    name,
    firstName: name.split(" ")[0],
    avatarUrl: resolveAvatarUrl(user),
    provider: user.app_metadata?.provider ?? "email",
  }
}

/** The signed-in user, or null. Reads cookies, so call it inside <Suspense>. */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return toAppUser(user)
}
