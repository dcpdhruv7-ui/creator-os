import { NextResponse } from "next/server";

import { deliverReminderToSubscriptions } from "@/lib/reminder-delivery";
import { sendWebPushNotification, type PushSubscriptionRow } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const calendarEntryId = String(body?.calendarEntryId ?? "");

  if (!calendarEntryId) {
    return NextResponse.json(
      { error: "We could not send this reminder." },
      { status: 400 },
    );
  }

  const [preferencesResult, entryResult, subscriptionsResult] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("calendar_reminders_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("content_calendar")
      .select("id, title, platform, scheduled_date, scheduled_time")
      .eq("id", calendarEntryId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user.id)
      .eq("enabled", true),
  ]);

  if (preferencesResult.error || entryResult.error || subscriptionsResult.error) {
    console.error(
      "Manual calendar reminder lookup failed:",
      preferencesResult.error?.message ??
        entryResult.error?.message ??
        subscriptionsResult.error?.message,
    );
    return NextResponse.json(
      { error: "We could not send this reminder." },
      { status: 500 },
    );
  }

  if (preferencesResult.data?.calendar_reminders_enabled === false) {
    return NextResponse.json(
      { error: "Notifications are not enabled." },
      { status: 400 },
    );
  }

  if (!entryResult.data) {
    return NextResponse.json(
      { error: "We could not send this reminder." },
      { status: 404 },
    );
  }

  const subscriptions = (subscriptionsResult.data ?? []) as PushSubscriptionRow[];

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: "No enabled notification devices found." },
      { status: 404 },
    );
  }

  const entry = entryResult.data;
  const timeLabel = entry.scheduled_time?.slice(0, 5) ?? "soon";
  const platformLabel = entry.platform ?? "Creator OS";
  const delivery = await deliverReminderToSubscriptions({
    subscriptions,
    payload: {
        title: "Creator OS reminder",
        body: `${platformLabel} post: ${entry.title} is scheduled for ${timeLabel}.`,
        url: "/calendar",
    },
    send: sendWebPushNotification,
    disable: async (subscriptionId) => {
      await supabase
        .from("push_subscriptions")
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq("id", subscriptionId)
        .eq("user_id", user.id);
    },
  });

  if (delivery.missingConfig) {
    return NextResponse.json(
      { error: "Server notification keys are missing." },
      { status: 500 },
    );
  }

  if (delivery.sentCount === 0) {
    return NextResponse.json(
      { error: "We could not send this reminder." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    sentCount: delivery.sentCount,
    sentAt: new Date().toISOString(),
    message: "Reminder sent to your enabled devices.",
  });
}
