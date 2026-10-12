import { Download, FileText, History, Image as ImageIcon, Layers, ListChecks } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase/config"

const STEPS = [
  {
    title: "Add your material",
    text: "Upload a PDF or a photo of your notes, or paste text straight in.",
  },
  {
    title: "Get the summary",
    text: "An overview, the key points and the key terms, at the length you choose.",
  },
  {
    title: "Test yourself",
    text: "Flip through flashcards and take a multiple-choice quiz made from your document.",
  },
]

const FEATURES = [
  {
    icon: FileText,
    title: "Summaries you can revise from",
    text: "Short, standard or detailed notes with the concrete facts kept in.",
  },
  {
    icon: Layers,
    title: "Flashcards",
    text: "Every key term and revision question becomes a card you can shuffle.",
  },
  {
    icon: ListChecks,
    title: "Quiz mode",
    text: "Five multiple-choice questions per document, with explanations.",
  },
  {
    icon: ImageIcon,
    title: "PDFs, photos and text",
    text: "Scanned pages and pictures of handwritten or printed notes work too.",
  },
  {
    icon: History,
    title: "Saved for later",
    text: "Your summaries stay in your account until you delete them.",
  },
  {
    icon: Download,
    title: "Export",
    text: "Download a summary as a Word document or save it as a PDF.",
  },
]

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6">
      <main className="w-full max-w-3xl">
        <section className="py-24 sm:py-32">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            AI Study Summarizer
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Turn dense notes into something you can actually revise.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Upload a PDF, a photo of your notes or pasted text. Get a clean summary, flashcards
            and a quiz in under a minute.
          </p>

          <div className="mt-10">
            <Suspense fallback={<CtaSkeleton />}>
              <Cta />
            </Suspense>
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              Add your Supabase keys to{" "}
              <code className="font-mono">.env.local</code> to enable sign-in.
            </p>
          )}
        </section>

        <section aria-labelledby="how-heading" className="border-t border-zinc-200 py-16 dark:border-zinc-800">
          <h2
            id="how-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-medium text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="features-heading"
          className="border-t border-zinc-200 py-16 dark:border-zinc-800"
        >
          <h2
            id="features-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            What you get
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <feature.icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {feature.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

async function Cta() {
  const user = await getCurrentUser()

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to dashboard
        </Link>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as {user.name}
        </span>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      Get started
    </Link>
  )
}

function CtaSkeleton() {
  return (
    <div className="h-11 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
  )
}
