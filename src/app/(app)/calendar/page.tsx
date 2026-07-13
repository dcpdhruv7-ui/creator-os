import Link from "next/link";
import { AlertCircle, ArrowRight, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getVapidPublicKey, hasPushConfig } from "@/lib/notifications";
import {
  CalendarWorkspace,
  type CalendarCaption,
  type CalendarIdea,
} from "./calendar-workspace";
import type { CalendarEntryPayload } from "./actions";

export default async function CalendarPage() {
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
      .select("id, title, hook, niche, sub_niche, format, difficulty, goal, status, priority")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("captions")
      .select("id, content_idea_id, caption_type, hook, body, cta, hashtags")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("content_calendar")
      .select(
        "id, content_idea_id, title, platform, scheduled_date, scheduled_time, status, notes, created_at, updated_at",
      )
      .eq("user_id", user!.id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true }),
  ]);

  if (profileResult.error || ideasResult.error || captionsResult.error || calendarResult.error) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          We could not load your calendar workspace. Refresh and try again.
        </div>
      </section>
    );
  }

  const ideas = (ideasResult.data ?? []) as CalendarIdea[];

  if (ideas.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Lightbulb />
            </div>
            <CardTitle>Save content ideas first</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/ideas">
                Go to Ideas
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Content calendar</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Plan your posting week
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Schedule your saved ideas and captions into a simple weekly content plan.
        </p>
      </div>

      <CalendarWorkspace
        captions={(captionsResult.data ?? []) as CalendarCaption[]}
        currentNiche={profileResult.data?.niche ?? null}
        currentSubNiche={profileResult.data?.sub_niche ?? null}
        ideas={ideas}
        initialEntries={(calendarResult.data ?? []) as CalendarEntryPayload[]}
        pushConfigured={hasPushConfig()}
        vapidPublicKey={getVapidPublicKey()}
      />
    </section>
  );
}
