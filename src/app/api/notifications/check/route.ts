import { NextResponse } from "next/server";

import { checkCalendarReminders } from "@/lib/reminder-check";
import { serverEnvironmentStatus } from "@/lib/server-environment";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const environment = serverEnvironmentStatus();
  const missingPushKeys = [
    environment.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    environment.VAPID_PRIVATE_KEY,
    environment.VAPID_SUBJECT,
    environment.SUPABASE_SERVICE_ROLE_KEY,
  ].some((status) => status === "Missing");

  if (missingPushKeys) {
    return NextResponse.json(
      { code: "server_push_keys_missing", error: "Server push keys are missing." },
      { status: 503 },
    );
  }

  const [devicesResult, preferencesResult] = await Promise.all([
    supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .limit(1),
    supabase
      .from("notification_preferences")
      .select("calendar_reminders_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (devicesResult.error || preferencesResult.error) {
    return NextResponse.json(
      { error: "Reminder setup could not be checked." },
      { status: 500 },
    );
  }

  if (!devicesResult.data?.length) {
    return NextResponse.json({
      ok: true,
      checked: 0,
      due: 0,
      sent: 0,
      upcoming: 0,
      pastReminderCount: 0,
      reason: "no_devices",
      message: "No enabled devices found.",
    });
  }

  if (preferencesResult.data?.calendar_reminders_enabled === false) {
    return NextResponse.json({
      ok: true,
      checked: 0,
      due: 0,
      sent: 0,
      upcoming: 0,
      pastReminderCount: 0,
      reason: "calendar_off",
      message: "Calendar reminders are off.",
    });
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { code: "server_push_keys_missing", error: "Server push keys are missing." },
      { status: 503 },
    );
  }

  const result = await checkCalendarReminders({ supabase: admin, userId: user.id });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const message =
    result.sent > 0
      ? `Checked ${result.upcoming || result.checked} upcoming posts. Sent ${result.sent} reminder${result.sent === 1 ? "" : "s"}.`
      : result.upcoming > 0
        ? "No reminders due yet."
        : "No upcoming scheduled posts found.";

  return NextResponse.json({ ...result, message });
}
