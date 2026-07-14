import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { checkCalendarReminders } from "@/lib/reminder-check";
import { missingAutomaticReminderEnvironment } from "@/lib/server-environment";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type CronDependencies = {
  createAdmin: () => AdminClient | null;
  checkReminders: typeof checkCalendarReminders;
  getSecret: () => string;
  missingEnvironment: () => string[];
  now: () => Date;
};

const defaultDependencies: CronDependencies = {
  createAdmin: createAdminClient,
  checkReminders: checkCalendarReminders,
  getSecret: () => process.env.CRON_SECRET?.trim() ?? "",
  missingEnvironment: missingAutomaticReminderEnvironment,
  now: () => new Date(),
};

function secretsMatch(provided: string, expected: string) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

async function pruneSchedulerRuns(supabase: AdminClient) {
  const boundary = await supabase
    .from("notification_scheduler_runs")
    .select("started_at")
    .order("started_at", { ascending: false })
    .range(1000, 1000)
    .maybeSingle();

  if (boundary.data?.started_at) {
    await supabase
      .from("notification_scheduler_runs")
      .delete()
      .lt("started_at", boundary.data.started_at);
  }
}

export function createCronHandler(overrides: Partial<CronDependencies> = {}) {
  const dependencies = { ...defaultDependencies, ...overrides };

  return async function handleCron(request: Request) {
    const expectedSecret = dependencies.getSecret();

    if (!secretsMatch(bearerToken(request), expectedSecret)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const missingEnvironment = dependencies.missingEnvironment();

    if (missingEnvironment.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Automatic reminder server configuration is incomplete.",
          missing: missingEnvironment,
        },
        { status: 503 },
      );
    }

    const supabase = dependencies.createAdmin();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Automatic reminder service is unavailable." },
        { status: 503 },
      );
    }

    const startedAt = dependencies.now();
    const runInsert = await supabase
      .from("notification_scheduler_runs")
      .insert({ started_at: startedAt.toISOString(), status: "running" })
      .select("id")
      .single();

    if (runInsert.error || !runInsert.data?.id) {
      console.error("Scheduler execution could not be recorded.");
      return NextResponse.json(
        { ok: false, error: "Automatic reminder scheduler setup is incomplete." },
        { status: 503 },
      );
    }

    const runId = runInsert.data.id as string;

    try {
      const result = await dependencies.checkReminders({ supabase });
      const executedAt = dependencies.now().toISOString();

      if (!result.ok) {
        await supabase
          .from("notification_scheduler_runs")
          .update({
            completed_at: executedAt,
            status: "failed",
            error_message: result.error,
          })
          .eq("id", runId);

        return NextResponse.json(
          { ok: false, error: result.error, executedAt },
          { status: 500 },
        );
      }

      await supabase
        .from("notification_scheduler_runs")
        .update({
          completed_at: executedAt,
          status: "success",
          checked_count: result.checked,
          due_count: result.due,
          sent_count: result.sent,
          skipped_duplicate_count: result.skippedDuplicates,
          upcoming_count: result.upcoming,
          error_message: null,
        })
        .eq("id", runId);
      await pruneSchedulerRuns(supabase).catch(() => undefined);

      return NextResponse.json({ ...result, executedAt });
    } catch {
      const executedAt = dependencies.now().toISOString();
      console.error("Automatic reminder scheduler run failed.");
      await supabase
        .from("notification_scheduler_runs")
        .update({
          completed_at: executedAt,
          status: "failed",
          error_message: "Automatic reminder check failed",
        })
        .eq("id", runId);

      return NextResponse.json(
        { ok: false, error: "Automatic reminder check failed.", executedAt },
        { status: 500 },
      );
    }
  };
}

const handleCron = createCronHandler();

export const GET = handleCron;
export const POST = handleCron;
