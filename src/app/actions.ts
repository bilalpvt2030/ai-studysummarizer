"use server"

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect("/login")
}

type ActionResult = { ok: true } | { ok: false; error: string }

const NOT_SIGNED_IN: ActionResult = { ok: false, error: "Please sign in again." }

// Server Functions are plain POST endpoints, so each one checks the session
// itself. Row level security then limits the query to the caller's own rows.

export async function deleteSummary(id: string): Promise<ActionResult> {
  if (!(await getCurrentUser())) return NOT_SIGNED_IN

  const supabase = await createClient()
  const { error } = await supabase.from("summaries").delete().eq("id", String(id))
  if (error) {
    console.error(`[actions] delete summary failed: ${error.message}`)
    return { ok: false, error: "Couldn't delete that summary. Please try again." }
  }
  return { ok: true }
}

export async function renameSummary(id: string, title: string): Promise<ActionResult> {
  if (!(await getCurrentUser())) return NOT_SIGNED_IN

  const cleaned = String(title).trim().slice(0, 200)
  if (!cleaned) return { ok: false, error: "A title can't be empty." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("summaries")
    .update({ title: cleaned })
    .eq("id", String(id))
  if (error) {
    console.error(`[actions] rename summary failed: ${error.message}`)
    return { ok: false, error: "Couldn't rename that summary. Please try again." }
  }
  return { ok: true }
}
