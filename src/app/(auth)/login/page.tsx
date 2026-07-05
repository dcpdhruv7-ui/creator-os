import Link from "next/link";

import { login } from "@/app/(auth)/actions";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Log in"
      description="Return to your creator workspace."
      footer={{ text: "New here?", href: "/signup", label: "Create an account" }}
    >
      <form action={login} className="space-y-4">
        <AuthNotice error={params.error} message={params.message} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" placeholder="you@example.com" required type="email" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" required type="password" />
        </div>
        <SubmitButton pendingText="Signing in...">Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}
