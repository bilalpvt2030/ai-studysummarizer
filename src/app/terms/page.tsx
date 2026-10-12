import Link from "next/link"
import { LegalPage, LegalSection } from "@/components/legal-page"
import { SITE_NAME } from "@/lib/site"
import { DAILY_SUMMARY_LIMIT } from "@/lib/summary"

export const metadata = {
  title: `Terms of Service · ${SITE_NAME}`,
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="12 October 2026">
      <LegalSection title="Using the service">
        <p>
          {SITE_NAME} lets you upload PDFs and get AI-written study notes. By creating an account
          or using the site you agree to these terms and to the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Summaries are written by AI">
        <p>
          Summaries, key terms and questions are generated automatically and can be wrong,
          incomplete or out of date. Check anything important against the original document. They
          are a study aid, not professional, academic or medical advice.
        </p>
      </LegalSection>

      <LegalSection title="What you may upload">
        <ul>
          <li>Only upload documents you have the right to use.</li>
          <li>Do not upload unlawful content, or documents containing other people&apos;s sensitive personal information.</li>
          <li>
            Uploads are processed by a third-party AI service, as described in the Privacy Policy,
            so do not upload confidential material.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Fair use">
        <ul>
          <li>
            Each account can create up to {DAILY_SUMMARY_LIMIT} summaries per day, and PDFs can be
            up to 8 MB. These limits may change.
          </li>
          <li>
            Do not use automated tools to create accounts or summaries, or try to get around the
            limits.
          </li>
          <li>Accounts that abuse the service may be suspended or removed.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You keep all rights to the documents you upload and to your summaries. You can delete
          your summaries or your whole account at any time.
        </p>
      </LegalSection>

      <LegalSection title="No guarantees">
        <p>
          The service is provided as it is, free of charge, without any warranty. It may be slow
          or unavailable at times, and it may change or stop altogether. To the extent the law
          allows, the operator of {SITE_NAME} is not liable for any loss resulting from use of
          the service or from reliance on a summary.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If these terms change, the date at the top of this page will change with them.
          Continuing to use the site after a change means you accept the new terms.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
