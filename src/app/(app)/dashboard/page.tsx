import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Captions,
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

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function weekBounds() {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: dateInputValue(start),
    end: dateInputValue(end),
    today: dateInputValue(today),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentWeek = weekBounds();
  const [
    { data: profile },
    { data: creatorProfile },
    ideasResult,
    captionsResult,
    calendarWeekResult,
    nextCalendarResult,
  ] = await Promise.all([
      supabase.from("profiles").select("primary_niche").eq("id", user!.id).maybeSingle(),
      supabase
        .from("user_creator_profiles")
        .select("niche, sub_niche, selected_creators, energy_style, content_tone")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("content_ideas")
        .select("title", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("captions")
        .select("caption_type, content_idea_id", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("content_calendar")
        .select("id", { count: "exact" })
        .eq("user_id", user!.id)
        .gte("scheduled_date", currentWeek.start)
        .lte("scheduled_date", currentWeek.end),
      supabase
        .from("content_calendar")
        .select("title, scheduled_date, scheduled_time, platform")
        .eq("user_id", user!.id)
        .gte("scheduled_date", currentWeek.today)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(1),
    ]);
  const niche = creatorProfile?.niche ?? profile?.primary_niche ?? null;
  const subNiche = creatorProfile?.sub_niche ?? null;
  const inspirationCount = Array.isArray(creatorProfile?.selected_creators)
    ? creatorProfile.selected_creators.length
    : 0;
  const ideaCount = ideasResult.count ?? 0;
  const latestIdea = ideasResult.data?.[0]?.title ?? null;
  const captionCount = captionsResult.count ?? 0;
  const latestCaptionType = captionsResult.data?.[0]?.caption_type ?? null;
  const scheduledThisWeekCount = calendarWeekResult.count ?? 0;
  const nextScheduledPost = nextCalendarResult.data?.[0] ?? null;

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

        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <Lightbulb className="size-5" />
            </div>
            <CardTitle>Ideas</CardTitle>
            <CardDescription>
              <span className="block text-base font-medium text-zinc-100">
                {ideaCount} saved idea{ideaCount === 1 ? "" : "s"}
              </span>
              <span className="mt-1 block">
                {latestIdea ?? "Generate your first set of ready-to-shoot ideas."}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant={ideaCount > 0 ? "secondary" : "default"}>
              <Link href={inspirationCount > 0 ? "/ideas" : "/creators"}>
                Generate ideas
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <Captions className="size-5" />
            </div>
            <CardTitle>Captions</CardTitle>
            <CardDescription>
              <span className="block text-base font-medium text-zinc-100">
                {captionCount} saved caption{captionCount === 1 ? "" : "s"}
              </span>
              <span className="mt-1 block">
                {latestCaptionType
                  ? `${latestCaptionType} caption saved most recently.`
                  : "Turn saved ideas into hooks, captions, CTAs, and hashtags."}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant={captionCount > 0 ? "secondary" : "default"}>
              <Link href={ideaCount > 0 ? "/captions" : "/ideas"}>
                Generate captions
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <CalendarDays className="size-5" />
            </div>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              <span className="block text-base font-medium text-zinc-100">
                {scheduledThisWeekCount} scheduled this week
              </span>
              <span className="mt-1 block">
                {nextScheduledPost
                  ? `Next: ${nextScheduledPost.title} on ${nextScheduledPost.scheduled_date} at ${nextScheduledPost.scheduled_time?.slice(0, 5) ?? "no time"}`
                  : "Plan your next saved idea into the weekly calendar."}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              size="sm"
              variant={scheduledThisWeekCount > 0 ? "secondary" : "default"}
            >
              <Link href={ideaCount > 0 ? "/calendar" : "/ideas"}>
                Open calendar
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
