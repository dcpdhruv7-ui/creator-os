import {
  MAX_REMINDER_ATTEMPTS,
  REMINDER_RETRY_DELAY_MINUTES,
  STALE_REMINDER_CLAIM_SECONDS,
  deliverReminderToSubscriptions,
} from "@/lib/reminder-delivery";
import {
  REMINDER_LOOKBACK_MINUTES,
  addMinutes,
  dateValueInTimeZone,
  isCalendarEntryEligible,
  isReminderDue,
  reminderTimeForPost,
} from "@/lib/reminder-time";
import { sendWebPushNotification, type PushSubscriptionRow } from "@/lib/notifications";
import { getReminderTimeZone } from "@/lib/server-environment";

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

type ReminderClaim = {
  claimed: boolean;
  log_id: string | null;
  attempt_count: number;
  current_status: string | null;
};

const defaultReminderPreference = {
  calendar_reminders_enabled: true,
  reminder_minutes_before: 60,
};

function emptyResult(reason: "no_devices" | "calendar_off") {
  return {
    ok: true as const,
    checked: 0,
    sent: 0,
    skippedDuplicates: 0,
    upcoming: 0,
    due: 0,
    pastReminderCount: 0,
    reason,
  };
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
  const timeZone = getReminderTimeZone();
  let subscriptionsQuery = supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("enabled", true);

  if (userId) subscriptionsQuery = subscriptionsQuery.eq("user_id", userId);

  const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

  if (subscriptionsError) {
    console.error("Notification subscription lookup failed:", subscriptionsError.message);
    return { ok: false as const, error: "Notification devices could not be loaded" };
  }

  const subscriptionRows = (subscriptions ?? []) as Array<
    PushSubscriptionRow & { user_id: string }
  >;
  const userIds = [...new Set(subscriptionRows.map((subscription) => subscription.user_id))];

  if (userIds.length === 0) return emptyResult("no_devices");

  const { data: preferences, error: preferencesError } = await supabase
    .from("notification_preferences")
    .select("user_id, calendar_reminders_enabled, reminder_minutes_before")
    .in("user_id", userIds);

  if (preferencesError) {
    console.error("Notification reminder preference lookup failed:", preferencesError.message);
    return { ok: false as const, error: "Reminder preferences could not be loaded" };
  }

  const preferencesByUser = new Map(
    ((preferences ?? []) as NotificationPreference[]).map((preference) => [
      preference.user_id,
      preference,
    ]),
  );
  const activePreferences = userIds
    .map((id) => ({
      user_id: id,
      calendar_reminders_enabled:
        preferencesByUser.get(id)?.calendar_reminders_enabled ??
        defaultReminderPreference.calendar_reminders_enabled,
      reminder_minutes_before:
        preferencesByUser.get(id)?.reminder_minutes_before ??
        defaultReminderPreference.reminder_minutes_before,
    }))
    .filter((preference) => preference.calendar_reminders_enabled);

  if (activePreferences.length === 0) return emptyResult("calendar_off");

  const activeUserIds = activePreferences.map((preference) => preference.user_id);
  const startDate = dateValueInTimeZone(addMinutes(now, -REMINDER_LOOKBACK_MINUTES), timeZone);
  const endDate = dateValueInTimeZone(addMinutes(now, 1440), timeZone);
  const { data: calendarRows, error: calendarError } = await supabase
    .from("content_calendar")
    .select("id, user_id, title, platform, scheduled_date, scheduled_time, status")
    .in("user_id", activeUserIds)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate);

  if (calendarError) {
    console.error("Notification reminder data lookup failed:", calendarError.message);
    return { ok: false as const, error: "Reminder data could not be loaded" };
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();

  subscriptionRows.forEach((subscription) => {
    const current = subscriptionsByUser.get(subscription.user_id) ?? [];
    current.push(subscription);
    subscriptionsByUser.set(subscription.user_id, current);
  });

  let checked = 0;
  let sent = 0;
  let skippedDuplicates = 0;
  let upcoming = 0;
  let due = 0;
  let pastReminderCount = 0;

  for (const preference of activePreferences) {
    const reminderMinutes = preference.reminder_minutes_before ?? 60;
    const userSubscriptions = subscriptionsByUser.get(preference.user_id) ?? [];
    const userEntries = ((calendarRows ?? []) as CalendarEntry[]).filter(
      (entry) =>
        entry.user_id === preference.user_id && isCalendarEntryEligible(entry.status),
    );

    for (const entry of userEntries) {
      const reminder = reminderTimeForPost(
        entry.scheduled_date,
        entry.scheduled_time,
        reminderMinutes,
        timeZone,
      );

      if (!reminder || reminder.scheduledAt <= now) {
        if (reminder?.scheduledAt && reminder.scheduledAt <= now) pastReminderCount += 1;
        continue;
      }

      upcoming += 1;

      if (
        !isReminderDue({
          now,
          reminderAt: reminder.reminderAt,
          reminderMinutes,
          scheduledAt: reminder.scheduledAt,
        })
      ) {
        if (reminder.reminderAt < addMinutes(now, -REMINDER_LOOKBACK_MINUTES)) {
          pastReminderCount += 1;
        }
        continue;
      }

      checked += 1;
      due += 1;

      const scheduledFor = reminder.scheduledAt.toISOString();
      const claimToken = crypto.randomUUID();
      const { data: claimRows, error: claimError } = await supabase.rpc(
        "claim_calendar_reminder",
        {
          p_user_id: preference.user_id,
          p_related_id: entry.id,
          p_scheduled_for: scheduledFor,
          p_claim_token: claimToken,
          p_max_attempts: MAX_REMINDER_ATTEMPTS,
          p_stale_after_seconds: STALE_REMINDER_CLAIM_SECONDS,
        },
      );

      if (claimError) {
        console.error("Reminder claim failed:", claimError.message);
        return { ok: false as const, error: "Reminder delivery could not be claimed" };
      }

      const claim = ((claimRows ?? [])[0] ?? null) as ReminderClaim | null;

      if (!claim?.claimed || !claim.log_id) {
        skippedDuplicates += 1;
        continue;
      }

      const delivery = await deliverReminderToSubscriptions({
        subscriptions: userSubscriptions,
        payload: {
          title: "Upcoming post reminder",
          body: `${entry.platform ?? "Your"} post is planned for ${entry.scheduled_time?.slice(0, 5) ?? "soon"}.`,
          url: "/calendar",
        },
        send: sendWebPushNotification,
        disable: async (subscriptionId) => {
          const { error } = await supabase
            .from("push_subscriptions")
            .update({ enabled: false, updated_at: new Date().toISOString() })
            .eq("id", subscriptionId)
            .eq("user_id", preference.user_id);

          if (error) console.error("Invalid push subscription could not be disabled.");
        },
      });

      const sentToAnyDevice = delivery.sentCount > 0;
      const completedAt = new Date();
      const nextRetryAt = addMinutes(completedAt, REMINDER_RETRY_DELAY_MINUTES);
      const { error: updateError } = await supabase
        .from("notification_logs")
        .update(
          sentToAnyDevice
            ? {
                status: "sent",
                sent_at: completedAt.toISOString(),
                claimed_at: null,
                claim_token: null,
                next_retry_at: null,
                last_error: null,
              }
            : {
                status: "failed",
                sent_at: null,
                claimed_at: null,
                claim_token: null,
                next_retry_at: nextRetryAt.toISOString(),
                last_error: delivery.missingConfig
                  ? "missing_push_configuration"
                  : delivery.invalidCount === userSubscriptions.length
                    ? "no_valid_devices"
                    : "push_delivery_failed",
              },
        )
        .eq("id", claim.log_id)
        .eq("claim_token", claimToken);

      if (updateError) {
        console.error("Reminder delivery log update failed:", updateError.message);
      }

      if (sentToAnyDevice) sent += 1;
    }
  }

  return {
    ok: true as const,
    checked,
    sent,
    skippedDuplicates,
    upcoming,
    due,
    pastReminderCount,
    reason:
      sent > 0
        ? ("sent" as const)
        : due > 0
          ? ("duplicate_or_failed" as const)
          : upcoming > 0
            ? ("no_due" as const)
            : ("no_upcoming" as const),
  };
}
