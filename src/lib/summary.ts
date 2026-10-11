/** Shared by the summarize route and the dashboard UI — nothing secret here. */

// Kept under Next's 10MB proxy body buffer (proxyClientMaxBodySize). A larger
// upload reaches the route handler cut off at 10MB, which is still over this
// limit, so it is rejected instead of being summarized half-read.
export const MAX_PDF_BYTES = 8 * 1024 * 1024

export type StudySummary = {
  title: string
  overview: string
  keyPoints: string[]
  keyTerms: { term: string; definition: string }[]
  questions: { question: string; answer: string }[]
}
