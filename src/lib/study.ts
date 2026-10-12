import type { StudySummary } from "./summary"

/** Flashcards and quizzes are built from a summary in the browser — no extra AI call. */

export type Flashcard = { front: string; back: string; kind: "Term" | "Question" }

export type PreparedQuestion = {
  question: string
  options: string[]
  correct: number
  explanation: string
}

const TERM_QUIZ_MIN_TERMS = 4
const TERM_QUIZ_MAX_QUESTIONS = 6

/** Random order, so call it from an event handler rather than during render. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function buildFlashcards(summary: StudySummary): Flashcard[] {
  return [
    ...summary.keyTerms.map((t) => ({ front: t.term, back: t.definition, kind: "Term" as const })),
    ...summary.questions.map((q) => ({ front: q.question, back: q.answer, kind: "Question" as const })),
  ]
}

export function hasQuiz(summary: StudySummary): boolean {
  return summary.quiz.length > 0 || summary.keyTerms.length >= TERM_QUIZ_MIN_TERMS
}

/**
 * A quiz with questions and options in random order. Uses the AI-written
 * questions when the summary has them; older summaries fall back to matching
 * each key term to its definition.
 */
export function prepareQuiz(summary: StudySummary): PreparedQuestion[] {
  if (summary.quiz.length > 0) {
    return shuffle(summary.quiz).map((q) => {
      const answer = q.options[q.answerIndex]
      const options = shuffle(q.options)
      return {
        question: q.question,
        options,
        correct: options.indexOf(answer),
        explanation: q.explanation,
      }
    })
  }

  if (summary.keyTerms.length < TERM_QUIZ_MIN_TERMS) return []

  return shuffle(summary.keyTerms)
    .slice(0, TERM_QUIZ_MAX_QUESTIONS)
    .map((item) => {
      const others = shuffle(summary.keyTerms.filter((t) => t.term !== item.term)).slice(0, 3)
      const options = shuffle([item.term, ...others.map((t) => t.term)])
      return {
        question: `Which term matches this definition? “${item.definition}”`,
        options,
        correct: options.indexOf(item.term),
        explanation: `${item.term}: ${item.definition}`,
      }
    })
}
