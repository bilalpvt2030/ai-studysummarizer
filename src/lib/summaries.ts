import { createClient } from "./supabase/server"
import {
  DAILY_SUMMARY_LIMIT,
  toStudySummary,
  type SavedSummary,
  type StudySummary,
  type Usage,
} from "./summary"

/**
 * Saved summaries and the daily limit. Every query runs as the signed-in user,
 * so row level security is what keeps one user's rows from another.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const HISTORY_LIMIT = 50
const COLUMNS = "id, title, file_name, created_at, summary"

type Row = {
  id: string
  title: string
  file_name: string
  created_at: string
  summary: unknown
}

function toSavedSummary(row: Row): SavedSummary {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    createdAt: row.created_at,
    summary: toStudySummary(row.summary),
  }
}

export async function listSummaries(): Promise<SavedSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("summaries")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT)

  if (error) {
    console.error(`[summaries] list failed: ${error.message}`)
    return []
  }
  return (data as Row[]).map(toSavedSummary)
}

export async function saveSummary(
  fileName: string,
  summary: StudySummary
): Promise<SavedSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("summaries")
    .insert({ file_name: fileName, title: summary.title.slice(0, 200), summary })
    .select(COLUMNS)
    .single()

  if (error) {
    console.error(`[summaries] save failed: ${error.message}`)
    return null
  }
  return toSavedSummary(data as Row)
}

/**
 * Summaries this user generated in the last 24 hours. If the lookup fails the
 * limit is not enforced: a database hiccup shouldn't take the summarizer down.
 */
export async function getUsage(): Promise<Usage> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("summary_usage")
    .select("created_at")
    .gt("created_at", new Date(Date.now() - DAY_MS).toISOString())
    .order("created_at", { ascending: true })
    .limit(DAILY_SUMMARY_LIMIT)

  if (error) {
    console.error(`[summaries] usage lookup failed: ${error.message}`)
    return { used: 0, limit: DAILY_SUMMARY_LIMIT, resetsAt: null }
  }

  const oldest = data[0]?.created_at as string | undefined
  return {
    used: data.length,
    limit: DAILY_SUMMARY_LIMIT,
    resetsAt: oldest ? new Date(new Date(oldest).getTime() + DAY_MS).toISOString() : null,
  }
}

export async function recordUsage(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("summary_usage").insert({})
  if (error) console.error(`[summaries] usage record failed: ${error.message}`)
}
