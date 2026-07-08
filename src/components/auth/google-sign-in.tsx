import { signInWithGoogle } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

type GoogleSignInProps = {
  source: "login" | "signup";
};

export function GoogleSignIn({ source }: GoogleSignInProps) {
  return (
    <div className="space-y-2">
      <form action={signInWithGoogle}>
        <input name="source" type="hidden" value={source} />
        <Button className="w-full" type="submit" variant="secondary">
          Continue with Google
        </Button>
      </form>
      <p className="text-sm leading-6 text-zinc-500">
        Google Sign-In must be enabled in Supabase Auth before it works.
      </p>
    </div>
  );
}
