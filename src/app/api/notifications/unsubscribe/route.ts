import { NextResponse } from "next/server";

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
  const endpoint = String(body?.endpoint ?? "");

  let query = supabase
    .from("push_subscriptions")
    .update({ enabled: false })
    .eq("user_id", user.id);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  const { error } = await query;

  if (error) {
    console.error("Push unsubscribe failed:", error.message);
    return NextResponse.json({ error: "Subscription could not be disabled" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
