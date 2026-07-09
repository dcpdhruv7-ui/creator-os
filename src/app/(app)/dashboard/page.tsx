import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Compass,
  Lightbulb,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const dashboardCards = [
  {
    title: "Ideas",
    description: "Generated content ideas and hooks will live in this workspace.",
    icon: Lightbulb,
  },
  {
    title: "Calendar",
    description: "Your weekly content plan will be organized here.",
    icon: CalendarDays,
  },
  {
    title: "Analytics",
    description: "Manual tracking for views, saves, reach, and engagement.",
    icon: BarChart3,
  },
  {
    title: "Recommendations",
    description: "Simple growth recommendations based on your inputs.",
    icon: Sparkles,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: creatorProfile }] = await Promise.all([
    supabase.from("profiles").select("primary_niche").eq("id", user!.id).maybeSingle(),
    supabase
      .from("user_creator_profiles")
      .select("niche, sub_niche, selected_creators, energy_style, content_tone")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const niche = creatorProfile?.niche ?? profile?.primary_niche ?? null;
  const subNiche = creatorProfile?.sub_niche ?? null;
  const inspirationCount = Array.isArray(creatorProfile?.selected_creators)
    ? creatorProfile.selected_creators.length
    : 0;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Your Creator OS
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Build your creator strategy one focused layer at a time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <Compass className="size-5" />
            </div>
            <CardTitle>My Niche</CardTitle>
            {niche ? (
              <CardDescription>
                <span className="block text-base font-medium text-zinc-100">{niche}</span>
                <span className="mt-1 block">
                  {subNiche ?? "Choose a sub-niche to refine your direction."}
                </span>
              </CardDescription>
            ) : (
              <CardDescription>
                Choose your niche to start building your creator strategy.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant={niche ? "secondary" : "default"}>
              <Link href="/niche">
                {niche ? "Edit niche" : "Set niche"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <UserRoundCog className="size-5" />
            </div>
            <CardTitle>Creator Profile</CardTitle>
            {inspirationCount > 0 ? (
              <CardDescription>
                <span className="block text-base font-medium text-zinc-100">
                  {creatorProfile?.content_tone ?? "Your creator style"}
                </span>
                <span className="mt-1 block">
                  {creatorProfile?.energy_style
                    ? `${creatorProfile.energy_style} / `
                    : ""}
                  {inspirationCount} inspiration{inspirationCount === 1 ? "" : "s"} selected
                </span>
              </CardDescription>
            ) : (
              <CardDescription>
                Choose inspiration styles to shape your Creator OS profile.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button
              asChild
              size="sm"
              variant={inspirationCount > 0 ? "secondary" : "default"}
            >
              <Link href={niche ? "/creators" : "/niche"}>
                {inspirationCount > 0 ? "Edit inspirations" : "Choose inspirations"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card className="min-h-48" key={card.title}>
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Placeholder
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
