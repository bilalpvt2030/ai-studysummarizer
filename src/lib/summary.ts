/** Shared by the server code and the dashboard UI — nothing secret here. */

// /api/summarize is left out of proxy.ts's matcher: the proxy buffers request
// bodies and cuts them off at 10MB, which would truncate uploads this large.
export const MAX_FILE_BYTES = 20 * 1024 * 1024

// Pasted text. Roughly 25,000 words at the top end.
export const MIN_TEXT_CHARS = 200
export const MAX_TEXT_CHARS = 150_000

export const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const

export const DETAIL_LEVELS = ["short", "standard", "detailed"] as const
export type DetailLevel = (typeof DETAIL_LEVELS)[number]

// Per user, over a rolling 24 hours. The free Gemini tier gives the whole site
// roughly 1,100 requests a day, so this keeps one account from using it all.
export const DAILY_SUMMARY_LIMIT = 20

export type QuizQuestion = {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type StudySummary = {
  title: string
  overview: string
  keyPoints: string[]
  keyTerms: { term: string; definition: string }[]
  questions: { question: string; answer: string }[]
  /** Multiple choice. Empty for summaries saved before quizzes existed. */
  quiz: QuizQuestion[]
}

export type SavedSummary = {
  id: string
  title: string
  fileName: string
  createdAt: string
  summary: StudySummary
}

export type Usage = {
  used: number
  limit: number
  /** When the oldest summary in the window ages out and a slot frees up. */
  resetsAt: string | null
}

/**
 * Coerce untrusted JSON (a model reply, a database row) into a StudySummary,
 * so a malformed value can't crash the UI.
 */
export function toStudySummary(value: unknown): StudySummary {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const list = (v: unknown) => (Array.isArray(v) ? v : [])
  const record = (v: unknown) => (v && typeof v === "object" ? v : {}) as Record<string, unknown>

  return {
    title: text(source.title) || "Untitled document",
    overview: text(source.overview),
    keyPoints: list(source.keyPoints).map(text).filter(Boolean),
    keyTerms: list(source.keyTerms)
      .map((item) => ({ term: text(record(item).term), definition: text(record(item).definition) }))
      .filter((item) => item.term && item.definition),
    questions: list(source.questions)
      .map((item) => ({ question: text(record(item).question), answer: text(record(item).answer) }))
      .filter((item) => item.question && item.answer),
    quiz: list(source.quiz)
      .map((item) => ({
        question: text(record(item).question),
        options: list(record(item).options).map(text).filter(Boolean),
        answerIndex: Number(record(item).answerIndex),
        explanation: text(record(item).explanation),
      }))
      .filter(
        (item) =>
          item.question &&
          item.options.length >= 2 &&
          Number.isInteger(item.answerIndex) &&
          item.answerIndex >= 0 &&
          item.answerIndex < item.options.length
      ),
  }
}
