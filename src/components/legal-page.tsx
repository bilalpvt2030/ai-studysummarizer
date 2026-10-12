import Link from "next/link"
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site"

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Link
        href="/"
        className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        {SITE_NAME}
      </Link>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Last updated {updated}</p>

      <div className="mt-10 space-y-10">
        {children}
        <LegalSection title="Contact">
          <p>
            {CONTACT_EMAIL ? (
              <>
                Questions about this page can be sent to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
                  {CONTACT_EMAIL}
                </a>
                .
              </>
            ) : (
              <>
                Questions about this page can be sent to the support address shown on the Google
                sign-in screen for {SITE_NAME}.
              </>
            )}
          </p>
        </LegalSection>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
