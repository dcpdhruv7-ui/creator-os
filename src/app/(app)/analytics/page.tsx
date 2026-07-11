import { AlertCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  AnalyticsWorkspace,
  type AnalyticsCalendarPost,
  type AnalyticsIdea,
} from "./analytics-workspace";
import type { AnalyticsEntryPayload } from "./actions";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, ideasResult, calendarResult, analyticsResult] = await Promise.all([
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
      .from("content_calendar")
      .select("id, content_idea_id, title, platform, scheduled_date, scheduled_time, status")
      .eq("user_id", user!.id)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("analytics_entries")
      .select(
        "id, content_calendar_id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, follows_gained, notes, posted_at, created_at, updated_at",
      )
      .eq("user_id", user!.id)
      .order("posted_at", { ascending: false }),
  ]);

  if (profileResult.error || ideasResult.error || calendarResult.error || analyticsResult.error) {
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
        currentNiche={profileResult.data?.niche ?? null}
        currentSubNiche={profileResult.data?.sub_niche ?? null}
        entries={(analyticsResult.data ?? []) as AnalyticsEntryPayload[]}
        ideas={(ideasResult.data ?? []) as AnalyticsIdea[]}
      />
    </section>
  );
}
