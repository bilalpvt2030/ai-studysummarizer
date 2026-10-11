import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/config"

const PROTECTED_PREFIXES = ["/dashboard"]

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`.
 * Runs before every matched request: refreshes the Supabase session cookie
 * and guards protected routes.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Without credentials there is no session to refresh — let every page through
  // so the setup screen can explain what is missing.
  if (!isSupabaseConfigured) return response

  // When the redirect URL isn't allow-listed, Supabase sends the user to the
  // Site URL root with the ?code attached. Hand it to the callback so the
  // sign-in still completes instead of silently dropping it.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/callback"
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Do not put code between createServerClient and getUser(): it refreshes
  // the auth token and a stray await here can log users out at random.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  // A redirect is a new response, so carry over any cookies getUser() just
  // refreshed — otherwise the rotated session is lost on the way.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url)
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie)
    }
    return redirect
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("next", pathname)
    return redirectTo(url)
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return redirectTo(url)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
