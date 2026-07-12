"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#060807] text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.13),transparent_30%),linear-gradient(180deg,#090b0a,#050505)]" />
      <aside className="fixed left-0 top-0 hidden h-dvh w-72 border-r border-white/10 bg-black/35 px-4 py-5 backdrop-blur xl:block">
        <Link className="flex min-h-11 touch-manipulation items-center gap-3 px-2" href="/dashboard">
          <span className="flex size-10 items-center justify-center rounded-md bg-emerald-400 text-base font-black text-zinc-950">
            CO
          </span>
          <span>
            <span className="block text-lg font-semibold leading-5">Creator OS</span>
            <span className="text-xs text-zinc-500">Niche strategy workspace</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                className={cn(
                  "flex h-11 touch-manipulation items-center gap-3 rounded-md px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-50",
                  isActive && "bg-emerald-400/12 text-emerald-200",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4">
          <div className="mb-3 truncate rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-400">
            {userEmail ?? "Signed in"}
          </div>
          <form action={logout}>
            <Button className="w-full justify-start" type="submit" variant="secondary">
              <LogOut />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-sm md:px-6 xl:bg-black/40 xl:px-8 xl:backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link className="flex min-h-11 touch-manipulation items-center gap-3 xl:hidden" href="/dashboard">
              <span className="flex size-9 items-center justify-center rounded-md bg-emerald-400 text-sm font-black text-zinc-950">
                CO
              </span>
              <span className="text-base font-semibold">Creator OS</span>
            </Link>
            <div className="hidden xl:block">
              <p className="text-sm text-zinc-500">Creator OS</p>
              <h1 className="text-xl font-semibold tracking-normal">Your strategy workspace</h1>
            </div>
            <form action={logout}>
              <Button aria-label="Logout" size="sm" type="submit" variant="ghost">
                <LogOut />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 md:px-6 xl:px-8 xl:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_28px_rgba(0,0,0,0.35)] xl:hidden">
        <div className="flex touch-pan-x gap-1 overflow-x-auto overscroll-x-contain px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                aria-label={item.title}
                className={cn(
                  "flex h-14 min-w-[4.75rem] touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium text-zinc-500 transition-colors active:bg-white/[0.08] active:text-zinc-100 hover:text-zinc-100",
                  isActive && "bg-emerald-400/12 text-emerald-200",
                )}
                draggable={false}
                href={item.href}
                key={item.href}
                prefetch
              >
                <Icon className="size-4" />
                <span className="max-w-full truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
