import { NextResponse } from "next/server";

import { sendWebPushNotification, type PushSubscriptionRow } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user.id)
    .eq("enabled", true);

  if (error) {
    console.error("Push test subscription lookup failed:", error.message);
    return NextResponse.json({ error: "Test notification could not be sent" }, { status: 500 });
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ error: "No active push subscription found" }, { status: 404 });
  }

  const results = await Promise.allSettled(
    (subscriptions as PushSubscriptionRow[]).map((subscription) =>
      sendWebPushNotification(subscription, {
        title: "Creator OS notifications are on",
        body: "You'll get reminders for planned posts and content tasks.",
        url: "/calendar",
      }),
    ),
  );

  const sentCount = results.filter(
    (result) => result.status === "fulfilled" && result.value.ok,
  ).length;

  if (sentCount === 0) {
    return NextResponse.json({ error: "Push notifications are not configured yet" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentCount });
}
