import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function countOrNull(result: { count: number | null; error: unknown }) {
  return result.error ? null : (result.count ?? 0);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    profileResult,
    creatorProfileResult,
    ideasResult,
    captionsResult,
    calendarResult,
    analyticsResult,
    devicesResult,
    reminderLogResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_ideas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("captions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("content_calendar")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("analytics_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("enabled", true),
    supabase
      .from("notification_logs")
      .select("status, sent_at, created_at")
      .eq("user_id", user.id)
      .eq("notification_type", "calendar_reminder")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const environment =
    process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "local");
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.npm_package_version ??
    "Unavailable";
  const lastReminderLog = reminderLogResult.error ? null : reminderLogResult.data;

  return NextResponse.json({
    authSessionActive: true,
    profileExists: profileResult.error ? null : Boolean(profileResult.data),
    creatorProfileExists: creatorProfileResult.error
      ? null
      : Boolean(creatorProfileResult.data),
    savedIdeasCount: countOrNull(ideasResult),
    savedCaptionsCount: countOrNull(captionsResult),
    calendarPostsCount: countOrNull(calendarResult),
    analyticsEntriesCount: countOrNull(analyticsResult),
    notificationDevicesCount: countOrNull(devicesResult),
    lastReminderLogStatus: lastReminderLog
      ? `${lastReminderLog.status ?? "Unknown"}${lastReminderLog.sent_at ? ` at ${lastReminderLog.sent_at}` : ""}`
      : null,
    appEnvironment: environment,
    appVersion: version,
  });
}
