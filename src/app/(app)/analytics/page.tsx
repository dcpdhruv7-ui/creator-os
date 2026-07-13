import { AlertCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  AnalyticsWorkspace,
  type AnalyticsCaption,
  type AnalyticsCalendarPost,
  type AnalyticsIdea,
} from "./analytics-workspace";
import type { AnalyticsEntryPayload } from "./actions";

const analyticsSelect =
  "id, content_calendar_id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, follows_gained, notes, posted_at, created_at, updated_at";
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

function normalizeEntry(entry: Partial<AnalyticsEntryPayload>): AnalyticsEntryPayload {
  return {
    id: entry.id ?? "",
    content_calendar_id: entry.content_calendar_id ?? null,
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
    notes: entry.notes ?? null,
    posted_at: entry.posted_at ?? null,
    created_at: entry.created_at ?? null,
    updated_at: entry.updated_at ?? null,
  };
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, ideasResult, captionsResult, calendarResult] = await Promise.all([
    supabase
      .from("user_creator_profiles")
      .select("niche, sub_niche")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_ideas")
      .select("id, title, niche, sub_niche, format")
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
      .order("scheduled_date", { ascending: false }),
  ]);
  let analyticsResult: {
    data: Partial<AnalyticsEntryPayload>[] | null;
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
          We could not load your analytics tracker. Refresh and try again.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Analytics tracker</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Track what is working
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Add your post results manually and understand which ideas, formats, and platforms perform best.
        </p>
      </div>

      <AnalyticsWorkspace
        calendarPosts={(calendarResult.data ?? []) as AnalyticsCalendarPost[]}
        captions={(captionsResult.data ?? []) as AnalyticsCaption[]}
        currentNiche={profileResult.data?.niche ?? null}
        currentSubNiche={profileResult.data?.sub_niche ?? null}
        entries={((analyticsResult.data ?? []) as Partial<AnalyticsEntryPayload>[]).map(
          normalizeEntry,
        )}
        ideas={(ideasResult.data ?? []) as AnalyticsIdea[]}
      />
    </section>
  );
}
