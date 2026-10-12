import { Suspense } from "react"
import { AuthShell } from "@/components/auth-shell"
import { SetupNotice } from "@/components/setup-notice"
import { SITE_NAME } from "@/lib/site"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata = {
  title: `Reset your password · ${SITE_NAME}`,
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      {isSupabaseConfigured ? (
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      ) : (
        <SetupNotice />
      )}
    </AuthShell>
  )
}
