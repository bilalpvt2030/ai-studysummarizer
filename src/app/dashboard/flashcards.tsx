"use client"

import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react"
import { useState } from "react"
import { buildFlashcards, shuffle } from "@/lib/study"
import type { StudySummary } from "@/lib/summary"

export function Flashcards({ summary }: { summary: StudySummary }) {
  const [cards, setCards] = useState(() => buildFlashcards(summary))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (cards.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        This summary has no key terms or questions to make flashcards from.
      </p>
    )
  }

  const card = cards[index]

  function go(step: number) {
    setIndex((current) => (current + step + cards.length) % cards.length)
    setFlipped(false)
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setFlipped((current) => !current)}
        aria-label={flipped ? "Show the front of the card" : "Show the answer"}
        className="flex min-h-52 w-full flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center outline-none transition hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-50/20"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {flipped ? "Answer" : card.kind}
        </span>
        <span
          aria-live="polite"
          className={
            flipped
              ? "mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300"
              : "mt-4 text-lg font-medium leading-7 text-zinc-900 dark:text-zinc-50"
          }
        >
          {flipped ? card.back : card.front}
        </span>
        <span className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
          {flipped ? "Click to see the front" : "Click to reveal the answer"}
        </span>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setCards(shuffle(cards))
            setIndex(0)
            setFlipped(false)
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
          Shuffle
        </button>

        <div className="flex items-center gap-2">
          <NavButton label="Previous card" onClick={() => go(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </NavButton>
          <span className="min-w-16 text-center text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
            {index + 1} of {cards.length}
          </span>
          <NavButton label="Next card" onClick={() => go(1)}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </NavButton>
        </div>
      </div>
    </div>
  )
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
    >
      {children}
    </button>
  )
}
