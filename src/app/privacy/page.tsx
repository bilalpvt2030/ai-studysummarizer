import Link from "next/link"
import { LegalPage, LegalSection } from "@/components/legal-page"
import { SITE_NAME } from "@/lib/site"
import { DAILY_SUMMARY_LIMIT } from "@/lib/summary"

export const metadata = {
  title: `Privacy Policy · ${SITE_NAME}`,
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="12 October 2026">
      <LegalSection title="The short version">
        <p>
          {SITE_NAME} turns PDFs you upload into study notes. To do that it needs an account, it
          sends your PDF to Google&apos;s Gemini AI service, and it saves the resulting summary so
          you can come back to it. It has no advertising and no tracking scripts.
        </p>
      </LegalSection>

      <LegalSection title="What is collected">
        <ul>
          <li>
            <strong>Account details.</strong> If you sign in with Google: your name, email address
            and profile picture. If you sign up with email: your email address and the name you
            enter. Passwords are handled by the sign-in provider and stored in hashed form; they
            are never visible to the site.
          </li>
          <li>
            <strong>Documents you upload.</strong> The PDF is sent to Google&apos;s Gemini API to
            write the summary. It is removed from Google&apos;s file storage as soon as the summary
            comes back, and it is not stored by {SITE_NAME}.
          </li>
          <li>
            <strong>Your summaries.</strong> The summary text, its title and the name of the file
            it came from are saved to your account until you delete them.
          </li>
          <li>
            <strong>Usage records.</strong> The time of each summary you create, used to apply the
            limit of {DAILY_SUMMARY_LIMIT} summaries per day.
          </li>
          <li>
            <strong>Cookies.</strong> Only the cookies needed to keep you signed in.
          </li>
          <li>
            <strong>Server logs.</strong> The hosting provider keeps short-lived technical logs of
            requests, such as the time, the page and whether it succeeded.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Who else handles your data">
        <ul>
          <li>
            <strong>Google (Gemini API)</strong> processes each PDF you upload. This site uses the
            free tier of that service, and Google&apos;s terms for the free tier allow Google to
            use submitted content to improve its products, which can include review by people.
            Do not upload documents that are confidential or contain sensitive personal
            information.
          </li>
          <li>
            <strong>Google (sign-in)</strong> confirms who you are when you choose
            &quot;Continue with Google&quot;.
          </li>
          <li>
            <strong>Supabase</strong> stores accounts, saved summaries and usage records.
          </li>
          <li>
            <strong>Cloudflare</strong> hosts the site.
          </li>
        </ul>
        <p>Your data is not sold, and it is not shared with anyone else.</p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul>
          <li>Delete any saved summary from your dashboard at any time.</li>
          <li>
            Delete your account from the <Link href="/account" className="underline underline-offset-4">Account</Link>{" "}
            page. This permanently removes your account, your saved summaries and your usage
            records.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Children">
        <p>{SITE_NAME} is not intended for children under 13.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes, the date at the top of this page will change with it.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
