"use server";

import { revalidatePath } from "next/cache";

import { encodeCalendarNotes } from "@/lib/calendar-notes";
import { createClient } from "@/lib/supabase/server";

export type CalendarEntryPayload = {
  id: string;
  content_idea_id: string | null;
  title: string;
  platform: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CalendarActionState = {
  status: "idle" | "success" | "error";
  message: string;
  entry?: CalendarEntryPayload;
  entries?: CalendarEntryPayload[];
  deletedEntryId?: string;
};

const calendarSelect =
  "id, content_idea_id, title, platform, scheduled_date, scheduled_time, status, notes, created_at, updated_at";
const platformOptions = ["Instagram", "YouTube Shorts", "TikTok", "LinkedIn", "Other"];
const statusOptions = ["Planned", "Scripted", "Shot", "Editing", "Scheduled", "Posted"];

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null };
}

function readCalendarFields(formData: FormData) {
  return {
    ideaId: String(formData.get("content_idea_id") ?? ""),
    captionId: String(formData.get("caption_id") ?? "") || null,
    scheduledDate: String(formData.get("scheduled_date") ?? ""),
    scheduledTime: String(formData.get("scheduled_time") ?? ""),
    platform: String(formData.get("platform") ?? ""),
    status: String(formData.get("status") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function validateCalendarFields(fields: ReturnType<typeof readCalendarFields>) {
  if (!fields.ideaId || !fields.scheduledDate || !fields.scheduledTime) {
    return "Choose an idea, date, and time.";
  }

  if (!platformOptions.includes(fields.platform)) {
    return "Choose a valid platform.";
  }

  if (!statusOptions.includes(fields.status)) {
    return "Choose a valid status.";
  }

  return null;
}

async function validateIdeaAndCaption(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ideaId: string,
  captionId: string | null,
) {
  const { data: idea, error: ideaError } = await supabase
    .from("content_ideas")
    .select("id, title")
    .eq("id", ideaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (ideaError || !idea) {
    return { ok: false as const, message: "Choose a saved idea first." };
  }

  if (captionId) {
    const { data: caption, error: captionError } = await supabase
      .from("captions")
      .select("id, content_idea_id")
      .eq("id", captionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (captionError || !caption || caption.content_idea_id !== idea.id) {
      return { ok: false as const, message: "Choose a caption saved for this idea." };
    }
  }

  return { ok: true as const, idea };
}

async function hasDuplicateSlot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ideaId: string,
  scheduledDate: string,
  scheduledTime: string,
  platform: string,
  exceptId?: string,
) {
  let query = supabase
    .from("content_calendar")
    .select("id")
    .eq("user_id", userId)
    .eq("content_idea_id", ideaId)
    .eq("scheduled_date", scheduledDate)
    .eq("scheduled_time", scheduledTime)
    .eq("platform", platform);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

export async function createCalendarEntry(
  _previousState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const fields = readCalendarFields(formData);
  const validationError = validateCalendarFields(fields);

  if (validationError) {
    return { status: "error", message: validationError };
  }

  const { supabase, userId } = await getUserId();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const result = await validateIdeaAndCaption(
    supabase,
    userId,
    fields.ideaId,
    fields.captionId,
  );

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  try {
    if (
      await hasDuplicateSlot(
        supabase,
        userId,
        fields.ideaId,
        fields.scheduledDate,
        fields.scheduledTime,
        fields.platform,
      )
    ) {
      return {
        status: "error",
        message: "This idea is already scheduled for that slot.",
      };
    }
  } catch (error) {
    console.error("Calendar duplicate check failed:", error);
    return { status: "error", message: "We could not check your calendar. Please try again." };
  }

  const { data, error } = await supabase
    .from("content_calendar")
    .insert({
      user_id: userId,
      content_idea_id: fields.ideaId,
      title: result.idea.title,
      platform: fields.platform,
      scheduled_date: fields.scheduledDate,
      scheduled_time: fields.scheduledTime,
      status: fields.status,
      notes: encodeCalendarNotes(fields.captionId, fields.notes),
    })
    .select(calendarSelect)
    .single();

  if (error) {
    console.error("Calendar entry create failed:", error.message);
    return { status: "error", message: "We could not schedule this post. Please try again." };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Post scheduled.",
    entry: data as CalendarEntryPayload,
  };
}

export async function updateCalendarEntry(
  _previousState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const entryId = String(formData.get("entry_id") ?? "");
  const fields = readCalendarFields(formData);
  const validationError = validateCalendarFields(fields);

  if (!entryId) {
    return { status: "error", message: "Choose a calendar entry to edit." };
  }

  if (validationError) {
    return { status: "error", message: validationError };
  }

  const { supabase, userId } = await getUserId();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const result = await validateIdeaAndCaption(
    supabase,
    userId,
    fields.ideaId,
    fields.captionId,
  );

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  try {
    if (
      await hasDuplicateSlot(
        supabase,
        userId,
        fields.ideaId,
        fields.scheduledDate,
        fields.scheduledTime,
        fields.platform,
        entryId,
      )
    ) {
      return {
        status: "error",
        message: "This idea is already scheduled for that slot.",
      };
    }
  } catch (error) {
    console.error("Calendar duplicate check failed:", error);
    return { status: "error", message: "We could not check your calendar. Please try again." };
  }

  const { data, error } = await supabase
    .from("content_calendar")
    .update({
      content_idea_id: fields.ideaId,
      title: result.idea.title,
      platform: fields.platform,
      scheduled_date: fields.scheduledDate,
      scheduled_time: fields.scheduledTime,
      status: fields.status,
      notes: encodeCalendarNotes(fields.captionId, fields.notes),
    })
    .eq("id", entryId)
    .eq("user_id", userId)
    .select(calendarSelect)
    .single();

  if (error) {
    console.error("Calendar entry update failed:", error.message);
    return { status: "error", message: "We could not update this post. Please try again." };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Calendar post updated.",
    entry: data as CalendarEntryPayload,
  };
}

export async function deleteCalendarEntry(
  _previousState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const entryId = String(formData.get("entry_id") ?? "");

  if (!entryId) {
    return { status: "error", message: "Choose a calendar entry to remove." };
  }

  const { supabase, userId } = await getUserId();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data, error } = await supabase
    .from("content_calendar")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error) {
    console.error("Calendar entry delete failed:", error.message);
    return { status: "error", message: "We could not remove this calendar post." };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Calendar post removed.",
    deletedEntryId: data.id,
  };
}

export async function saveSuggestedPlan(
  _previousState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const rawPlan = String(formData.get("suggested_plan") ?? "");
  const { supabase, userId } = await getUserId();

  if (!userId) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  let rows: Array<ReturnType<typeof readCalendarFields>>;

  try {
    const parsed = JSON.parse(rawPlan);
    rows = Array.isArray(parsed) ? parsed : [];
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    return { status: "error", message: "Create a suggested plan first." };
  }

  const savedEntries: CalendarEntryPayload[] = [];
  let skippedCount = 0;

  for (const fields of rows) {
    const validationError = validateCalendarFields(fields);

    if (validationError) {
      skippedCount += 1;
      continue;
    }

    const result = await validateIdeaAndCaption(
      supabase,
      userId,
      fields.ideaId,
      fields.captionId,
    );

    if (!result.ok) {
      skippedCount += 1;
      continue;
    }

    try {
      if (
        await hasDuplicateSlot(
          supabase,
          userId,
          fields.ideaId,
          fields.scheduledDate,
          fields.scheduledTime,
          fields.platform,
        )
      ) {
        skippedCount += 1;
        continue;
      }
    } catch {
      skippedCount += 1;
      continue;
    }

    const { data, error } = await supabase
      .from("content_calendar")
      .insert({
        user_id: userId,
        content_idea_id: fields.ideaId,
        title: result.idea.title,
        platform: fields.platform,
        scheduled_date: fields.scheduledDate,
        scheduled_time: fields.scheduledTime,
        status: fields.status,
        notes: encodeCalendarNotes(fields.captionId, fields.notes),
      })
      .select(calendarSelect)
      .single();

    if (error) {
      skippedCount += 1;
      continue;
    }

    savedEntries.push(data as CalendarEntryPayload);
  }

  if (savedEntries.length === 0) {
    return {
      status: "error",
      message:
        skippedCount > 0
          ? "Suggested posts could not be saved because they already exist or need changes."
          : "Create a suggested plan first.",
    };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message:
      skippedCount > 0
        ? "Plan saved. Some duplicate or incomplete posts were skipped."
        : "Weekly plan saved.",
    entries: savedEntries,
  };
}
