import { signup } from "@/app/(auth)/actions";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Create account"
      description="Start with the foundation for your niche and creator profile."
      footer={{ text: "Already have an account?", href: "/login", label: "Log in" }}
    >
      <form action={signup} className="space-y-4">
        <AuthNotice error={params.error} message={params.message} />
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" placeholder="Your name" type="text" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" placeholder="you@example.com" required type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" required type="password" />
        </div>
        <SubmitButton pendingText="Creating account...">Sign up</SubmitButton>
        <p className="text-sm leading-6 text-zinc-500">
          For testing, if signup email is rate-limited, wait and try again or use an existing
          account.
        </p>
      </form>
    </AuthShell>
  );
}
