import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Captions,
  Check,
  Compass,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PostInsightDetail } from "@/components/post-insight-drawer";
import {
  buildRecommendationInsights,
  type CreatorProfileSummary,
  type Recommendation,
  type RecommendationAnalyticsEntry,
  type RecommendationCalendarEntry,
  type RecommendationCaption,
  type RecommendationIdea,
  type RecommendationPriority,
  type RecommendationScope,
} from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { RecommendationActionButton, RecommendationCard } from "./recommendation-card";

const analyticsSelect =
  "id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, follows_gained, notes, posted_at, created_at";
const baseAnalyticsSelect =
  "id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, posted_at, created_at";

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    (message.includes("column") && message.includes("does not exist")) ||
    (message.includes("could not find") && message.includes("schema cache"))
  );
}

function priorityClass(priority: RecommendationPriority) {
  switch (priority) {
    case "High":
      return "border-red-300/20 bg-red-400/10 text-red-100";
    case "Medium":
      return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    case "Low":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }
}

function RecommendationSection({
  title,
  description,
  items,
  empty,
  postDetails,
}: {
  title: string;
  description: string;
  items: Recommendation[];
  empty: string;
  postDetails: Record<string, PostInsightDetail>;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      {items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <RecommendationCard
              item={item}
              key={`${item.category}-${item.title}`}
              postDetails={postDetails}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-5 text-sm text-zinc-400">{empty}</CardContent>
        </Card>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

type DirectionOption = {
  key: string;
  label: string;
  niche: string;
  subNiche: string | null;
  sourceCount: number;
};

function directionKey(niche: string, subNiche: string | null) {
  return `${encodeURIComponent(niche)}::${encodeURIComponent(subNiche ?? "")}`;
}

function addDirection(
  directions: Map<string, DirectionOption>,
  niche: string | null,
  subNiche: string | null,
) {
  if (!niche) {
    return;
  }

  const key = directionKey(niche, subNiche);
  const current = directions.get(key);

  directions.set(key, {
    key,
    label: `${niche} / ${subNiche ?? "General"}`,
    niche,
    subNiche,
    sourceCount: (current?.sourceCount ?? 0) + 1,
  });
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ scope?: string; direction?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedScope = resolvedSearchParams?.scope;
  const requestedDirection = resolvedSearchParams?.direction;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, ideasResult, captionsResult, calendarResult] = await Promise.all([
    supabase
      .from("user_creator_profiles")
      .select("niche, sub_niche, selected_creators")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_ideas")
      .select(
        "id, title, niche, sub_niche, format, hook, shot_list, caption_angle, difficulty, goal, status, priority",
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("captions")
      .select("id, content_idea_id, caption_type, hook, body, cta, hashtags")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("content_calendar")
      .select("id, content_idea_id, title, platform, scheduled_date, scheduled_time, status")
      .eq("user_id", user!.id)
      .order("scheduled_date", { ascending: true }),
  ]);
  let analyticsResult: {
    data: Partial<RecommendationAnalyticsEntry>[] | null;
    error: { code?: string; message?: string } | null;
  } = await supabase
    .from("analytics_entries")
    .select(analyticsSelect)
    .eq("user_id", user!.id)
    .order("posted_at", { ascending: false });

  if (isMissingColumnError(analyticsResult.error)) {
    analyticsResult = await supabase
      .from("analytics_entries")
      .select(baseAnalyticsSelect)
      .eq("user_id", user!.id)
      .order("posted_at", { ascending: false });
  }

  if (
    profileResult.error ||
    ideasResult.error ||
    captionsResult.error ||
    calendarResult.error ||
    analyticsResult.error
  ) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          We could not load your recommendations. Refresh and try again.
        </div>
      </section>
    );
  }

  const profile = (profileResult.data ?? null) as CreatorProfileSummary | null;
  const normalizedAnalyticsEntries = (analyticsResult.data ?? []).map((entry) => ({
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
    notes: entry.notes ?? null,
  }));
  const ideas = (ideasResult.data ?? []) as RecommendationIdea[];
  const captions = (captionsResult.data ?? []) as RecommendationCaption[];
  const calendarEntries = (calendarResult.data ?? []) as RecommendationCalendarEntry[];
  const directionsByKey = new Map<string, DirectionOption>();

  addDirection(directionsByKey, profile?.niche ?? null, profile?.sub_niche ?? null);
  ideas.forEach((idea) => addDirection(directionsByKey, idea.niche ?? null, idea.sub_niche ?? null));
  normalizedAnalyticsEntries.forEach((entry) =>
    addDirection(directionsByKey, entry.niche ?? null, entry.sub_niche ?? null),
  );

  const directionOptions = Array.from(directionsByKey.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const selectedDirection = requestedDirection
    ? directionsByKey.get(requestedDirection)
    : undefined;
  const scope: RecommendationScope =
    requestedScope === "all"
      ? "all"
      : requestedScope === "unlinked"
        ? "unlinked"
        : requestedScope === "direction" && selectedDirection
          ? "selected"
          : "current";
  const activeProfile: CreatorProfileSummary | null =
    scope === "selected" && selectedDirection
      ? {
          niche: selectedDirection.niche,
          sub_niche: selectedDirection.subNiche,
          selected_creators: profile?.selected_creators ?? [],
        }
      : profile;
  const insights = buildRecommendationInsights({
    profile: activeProfile,
    ideas,
    captions,
    calendarEntries,
    analyticsEntries: normalizedAnalyticsEntries,
    scope,
  });
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea]));
  const firstCaptionByIdeaId = new Map<string, RecommendationCaption>();

  captions.forEach((caption) => {
    if (caption.content_idea_id && !firstCaptionByIdeaId.has(caption.content_idea_id)) {
      firstCaptionByIdeaId.set(caption.content_idea_id, caption);
    }
  });

  const postDetails = Object.fromEntries(
    normalizedAnalyticsEntries.map((entry) => {
      const idea = entry.content_idea_id ? ideaById.get(entry.content_idea_id) : null;
      const caption = entry.content_idea_id
        ? firstCaptionByIdeaId.get(entry.content_idea_id) ?? null
        : null;

      return [
        entry.id,
        {
          entry,
          idea: idea
            ? {
                id: idea.id,
                title: idea.title,
                niche: idea.niche,
                sub_niche: idea.sub_niche,
                format: idea.format,
              }
            : null,
          caption: caption
            ? {
                id: caption.id,
                content_idea_id: caption.content_idea_id,
                caption_type: caption.caption_type,
                hook: caption.hook,
                body: caption.body,
                cta: caption.cta,
                hashtags: caption.hashtags,
              }
            : null,
        },
      ];
    }),
  ) satisfies Record<string, PostInsightDetail>;
  const hasAnyData =
    insights.counts.ideas +
      insights.counts.captions +
      insights.counts.calendarEntries +
      insights.counts.analyticsEntries >
    0;

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Recommendations</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          What should you create next?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Creator OS studies your ideas, captions, calendar, and analytics to suggest your next
          best moves.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.025] p-4">
        <p className="text-sm font-medium text-white">Recommendation scope</p>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Use scopes when you manage multiple creator pages, brands, or content directions.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant={scope === "current" ? "default" : "secondary"}>
            <Link href="/recommendations">Current niche</Link>
          </Button>
          <Button asChild size="sm" variant={scope === "all" ? "default" : "secondary"}>
            <Link href="/recommendations?scope=all">All niches</Link>
          </Button>
          <Button asChild size="sm" variant={scope === "unlinked" ? "default" : "secondary"}>
            <Link href="/recommendations?scope=unlinked">Unlinked analytics</Link>
          </Button>
        </div>
        {directionOptions.length > 1 ? (
          <form
            action="/recommendations"
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <input name="scope" type="hidden" value="direction" />
            <label className="flex-1 text-xs font-medium text-zinc-500">
              Choose niche / direction
              <select
                className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                defaultValue={
                  scope === "selected" && selectedDirection ? selectedDirection.key : ""
                }
                name="direction"
              >
                <option value="" disabled>
                  Select a content direction
                </option>
                {directionOptions.map((direction) => (
                  <option key={direction.key} value={direction.key}>
                    {direction.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="secondary">
              View direction
              <ArrowRight />
            </Button>
          </form>
        ) : null}
        <span className="text-sm text-zinc-500">
          {scope === "current"
            ? `Focused on ${profile?.niche ?? "your current niche"}${profile?.sub_niche ? ` / ${profile.sub_niche}` : ""}.`
            : scope === "selected" && selectedDirection
              ? `Viewing ${selectedDirection.label} recommendations.`
              : scope === "unlinked"
                ? "Viewing unlinked analytics that need assignment."
                : "Viewing all niches grouped by content direction."}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
        <Card className="border-emerald-300/20">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Sparkles />
            </div>
            <CardTitle className="text-xl">Creator OS readiness</CardTitle>
            <CardDescription>
              A simple motivational score based on how complete your content system is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold text-white">{insights.score}</span>
              <span className="pb-2 text-sm text-zinc-500">/ 100</span>
            </div>
            <p className="mt-2 text-base font-medium text-emerald-200">{insights.scoreLabel}</p>
            <div className="mt-5 space-y-2">
              {insights.scoreBreakdown.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2"
                  key={item.label}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        item.complete
                          ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
                          : "border-white/10 text-zinc-600",
                      )}
                    >
                      {item.complete ? <Check className="size-3" /> : null}
                    </span>
                    <span className="truncate text-sm text-zinc-300">{item.label}</span>
                  </div>
                  <span className="text-xs text-zinc-500">+{item.points}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-300/20">
          <CardHeader>
            <CardTitle className="text-xl">Top moves right now</CardTitle>
            <CardDescription>
              The highest-priority recommendations from your current Creator OS data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.topRecommendations.length > 0 ? (
              <div className="space-y-3">
                {insights.topRecommendations.slice(0, 4).map((item) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[0.025] p-4"
                    key={`${item.category}-${item.title}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          priorityClass(item.priority),
                        )}
                      >
                        {item.priority}
                      </span>
                      <span className="text-xs text-zinc-500">{item.category}</span>
                    </div>
                    <p className="mt-2 font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{item.explanation}</p>
                    {item.drilldownEntryId || (item.actionHref && item.actionLabel) ? (
                      <div className="mt-3">
                        <RecommendationActionButton item={item} postDetails={postDetails} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                <p className="font-medium text-white">Creator OS needs a little more data.</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Start with the setup path below and your recommendations will become more
                  specific.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Saved ideas" value={insights.counts.ideas} />
        <StatCard label="Saved captions" value={insights.counts.captions} />
        <StatCard label="This week" value={insights.counts.scheduledThisWeek} />
        <StatCard
          label={
            scope === "current" || scope === "selected"
              ? "Assigned analytics"
              : scope === "unlinked"
                ? "Unlinked analytics"
                : "Analytics"
          }
          value={
            scope === "current" || scope === "selected"
              ? insights.counts.currentNicheAnalyticsEntries
              : insights.counts.analyticsEntries
          }
        />
        <StatCard label="Posted" value={insights.counts.postedEntries} />
        <StatCard label="Inspirations" value={insights.counts.inspirationCount} />
      </div>

      {(scope === "current" || scope === "selected") &&
      insights.counts.analyticsEntries > 0 &&
      insights.counts.currentNicheAnalyticsEntries === 0 ? (
        <div className="mt-5 rounded-lg border border-emerald-300/15 bg-emerald-400/[0.06] p-4 text-sm leading-6 text-emerald-100">
          {profile?.sub_niche ?? profile?.niche ?? "This niche"} has no assigned analytics yet.
          You have {insights.counts.analyticsEntries} tracked posts that are not assigned to this
          niche. Assign them to improve recommendations.
        </div>
      ) : null}

      {insights.counts.unlinkedAnalyticsEntries > 0 ? (
        <Card className="mt-5 border-amber-300/20">
          <CardHeader>
            <CardTitle>Unlinked manual analytics</CardTitle>
            <CardDescription>
              These tracked posts are not connected to a niche yet. Assign them to improve
              recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-300">
                {insights.counts.unlinkedAnalyticsEntries} unlinked entr
                {insights.counts.unlinkedAnalyticsEntries === 1 ? "y" : "ies"}
              </p>
              <Button asChild size="sm" variant="secondary">
                <Link href="/analytics">
                  Review in Analytics
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {scope === "all" && insights.analyticsGroups.length > 0 ? (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Analytics groups</CardTitle>
            <CardDescription>
              All-niches analytics are grouped by assigned niche. Unlinked entries stay separate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insights.analyticsGroups.map((group) => (
                <div
                  className={cn(
                    "rounded-lg border p-3",
                    group.unlinked
                      ? "border-amber-300/20 bg-amber-400/10"
                      : "border-white/10 bg-white/[0.025]",
                  )}
                  key={group.label}
                >
                  <p className="text-sm font-medium text-white">{group.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {group.count} tracked post{group.count === 1 ? "" : "s"} /{" "}
                    {group.views.toLocaleString()} views
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!hasAnyData ? (
        <section className="mt-10">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">
              Creator OS needs a little more data.
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Follow this starter path to unlock stronger recommendations.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insights.emptyPath.map((item, index) => (
              <Card key={item.title}>
                <CardHeader>
                  <p className="text-sm font-medium text-emerald-300">Step {index + 1}</p>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.explanation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={item.actionHref ?? "/dashboard"}>
                      {item.actionLabel}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10 space-y-10">
        <RecommendationSection
          description="A clear action list for this week."
          empty="Your weekly action plan will appear as your content system fills in."
          items={insights.weeklyActions}
          postDetails={postDetails}
          title="Weekly action plan"
        />
        <RecommendationSection
          description="Signals from manually tracked views, saves, reach, and engagement."
          empty="Track at least 3 posts to unlock stronger performance recommendations."
          items={insights.performance}
          postDetails={postDetails}
          title="Content performance recommendations"
        />
        <RecommendationSection
          description="Gaps between ideas, captions, calendar, and analytics."
          empty="No major content gaps found in this view."
          items={insights.contentGaps}
          postDetails={postDetails}
          title="Content gap recommendations"
        />
        <RecommendationSection
          description="Rule-based directions for what to create next."
          empty="Save ideas and track results to unlock next content directions."
          items={insights.nextIdeas}
          postDetails={postDetails}
          title="Next idea recommendations"
        />
        <RecommendationSection
          description="Platform-agnostic guidance based only on your manual data."
          empty="Track posts across platforms before comparing platform performance."
          items={insights.platforms}
          postDetails={postDetails}
          title="Platform recommendations"
        />
        <RecommendationSection
          description="Calendar rhythm, posted status, and cleanup reminders."
          empty="Your consistency recommendations will appear after scheduling posts."
          items={insights.consistency}
          postDetails={postDetails}
          title="Consistency recommendations"
        />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-4">
        <Button asChild variant="secondary">
          <Link href="/ideas">
            <Lightbulb />
            Go to Ideas
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/captions">
            <Captions />
            Go to Captions
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/calendar">
            <CalendarDays />
            Go to Calendar
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/analytics">
            <BarChart3 />
            Go to Analytics
          </Link>
        </Button>
      </div>

      {!profile?.niche ? (
        <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 size-4 shrink-0" />
            Choose your niche first so recommendations can focus on your creator direction.
          </div>
        </div>
      ) : null}
    </section>
  );
}
