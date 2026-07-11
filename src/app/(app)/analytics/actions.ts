"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AnalyticsEntryPayload = {
  id: string;
  content_calendar_id: string | null;
  content_idea_id: string | null;
  platform: string | null;
  post_title: string | null;
  niche: string | null;
  sub_niche: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  follows_gained: number | null;
  notes: string | null;
  posted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AnalyticsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  entry?: AnalyticsEntryPayload;
  deletedEntryId?: string;
};

const analyticsSelect =
  "id, content_calendar_id, content_idea_id, platform, post_title, niche, sub_niche, views, likes, comments, shares, saves, reach, follows_gained, notes, posted_at, created_at, updated_at";
const platforms = ["Instagram", "YouTube Shorts", "TikTok", "LinkedIn", "Other"];

function stringField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function intField(formData: FormData, name: string) {
  const value = Number(stringField(formData, name) || 0);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null };
}

async function hasCalendarAnalytics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  calendarId: string,
  exceptId?: string,
) {
  let query = supabase
    .from("analytics_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("content_calendar_id", calendarId);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

async function resolveLinkedContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  calendarId: string | null,
  ideaId: string | null,
) {
  let calendar:
    | {
        id: string;
        title: string;
        platform: string | null;
        scheduled_date: string | null;
        content_idea_id: string | null;
      }
    | null = null;
  let idea:
    | {
        id: string;
        title: string;
        niche: string | null;
        sub_niche: string | null;
        format: string | null;
      }
    | null = null;

  if (calendarId) {
    const { data, error } = await supabase
      .from("content_calendar")
      .select("id, title, platform, scheduled_date, content_idea_id")
      .eq("id", calendarId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false as const, message: "Choose a scheduled post you own." };
    }

    calendar = data;
  }

  const resolvedIdeaId = ideaId || calendar?.content_idea_id || null;

  if (resolvedIdeaId) {
    const { data, error } = await supabase
      .from("content_ideas")
      .select("id, title, niche, sub_niche, format")
      .eq("id", resolvedIdeaId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false as const, message: "Choose a saved idea you own." };
    }

    idea = data;
  }

  return { ok: true as const, calendar, idea };
}

function readPayload(formData: FormData) {
  const platform = stringField(formData, "platform");

  return {
    entryId: stringField(formData, "entry_id"),
    calendarId: stringField(formData, "content_calendar_id") || null,
    ideaId: stringField(formData, "content_idea_id") || null,
    platform,
    postedAt: stringField(formData, "posted_at") || null,
    postTitle: stringField(formData, "post_title"),
    views: intField(formData, "views"),
    likes: intField(formData, "likes"),
    comments: intField(formData, "comments"),
    shares: intField(formData, "shares"),
    saves: intField(formData, "saves"),
    reach: intField(formData, "reach"),
    followsGained: intField(formData, "follows_gained"),
    notes: stringField(formData, "notes") || null,
  };
}

function validatePayload(payload: ReturnType<typeof readPayload>) {
  if (!platforms.includes(payload.platform)) {
    return "Choose a valid platform.";
  }

  return null;
}

export async function createAnalyticsEntry(
  _previousState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  const payload = readPayload(formData);
  const validationError = validatePayload(payload);

  if (validationError) {
    return { status: "error", message: validationError };
  }

  const { supabase, userId } = await getUserContext();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const linked = await resolveLinkedContent(
    supabase,
    userId,
    payload.calendarId,
    payload.ideaId,
  );

  if (!linked.ok) {
    return { status: "error", message: linked.message };
  }

  try {
    if (payload.calendarId && (await hasCalendarAnalytics(supabase, userId, payload.calendarId))) {
      return {
        status: "error",
        message: "This post already has analytics. Edit the existing entry instead.",
      };
    }
  } catch (error) {
    console.error("Analytics duplicate check failed:", error);
    return { status: "error", message: "We could not check your analytics. Please try again." };
  }

  const { calendar, idea } = linked;
  const { data, error } = await supabase
    .from("analytics_entries")
    .insert({
      user_id: userId,
      content_calendar_id: calendar?.id ?? null,
      content_idea_id: idea?.id ?? null,
      platform: payload.platform || calendar?.platform || "Instagram",
      post_title: payload.postTitle || calendar?.title || idea?.title || "Manual analytics entry",
      niche: idea?.niche ?? null,
      sub_niche: idea?.sub_niche ?? null,
      views: payload.views,
      likes: payload.likes,
      comments: payload.comments,
      shares: payload.shares,
      saves: payload.saves,
      reach: payload.reach,
      follows_gained: payload.followsGained,
      notes: payload.notes,
      posted_at: payload.postedAt || calendar?.scheduled_date || null,
    })
    .select(analyticsSelect)
    .single();

  if (error) {
    console.error("Analytics create failed:", error.message);
    return { status: "error", message: "We could not save analytics. Please try again." };
  }

  revalidatePath("/analytics");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Analytics entry saved.",
    entry: data as AnalyticsEntryPayload,
  };
}

export async function updateAnalyticsEntry(
  _previousState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  const payload = readPayload(formData);
  const validationError = validatePayload(payload);

  if (!payload.entryId) {
    return { status: "error", message: "Choose an analytics entry to edit." };
  }

  if (validationError) {
    return { status: "error", message: validationError };
  }

  const { supabase, userId } = await getUserContext();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const linked = await resolveLinkedContent(
    supabase,
    userId,
    payload.calendarId,
    payload.ideaId,
  );

  if (!linked.ok) {
    return { status: "error", message: linked.message };
  }

  try {
    if (
      payload.calendarId &&
      (await hasCalendarAnalytics(supabase, userId, payload.calendarId, payload.entryId))
    ) {
      return {
        status: "error",
        message: "This post already has analytics. Edit the existing entry instead.",
      };
    }
  } catch (error) {
    console.error("Analytics duplicate check failed:", error);
    return { status: "error", message: "We could not check your analytics. Please try again." };
  }

  const { calendar, idea } = linked;
  const { data, error } = await supabase
    .from("analytics_entries")
    .update({
      content_calendar_id: calendar?.id ?? null,
      content_idea_id: idea?.id ?? null,
      platform: payload.platform || calendar?.platform || "Instagram",
      post_title: payload.postTitle || calendar?.title || idea?.title || "Manual analytics entry",
      niche: idea?.niche ?? null,
      sub_niche: idea?.sub_niche ?? null,
      views: payload.views,
      likes: payload.likes,
      comments: payload.comments,
      shares: payload.shares,
      saves: payload.saves,
      reach: payload.reach,
      follows_gained: payload.followsGained,
      notes: payload.notes,
      posted_at: payload.postedAt || calendar?.scheduled_date || null,
    })
    .eq("id", payload.entryId)
    .eq("user_id", userId)
    .select(analyticsSelect)
    .single();

  if (error) {
    console.error("Analytics update failed:", error.message);
    return { status: "error", message: "We could not update analytics. Please try again." };
  }

  revalidatePath("/analytics");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Analytics entry updated.",
    entry: data as AnalyticsEntryPayload,
  };
}

export async function deleteAnalyticsEntry(
  _previousState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  const entryId = stringField(formData, "entry_id");

  if (!entryId) {
    return { status: "error", message: "Choose an analytics entry to delete." };
  }

  const { supabase, userId } = await getUserContext();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data, error } = await supabase
    .from("analytics_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Analytics delete failed:", error?.message);
    return { status: "error", message: "We could not delete that analytics entry." };
  }

  revalidatePath("/analytics");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Analytics entry deleted.",
    deletedEntryId: data.id,
  };
}
