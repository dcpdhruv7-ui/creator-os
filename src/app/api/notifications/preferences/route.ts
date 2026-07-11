import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const defaultPreferences = {
  calendar_reminders_enabled: true,
  reminder_minutes_before: 60,
  workflow_reminders_enabled: true,
  weekly_summary_enabled: false,
};

function booleanField(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function reminderMinutes(value: unknown) {
  const numberValue = Number(value);

  if (![15, 30, 60, 120, 1440].includes(numberValue)) {
    return defaultPreferences.reminder_minutes_before;
  }

  return numberValue;
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
    .from("notification_preferences")
    .select(
      "calendar_reminders_enabled, reminder_minutes_before, workflow_reminders_enabled, weekly_summary_enabled",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Notification preference lookup failed:", error.message);
    return NextResponse.json(
      {
        error: "Notification preferences are not ready yet. Apply the notification migration first.",
        preferences: defaultPreferences,
        setupNeeded: true,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    preferences: data ?? defaultPreferences,
    setupNeeded: false,
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

  const body = await request.json().catch(() => ({}));
  const payload = {
    user_id: user.id,
    calendar_reminders_enabled: booleanField(
      body?.calendar_reminders_enabled,
      defaultPreferences.calendar_reminders_enabled,
    ),
    reminder_minutes_before: reminderMinutes(body?.reminder_minutes_before),
    workflow_reminders_enabled: booleanField(
      body?.workflow_reminders_enabled,
      defaultPreferences.workflow_reminders_enabled,
    ),
    weekly_summary_enabled: booleanField(
      body?.weekly_summary_enabled,
      defaultPreferences.weekly_summary_enabled,
    ),
  };

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "calendar_reminders_enabled, reminder_minutes_before, workflow_reminders_enabled, weekly_summary_enabled",
    )
    .single();

  if (error) {
    console.error("Notification preference save failed:", error.message);
    return NextResponse.json(
      { error: "Notification preferences could not be saved" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, preferences: data });
}
