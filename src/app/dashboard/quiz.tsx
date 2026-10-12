"use client"

import { Check, X } from "lucide-react"
import { useState } from "react"
import { hasQuiz, prepareQuiz, type PreparedQuestion } from "@/lib/study"
import type { StudySummary } from "@/lib/summary"
import { cn } from "@/lib/utils"

const primaryButton =
  "h-10 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"

export function Quiz({ summary }: { summary: StudySummary }) {
  // null until started: the questions are shuffled, which can't happen in render.
  const [questions, setQuestions] = useState<PreparedQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  function start() {
    setQuestions(prepareQuiz(summary))
    setIndex(0)
    setPicked(null)
    setScore(0)
  }

  if (!hasQuiz(summary)) {
    return (
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        This summary doesn&apos;t have enough material for a quiz.
      </p>
    )
  }

  if (!questions) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 px-6 py-10 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {summary.quiz.length > 0
            ? `${summary.quiz.length} multiple-choice questions on this document.`
            : "Match each key term to its definition."}
        </p>
        <button type="button" onClick={start} className={cn("mt-5", primaryButton)}>
          Start quiz
        </button>
      </div>
    )
  }

  if (index >= questions.length) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 px-6 py-10 text-center dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Your score
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {score} of {questions.length}
        </p>
        <button type="button" onClick={start} className={cn("mt-6", primaryButton)}>
          Try again
        </button>
      </div>
    )
  }

  const current = questions[index]
  const answered = picked !== null

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Question {index + 1} of {questions.length}
      </p>
      <p className="mt-2 text-base font-medium leading-7 text-zinc-900 dark:text-zinc-50">
        {current.question}
      </p>

      <div className="mt-4 space-y-2">
        {current.options.map((option, i) => {
          const isCorrect = i === current.correct
          const isPicked = i === picked
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(i)
                if (isCorrect) setScore((value) => value + 1)
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm leading-6 transition",
                !answered &&
                  "border-zinc-200 text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600",
                answered &&
                  isCorrect &&
                  "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
                answered &&
                  isPicked &&
                  !isCorrect &&
                  "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
                answered &&
                  !isCorrect &&
                  !isPicked &&
                  "border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
              )}
            >
              <span>{option}</span>
              {answered && isCorrect && <Check className="h-4 w-4 shrink-0" aria-label="Correct answer" />}
              {answered && isPicked && !isCorrect && (
                <X className="h-4 w-4 shrink-0" aria-label="Your answer, incorrect" />
              )}
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        {answered && (
          <div className="mt-4">
            <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {picked === current.correct ? "Correct. " : "Not quite. "}
              </span>
              {current.explanation}
            </p>
            <button
              type="button"
              onClick={() => {
                setIndex((value) => value + 1)
                setPicked(null)
              }}
              className={cn("mt-4", primaryButton)}
            >
              {index + 1 === questions.length ? "See score" : "Next question"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
