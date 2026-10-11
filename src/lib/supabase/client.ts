import { createBrowserClient } from "@supabase/ssr"
import { supabaseAnonKey, supabaseUrl } from "./config"

/** Supabase client for Client Components. Session lives in cookies. */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
