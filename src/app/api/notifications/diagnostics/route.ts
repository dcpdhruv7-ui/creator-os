import { NextResponse } from "next/server";

import {
  dateValueInTimeZone,
  formatReminderTime,
  isCalendarEntryEligible,
  reminderTimeForPost,
} from "@/lib/reminder-time";
import {
  classifySchedulerHealth,
  schedulerHealthLabel,
  type SchedulerRun,
} from "@/lib/scheduler-status";
import {
  getReminderTimeZone,
  serverEnvironmentStatus,
} from "@/lib/server-environment";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const defaultPreferences = {
  calendar_reminders_enabled: true,
  reminder_minutes_before: 60,
};

type CalendarEntry = {
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timeZone = getReminderTimeZone();
  const today = dateValueInTimeZone(new Date(), timeZone);
  const [preferencesResult, devicesResult, calendarResult, logsResult] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("calendar_reminders_enabled, reminder_minutes_before")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("enabled", true),
    supabase
      .from("content_calendar")
      .select("scheduled_date, scheduled_time, status")
      .eq("user_id", user.id)
      .gte("scheduled_date", today),
    supabase
      .from("notification_logs")
      .select("related_id, scheduled_for, status, sent_at, created_at, attempt_count, next_retry_at")
      .eq("user_id", user.id)
      .eq("notification_type", "calendar_reminder")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (preferencesResult.error || devicesResult.error || calendarResult.error) {
    console.error("Notification diagnostics lookup failed.");
    return NextResponse.json(
      { error: "Reminder diagnostics could not be loaded" },
      { status: 500 },
    );
  }

  const preferences = preferencesResult.data ?? defaultPreferences;
  const now = new Date();
  const upcomingEntries = ((calendarResult.data ?? []) as CalendarEntry[]).filter((entry) => {
    if (!isCalendarEntryEligible(entry.status)) return false;
    const reminder = reminderTimeForPost(
      entry.scheduled_date,
      entry.scheduled_time,
      preferences.reminder_minutes_before ?? defaultPreferences.reminder_minutes_before,
      timeZone,
    );
    return Boolean(reminder && reminder.scheduledAt > now);
  });
  const nextReminder = upcomingEntries
    .map((entry) =>
      reminderTimeForPost(
        entry.scheduled_date,
        entry.scheduled_time,
        preferences.reminder_minutes_before ?? defaultPreferences.reminder_minutes_before,
        timeZone,
      ),
    )
    .filter((reminder) => reminder !== null)
    .sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime())[0];
  const reminderLogs = logsResult.error ? [] : (logsResult.data ?? []);
  const lastLog = reminderLogs[0] ?? null;

  let latestRun: SchedulerRun | null = null;
  let lastSuccessfulRun: SchedulerRun | null = null;
  let schedulerSetupReady = false;
  const admin = createAdminClient();

  if (admin) {
    const [latestResult, successResult] = await Promise.all([
      admin
        .from("notification_scheduler_runs")
        .select(
          "status, started_at, completed_at, checked_count, due_count, sent_count, skipped_duplicate_count, upcoming_count",
        )
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("notification_scheduler_runs")
        .select(
          "status, started_at, completed_at, checked_count, due_count, sent_count, skipped_duplicate_count, upcoming_count",
        )
        .eq("status", "success")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!latestResult.error && !successResult.error) {
      latestRun = latestResult.data as SchedulerRun | null;
      lastSuccessfulRun = successResult.data as SchedulerRun | null;
      schedulerSetupReady = true;
    }
  }

  const schedulerStatus = classifySchedulerHealth({ latestRun, lastSuccessfulRun, now });

  return NextResponse.json({
    calendarRemindersEnabled:
      preferences.calendar_reminders_enabled ?? defaultPreferences.calendar_reminders_enabled,
    reminderMinutesBefore:
      preferences.reminder_minutes_before ?? defaultPreferences.reminder_minutes_before,
    activeDevicesCount: devicesResult.data?.length ?? 0,
    upcomingCalendarPostsCount: upcomingEntries.length,
    nextReminderTime: nextReminder
      ? formatReminderTime(nextReminder.reminderAt, timeZone)
      : null,
    lastReminderLogStatus: lastLog?.status ?? null,
    lastReminderSent: lastLog?.sent_at
      ? formatReminderTime(new Date(lastLog.sent_at), timeZone)
      : null,
    reminderLogs,
    schedulerStatus,
    schedulerStatusLabel: schedulerHealthLabel(schedulerStatus),
    schedulerSetupReady,
    lastSchedulerCheck: latestRun?.completed_at ?? latestRun?.started_at ?? null,
    lastSuccessfulSchedulerCheck: lastSuccessfulRun?.completed_at ?? null,
    lastSchedulerResult: latestRun?.status ?? null,
    schedulerCheckedCount: latestRun?.checked_count ?? 0,
    schedulerSentCount: latestRun?.sent_count ?? 0,
    environment: serverEnvironmentStatus(),
    timeZone,
  });
}
