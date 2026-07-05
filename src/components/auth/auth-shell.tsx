import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: {
    text: string;
    href: string;
    label: string;
  };
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),linear-gradient(135deg,#050505,#111113_52%,#07130f)] px-4 py-8 text-zinc-50">
      <div className="w-full max-w-md">
        <div className="mb-7">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-300">
            Creator OS
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white">
            Build your content strategy.
          </h1>
        </div>
        <Card className="bg-black/45 backdrop-blur">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        <p className="mt-5 text-center text-sm text-zinc-400">
          {footer.text}{" "}
          <Link className="font-medium text-emerald-300 hover:text-emerald-200" href={footer.href}>
            {footer.label}
          </Link>
        </p>
      </div>
    </main>
  );
}
