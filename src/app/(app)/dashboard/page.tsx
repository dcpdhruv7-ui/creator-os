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

import { NotificationOptInCard } from "@/components/notification-opt-in-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVapidPublicKey, hasPushConfig } from "@/lib/notifications";
import {
  buildRecommendationInsights,
  type RecommendationAnalyticsEntry,
  type RecommendationCalendarEntry,
  type RecommendationCaption,
  type RecommendationIdea,
} from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";

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
    analyticsResult,
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
      supabase
        .from("analytics_entries")
        .select("post_title, views", { count: "exact" })
        .eq("user_id", user!.id)
        .order("views", { ascending: false })
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
  const analyticsCount = analyticsResult.count ?? 0;
  const bestAnalyticsPost = analyticsResult.data?.[0] ?? null;
  const totalViews =
    analyticsCount > 0
      ? (
          await supabase
            .from("analytics_entries")
            .select("views")
            .eq("user_id", user!.id)
        ).data?.reduce((sum, entry) => sum + (entry.views ?? 0), 0) ?? 0
      : 0;
  const [recommendationIdeas, recommendationCaptions, recommendationCalendar, recommendationAnalytics] =
    await Promise.all([
      supabase
        .from("content_ideas")
        .select(
          "id, title, niche, sub_niche, format, hook, shot_list, caption_angle, difficulty, goal, status, priority",
        )
        .eq("user_id", user!.id),
      supabase
        .from("captions")
        .select("id, content_idea_id, caption_type, hook, body, cta, hashtags")
        .eq("user_id", user!.id),
      supabase
        .from("content_calendar")
        .select("id, content_idea_id, title, platform, scheduled_date, scheduled_time, status")
        .eq("user_id", user!.id),
      supabase
        .from("analytics_entries")
        .select(
          "id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, posted_at, created_at",
        )
        .eq("user_id", user!.id),
    ]);
  const recommendationInsights = buildRecommendationInsights({
    profile: creatorProfile
      ? {
          niche: creatorProfile.niche ?? null,
          sub_niche: creatorProfile.sub_niche ?? null,
          selected_creators: creatorProfile.selected_creators,
        }
      : null,
    ideas: (recommendationIdeas.data ?? []) as RecommendationIdea[],
    captions: (recommendationCaptions.data ?? []) as RecommendationCaption[],
    calendarEntries: (recommendationCalendar.data ?? []) as RecommendationCalendarEntry[],
    analyticsEntries: ((recommendationAnalytics.data ?? []) as Partial<RecommendationAnalyticsEntry>[]).map(
      (entry) => ({
        id: entry.id ?? "",
        content_idea_id: entry.content_idea_id ?? null,
        platform: entry.platform ?? null,
        post_title: entry.post_title ?? null,
        niche: entry.niche ?? null,
        sub_niche: entry.sub_niche ?? null,
        views: entry.views ?? 0,
        likes: entry.likes ?? 0,
        comments: entry.comments ?? 0,
        shares: entry.shares ?? 0,
        saves: entry.saves ?? 0,
        reach: entry.reach ?? 0,
        follows_gained: entry.follows_gained ?? 0,
        posted_at: entry.posted_at ?? null,
        created_at: entry.created_at ?? null,
      }),
    ),
  });

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

      <NotificationOptInCard
        className="mb-6"
        pushConfigured={hasPushConfig()}
        vapidPublicKey={getVapidPublicKey()}
      />

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

        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <BarChart3 className="size-5" />
            </div>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              <span className="block text-base font-medium text-zinc-100">
                {analyticsCount} tracked post{analyticsCount === 1 ? "" : "s"}
              </span>
              <span className="mt-1 block">
                {analyticsCount > 0
                  ? `${totalViews.toLocaleString()} total views. Best: ${bestAnalyticsPost?.post_title ?? "Untitled post"}`
                  : "Manually track views, likes, saves, and engagement."}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant={analyticsCount > 0 ? "secondary" : "default"}>
              <Link href="/analytics">
                Open analytics
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-48 border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <Sparkles className="size-5" />
            </div>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              <span className="block text-base font-medium text-zinc-100">
                {recommendationInsights.score}/100 readiness
              </span>
              <span className="mt-1 block">{recommendationInsights.scoreLabel}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              {recommendationInsights.topRecommendations.slice(0, 2).map((item) => (
                <p className="text-sm leading-5 text-zinc-400" key={item.title}>
                  {item.title}
                </p>
              ))}
              {recommendationInsights.topRecommendations.length === 0 ? (
                <p className="text-sm leading-5 text-zinc-400">
                  Add a little more data to unlock specific next moves.
                </p>
              ) : null}
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/recommendations">
                Open recommendations
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
