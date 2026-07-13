import { sendWebPushNotification, type PushSubscriptionRow } from "@/lib/notifications";
import {
  DEFAULT_REMINDER_TIME_ZONE,
  REMINDER_LOOKBACK_MINUTES,
  REMINDER_SOON_WINDOW_MINUTES,
  addMinutes,
  dateValueInTimeZone,
  reminderTimeForPost,
} from "@/lib/reminder-time";

type SupabaseAdminClient = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>>
>;

type NotificationPreference = {
  user_id: string;
  calendar_reminders_enabled: boolean | null;
  reminder_minutes_before: number | null;
};

type CalendarEntry = {
  id: string;
  user_id: string;
  title: string;
  platform: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

type NotificationLog = {
  related_id: string | null;
  scheduled_for: string | null;
};

function logKey(entryId: string, scheduledFor: string) {
  return `${entryId}:${scheduledFor}`;
}

function isDueReminder({
  now,
  reminderAt,
  reminderMinutes,
  scheduledAt,
}: {
  now: Date;
  reminderAt: Date;
  reminderMinutes: number;
  scheduledAt: Date;
}) {
  const lookbackStart = addMinutes(now, -REMINDER_LOOKBACK_MINUTES);
  const normalDue = reminderAt <= now && reminderAt >= lookbackStart;
  const soonWindowMinutes = Math.min(
    Math.max(reminderMinutes, REMINDER_SOON_WINDOW_MINUTES),
    60,
  );
  const soonWindowEnd = addMinutes(now, soonWindowMinutes);
  const reminderAlreadyPassed = reminderAt < lookbackStart;
  const comingUpSoon = reminderAlreadyPassed && scheduledAt > now && scheduledAt <= soonWindowEnd;

  return normalDue || comingUpSoon;
}

export async function checkCalendarReminders({
  now = new Date(),
  supabase,
  userId,
}: {
  now?: Date;
  supabase: SupabaseAdminClient;
  userId?: string;
}) {
  const timeZone = process.env.CREATOR_OS_TIME_ZONE?.trim() || DEFAULT_REMINDER_TIME_ZONE;
  let preferencesQuery = supabase
    .from("notification_preferences")
    .select("user_id, calendar_reminders_enabled, reminder_minutes_before")
    .eq("calendar_reminders_enabled", true);

  if (userId) {
    preferencesQuery = preferencesQuery.eq("user_id", userId);
  }

  const { data: preferences, error: preferencesError } = await preferencesQuery;

  if (preferencesError) {
    console.error("Notification reminder preference lookup failed:", preferencesError.message);
    return { ok: false as const, error: "Reminder preferences could not be loaded" };
  }

  const activePreferences = (preferences ?? []) as NotificationPreference[];

  if (activePreferences.length === 0) {
    return { ok: true as const, checked: 0, sent: 0, skippedDuplicates: 0 };
  }

  const userIds = activePreferences.map((preference) => preference.user_id);
  const startDate = dateValueInTimeZone(addMinutes(now, -REMINDER_LOOKBACK_MINUTES), timeZone);
  const endDate = dateValueInTimeZone(addMinutes(now, 1440), timeZone);
  const [calendarResult, subscriptionsResult, logsResult] = await Promise.all([
    supabase
      .from("content_calendar")
      .select("id, user_id, title, platform, scheduled_date, scheduled_time, status")
      .in("user_id", userIds)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .neq("status", "Posted"),
    supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", userIds)
      .eq("enabled", true),
    supabase
      .from("notification_logs")
      .select("related_id, scheduled_for")
      .in("user_id", userIds)
      .eq("notification_type", "calendar_reminder"),
  ]);

  if (calendarResult.error || subscriptionsResult.error || logsResult.error) {
    console.error(
      "Notification reminder data lookup failed:",
      calendarResult.error?.message ??
        subscriptionsResult.error?.message ??
        logsResult.error?.message,
    );
    return { ok: false as const, error: "Reminder data could not be loaded" };
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();

  (subscriptionsResult.data ?? []).forEach((subscription) => {
    const row = subscription as PushSubscriptionRow & { user_id: string };
    const current = subscriptionsByUser.get(row.user_id) ?? [];
    current.push(row);
    subscriptionsByUser.set(row.user_id, current);
  });

  const loggedReminders = new Set(
    ((logsResult.data ?? []) as NotificationLog[])
      .filter((log) => log.related_id && log.scheduled_for)
      .map((log) => logKey(log.related_id!, log.scheduled_for!)),
  );

  let checked = 0;
  let sent = 0;
  let skippedDuplicates = 0;

  for (const preference of activePreferences) {
    const reminderMinutes = preference.reminder_minutes_before ?? 60;
    const userSubscriptions = subscriptionsByUser.get(preference.user_id) ?? [];

    if (userSubscriptions.length === 0) {
      continue;
    }

    const userEntries = ((calendarResult.data ?? []) as CalendarEntry[]).filter(
      (entry) => entry.user_id === preference.user_id,
    );

    for (const entry of userEntries) {
      const reminder = reminderTimeForPost(
        entry.scheduled_date,
        entry.scheduled_time,
        reminderMinutes,
        timeZone,
      );

      if (!reminder || reminder.scheduledAt <= now) {
        continue;
      }

      if (
        !isDueReminder({
          now,
          reminderAt: reminder.reminderAt,
          reminderMinutes,
          scheduledAt: reminder.scheduledAt,
        })
      ) {
        continue;
      }

      checked += 1;

      const scheduledFor = reminder.scheduledAt.toISOString();

      if (loggedReminders.has(logKey(entry.id, scheduledFor))) {
        skippedDuplicates += 1;
        continue;
      }

      const results = await Promise.allSettled(
        userSubscriptions.map((subscription) =>
          sendWebPushNotification(subscription, {
            title: "Upcoming post reminder",
            body: `${entry.platform ?? "Your"} post is planned for ${entry.scheduled_time?.slice(0, 5) ?? "soon"}.`,
            url: "/calendar",
          }),
        ),
      );

      const sentToAnyDevice = results.some(
        (result) => result.status === "fulfilled" && result.value.ok,
      );
      const status = sentToAnyDevice ? "sent" : "failed";

      const { error: logError } = await supabase.from("notification_logs").insert({
        user_id: preference.user_id,
        notification_type: "calendar_reminder",
        related_table: "content_calendar",
        related_id: entry.id,
        scheduled_for: scheduledFor,
        status,
      });

      if (logError && logError.code !== "23505") {
        console.error("Notification reminder log insert failed:", logError.message);
      }

      if (sentToAnyDevice) {
        sent += 1;
      }
    }
  }

  return { ok: true as const, checked, sent, skippedDuplicates };
}
