import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Browser";

  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Safari/") && !userAgent.includes("Chrome/")
        ? "Safari"
        : userAgent.includes("Firefox/")
          ? "Firefox"
          : "Browser";
  const device = /Android|iPhone|iPad|Mobile/i.test(userAgent) ? "Mobile" : "Desktop";

  return `${browser} on ${device}`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, user_agent, device_label, enabled, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Push device lookup failed:", error.message);
    return NextResponse.json({ error: "Notification devices could not be loaded" }, { status: 500 });
  }

  return NextResponse.json({
    devices: (data ?? []).map((subscription) => ({
      id: subscription.id,
      endpoint: subscription.endpoint,
      label: subscription.device_label ?? deviceLabel(subscription.user_agent),
      enabled: subscription.enabled,
      created_at: subscription.created_at,
      last_used_at: subscription.last_used_at,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const endpoint = String(body?.endpoint ?? "");
  const p256dh = String(body?.keys?.p256dh ?? "");
  const auth = String(body?.keys?.auth ?? "");
  const userAgent = request.headers.get("user-agent");

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
      device_label: deviceLabel(userAgent),
      enabled: true,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.error("Push subscribe failed:", error.message);
    return NextResponse.json({ error: "Subscription could not be saved" }, { status: 500 });
  }

  const { error: preferencesError } = await supabase.from("notification_preferences").insert({
    user_id: user.id,
    calendar_reminders_enabled: true,
    reminder_minutes_before: 60,
    workflow_reminders_enabled: true,
    weekly_summary_enabled: false,
  });

  if (preferencesError && preferencesError.code !== "23505") {
    console.error("Default notification preferences create failed:", preferencesError.message);
  }

  return NextResponse.json({ ok: true });
}
