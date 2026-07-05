import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Reset password"
      description="Password recovery placeholder wired to Supabase reset emails."
      footer={{ text: "Remembered it?", href: "/login", label: "Back to login" }}
    >
      <form action={requestPasswordReset} className="space-y-4">
        <AuthNotice error={params.error} message={params.message} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" placeholder="you@example.com" required type="email" />
        </div>
        <SubmitButton pendingText="Sending link...">Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
