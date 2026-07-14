import { createCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

const resources = ["ideas", "captions", "calendar", "analytics"] as const;
type ExportResource = (typeof resources)[number];

type ExportData = {
  headers: string[];
  rows: unknown[][];
};

function isExportResource(value: string): value is ExportResource {
  return resources.includes(value as ExportResource);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

async function exportIdeas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ExportData | { error: string }> {
  const { data, error } = await supabase
    .from("content_ideas")
    .select(
      "id, title, niche, sub_niche, hook, format, shot_list, caption_angle, difficulty, goal, status, priority, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  return {
    headers: [
      "id",
      "title",
      "niche",
      "sub_niche",
      "hook",
      "format",
      "shot_list",
      "caption_angle",
      "difficulty",
      "goal",
      "status",
      "priority",
      "created_at",
      "updated_at",
    ],
    rows: (data ?? []).map((row) => [
      row.id,
      row.title,
      row.niche,
      row.sub_niche,
      row.hook,
      row.format,
      row.shot_list,
      row.caption_angle,
      row.difficulty,
      row.goal,
      row.status,
      row.priority,
      row.created_at,
      row.updated_at,
    ]),
  };
}

async function exportCaptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ExportData | { error: string }> {
  const [{ data, error }, ideasResult] = await Promise.all([
    supabase
      .from("captions")
      .select("id, content_idea_id, caption_type, hook, body, cta, hashtags, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("content_ideas").select("id, title").eq("user_id", userId),
  ]);

  if (error || ideasResult.error) return { error: error?.message ?? ideasResult.error!.message };

  const ideaTitles = new Map((ideasResult.data ?? []).map((idea) => [idea.id, idea.title]));

  return {
    headers: [
      "id",
      "content_idea_id",
      "idea_title",
      "caption_type",
      "hook",
      "body",
      "cta",
      "hashtags",
      "created_at",
    ],
    rows: (data ?? []).map((row) => [
      row.id,
      row.content_idea_id,
      ideaTitles.get(row.content_idea_id ?? "") ?? "",
      row.caption_type,
      row.hook,
      row.body,
      row.cta,
      row.hashtags,
      row.created_at,
    ]),
  };
}

async function exportCalendar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ExportData | { error: string }> {
  const { data, error } = await supabase
    .from("content_calendar")
    .select(
      "id, content_idea_id, title, platform, scheduled_date, scheduled_time, status, notes, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("scheduled_date", { ascending: false });

  if (error) return { error: error.message };

  return {
    headers: [
      "id",
      "content_idea_id",
      "title",
      "platform",
      "scheduled_date",
      "scheduled_time",
      "status",
      "notes",
      "created_at",
      "updated_at",
    ],
    rows: (data ?? []).map((row) => [
      row.id,
      row.content_idea_id,
      row.title,
      row.platform,
      row.scheduled_date,
      row.scheduled_time,
      row.status,
      row.notes,
      row.created_at,
      row.updated_at,
    ]),
  };
}

async function exportAnalytics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ExportData | { error: string }> {
  const { data, error } = await supabase
    .from("analytics_entries")
    .select(
      "id, content_calendar_id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, follows_gained, notes, posted_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("posted_at", { ascending: false });

  if (error) return { error: error.message };

  return {
    headers: [
      "id",
      "content_calendar_id",
      "content_idea_id",
      "platform",
      "post_title",
      "niche",
      "sub_niche",
      "views",
      "likes",
      "comments",
      "shares",
      "saves",
      "reach",
      "follows_gained",
      "notes",
      "posted_at",
      "created_at",
      "updated_at",
    ],
    rows: (data ?? []).map((row) => [
      row.id,
      row.content_calendar_id,
      row.content_idea_id,
      row.platform,
      row.post_title,
      row.niche,
      row.sub_niche,
      row.views,
      row.likes,
      row.comments,
      row.shares,
      row.saves,
      row.reach,
      row.follows_gained,
      row.notes,
      row.posted_at,
      row.created_at,
      row.updated_at,
    ]),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  const { resource } = await context.params;

  if (!isExportResource(resource)) {
    return Response.json({ error: "Unknown export type" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loaders = {
    ideas: exportIdeas,
    captions: exportCaptions,
    calendar: exportCalendar,
    analytics: exportAnalytics,
  };
  const result = await loaders[resource](supabase, user.id);

  if ("error" in result) {
    console.error(`${resource} export failed:`, result.error);
    return Response.json({ error: "Your data export could not be prepared." }, { status: 500 });
  }

  return new Response(createCsv(result.headers, result.rows), {
    headers: {
      "Content-Disposition": `attachment; filename="creator-os-${resource}-${dateStamp()}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
