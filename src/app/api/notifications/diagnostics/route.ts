import { NextResponse } from "next/server";

import {
  DEFAULT_REMINDER_TIME_ZONE,
  dateValueInTimeZone,
  formatReminderTime,
  reminderTimeForPost,
} from "@/lib/reminder-time";
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

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeZone = process.env.CREATOR_OS_TIME_ZONE?.trim() || DEFAULT_REMINDER_TIME_ZONE;
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
      .gte("scheduled_date", today)
      .neq("status", "Posted"),
    supabase
      .from("notification_logs")
      .select("status, sent_at, created_at")
      .eq("user_id", user.id)
      .eq("notification_type", "calendar_reminder")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (
    preferencesResult.error ||
    devicesResult.error ||
    calendarResult.error ||
    logsResult.error
  ) {
    console.error(
      "Notification diagnostics lookup failed:",
      preferencesResult.error?.message ??
        devicesResult.error?.message ??
        calendarResult.error?.message ??
        logsResult.error?.message,
    );

    return NextResponse.json(
      { error: "Reminder diagnostics could not be loaded" },
      { status: 500 },
    );
  }

  const preferences = preferencesResult.data ?? defaultPreferences;
  const upcomingEntries = ((calendarResult.data ?? []) as CalendarEntry[]).filter((entry) => {
    const reminder = reminderTimeForPost(
      entry.scheduled_date,
      entry.scheduled_time,
      preferences.reminder_minutes_before ?? defaultPreferences.reminder_minutes_before,
      timeZone,
    );

    return Boolean(reminder && reminder.scheduledAt > new Date());
  });
  const reminders = upcomingEntries
    .map((entry) =>
      reminderTimeForPost(
        entry.scheduled_date,
        entry.scheduled_time,
        preferences.reminder_minutes_before ?? defaultPreferences.reminder_minutes_before,
        timeZone,
      ),
    )
    .filter((reminder) => reminder !== null);
  const nextReminder = reminders.sort(
    (a, b) => a.reminderAt.getTime() - b.reminderAt.getTime(),
  )[0];
  const lastLog = logsResult.data?.[0] ?? null;
  const lastSentAt = lastLog?.sent_at ?? null;

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
    lastReminderSent: lastSentAt ? formatReminderTime(new Date(lastSentAt), timeZone) : null,
  });
}
