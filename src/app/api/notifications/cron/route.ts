import { NextResponse } from "next/server";

import { sendWebPushNotification, type PushSubscriptionRow } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

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

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const urlSecret = new URL(request.url).searchParams.get("secret");

  return bearerToken === cronSecret || urlSecret === cronSecret;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calendarEntryDate(entry: CalendarEntry) {
  if (!entry.scheduled_date || !entry.scheduled_time) {
    return null;
  }

  return new Date(`${entry.scheduled_date}T${entry.scheduled_time}`);
}

function minutesUntil(date: Date, now: Date) {
  return Math.round((date.getTime() - now.getTime()) / 60000);
}

function logKey(entryId: string, scheduledFor: string) {
  return `${entryId}:${scheduledFor}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for notification cron jobs" },
      { status: 500 },
    );
  }

  const now = new Date();
  const maxReminderDate = addMinutes(now, 1440);
  const { data: preferences, error: preferencesError } = await supabase
    .from("notification_preferences")
    .select("user_id, calendar_reminders_enabled, reminder_minutes_before")
    .eq("calendar_reminders_enabled", true);

  if (preferencesError) {
    console.error("Notification cron preference lookup failed:", preferencesError.message);
    return NextResponse.json({ error: "Reminder preferences could not be loaded" }, { status: 500 });
  }

  const activePreferences = (preferences ?? []) as NotificationPreference[];

  if (activePreferences.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, sent: 0 });
  }

  const userIds = activePreferences.map((preference) => preference.user_id);
  const [calendarResult, subscriptionsResult, logsResult] = await Promise.all([
    supabase
      .from("content_calendar")
      .select("id, user_id, title, platform, scheduled_date, scheduled_time, status")
      .in("user_id", userIds)
      .gte("scheduled_date", dateValue(now))
      .lte("scheduled_date", dateValue(maxReminderDate))
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
      "Notification cron data lookup failed:",
      calendarResult.error?.message ??
        subscriptionsResult.error?.message ??
        logsResult.error?.message,
    );
    return NextResponse.json({ error: "Reminder data could not be loaded" }, { status: 500 });
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();

  (subscriptionsResult.data ?? []).forEach((subscription) => {
    const userId = (subscription as PushSubscriptionRow & { user_id: string }).user_id;
    const current = subscriptionsByUser.get(userId) ?? [];
    current.push(subscription as PushSubscriptionRow);
    subscriptionsByUser.set(userId, current);
  });

  const loggedReminders = new Set(
    ((logsResult.data ?? []) as NotificationLog[])
      .filter((log) => log.related_id && log.scheduled_for)
      .map((log) => logKey(log.related_id!, log.scheduled_for!)),
  );

  let checked = 0;
  let sent = 0;

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
      const scheduledAt = calendarEntryDate(entry);

      if (!scheduledAt) {
        continue;
      }

      const minutesAway = minutesUntil(scheduledAt, now);
      const isDue = minutesAway <= reminderMinutes && minutesAway >= reminderMinutes - 10;

      if (!isDue) {
        continue;
      }

      checked += 1;
      const scheduledFor = scheduledAt.toISOString();

      if (loggedReminders.has(logKey(entry.id, scheduledFor))) {
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

      await supabase.from("notification_logs").insert({
        user_id: preference.user_id,
        notification_type: "calendar_reminder",
        related_table: "content_calendar",
        related_id: entry.id,
        scheduled_for: scheduledFor,
        status,
      });

      if (sentToAnyDevice) {
        sent += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, checked, sent });
}
