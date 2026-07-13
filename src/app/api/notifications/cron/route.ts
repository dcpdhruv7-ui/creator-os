import { NextResponse } from "next/server";

import { checkCalendarReminders } from "@/lib/reminder-check";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const result = await checkCalendarReminders({ supabase });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
