import { AuthShell } from "@/components/auth-shell"
import { SITE_NAME } from "@/lib/site"
import { ResetPasswordForm } from "./reset-password-form"

export const metadata = {
  title: `Choose a new password · ${SITE_NAME}`,
}

// Reached from the emailed reset link, by which point /auth/callback has
// signed the user in. proxy.ts sends anyone without a session to /login.
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  )
}
