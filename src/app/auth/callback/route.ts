import { NextResponse, type NextRequest } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/utils"

/**
 * Where Google (via Supabase) sends the user back after consent.
 * Exchanges the one-time ?code for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const safeNext = safeNextPath(searchParams.get("next"))

  // The login page only shows a short code-mapped message; the provider's
  // raw reason goes to the server log, not to the user.
  const fail = (code: "cancelled" | "failed", detail: string) => {
    console.error(`[auth/callback] ${code}: ${detail}`)
    // A reset link that can't be used goes back to where a new one is requested.
    if (safeNext === "/reset-password") {
      return NextResponse.redirect(`${origin}/forgot-password?error=link`)
    }
    return NextResponse.redirect(`${origin}/login?error=${code}`)
  }

  const providerError = searchParams.get("error")
  if (providerError) {
    const detail = searchParams.get("error_description") ?? providerError
    return fail(providerError === "access_denied" ? "cancelled" : "failed", detail)
  }

  if (!isSupabaseConfigured) return fail("failed", "Supabase is not configured")
  if (!code) return fail("failed", "No authorization code was returned")

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return fail("failed", error.message)

  const forwardedHost = request.headers.get("x-forwarded-host")

  if (process.env.NODE_ENV === "development" || !forwardedHost) {
    return NextResponse.redirect(`${origin}${safeNext}`)
  }
  return NextResponse.redirect(`https://${forwardedHost}${safeNext}`)
}
