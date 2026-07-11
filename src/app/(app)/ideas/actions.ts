"use server";

import { revalidatePath } from "next/cache";

import {
  generateAdaptiveIdeas,
  type GeneratedIdea,
  type IdeaProfile,
} from "@/lib/content-ideas";
import { createClient } from "@/lib/supabase/server";

export type SavedIdeaPayload = {
  id: string;
  title: string;
  hook: string | null;
  niche: string | null;
  sub_niche: string | null;
  format: string | null;
  shot_list: string | null;
  caption_angle: string | null;
  difficulty: string | null;
  goal: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
};

export type SaveIdeasState = {
  status: "idle" | "success" | "error";
  message: string;
  savedIdeaKeys?: string[];
  savedIdeaTitles?: string[];
  savedIdeas?: SavedIdeaPayload[];
  duplicateIdeas?: SavedIdeaPayload[];
  skippedIdeaTitles?: string[];
};

export type DeleteIdeasState = {
  status: "idle" | "success" | "error";
  message: string;
  deletedIdeaIds?: string[];
};

const allowedStatuses = ["Idea", "Scripted", "Shot", "Editing", "Scheduled", "Posted"];
const allowedPriorities = ["Low", "Medium", "High"];
const savedIdeaSelect =
  "id, title, hook, niche, sub_niche, format, shot_list, caption_angle, difficulty, goal, status, priority, created_at";

function isGeneratedIdea(value: unknown): value is GeneratedIdea {
  if (!value || typeof value !== "object") {
    return false;
  }

  const idea = value as Record<string, unknown>;

  return (
    typeof idea.key === "string" &&
    typeof idea.title === "string" &&
    typeof idea.hook === "string" &&
    typeof idea.creative_angle === "string" &&
    typeof idea.niche === "string" &&
    typeof idea.sub_niche === "string" &&
    typeof idea.format === "string" &&
    typeof idea.shot_list === "string" &&
    typeof idea.caption_angle === "string" &&
    typeof idea.difficulty === "string" &&
    typeof idea.goal === "string" &&
    typeof idea.priority === "string" &&
    idea.status === "Idea"
  );
}

function parseSelectedIdeas(formData: FormData) {
  const rawIdeas = String(formData.get("selected_ideas") ?? "");

  if (!rawIdeas) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawIdeas);

    return Array.isArray(parsed) ? parsed.filter(isGeneratedIdea) : [];
  } catch {
    return [];
  }
}

function selectedCreatorNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) =>
    item &&
    typeof item === "object" &&
    "name" in item &&
    typeof item.name === "string"
      ? [item.name]
      : [],
  );
}

async function getIdeaProfile(): Promise<
  | { ok: true; profile: IdeaProfile; userId: string }
  | { ok: false; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Your session has expired. Please log in again." };
  }

  const { data } = await supabase
    .from("user_creator_profiles")
    .select(
      "niche, sub_niche, selected_creators, energy_style, content_tone, editing_style, caption_style, growth_angle",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.niche || !data.sub_niche) {
    return { ok: false, message: "Choose and save your niche before generating ideas." };
  }

  const creatorNames = selectedCreatorNames(data.selected_creators);

  if (creatorNames.length === 0) {
    return { ok: false, message: "Choose your creator inspirations before generating ideas." };
  }

  return {
    ok: true,
    userId: user.id,
    profile: {
      niche: data.niche,
      subNiche: data.sub_niche,
      selectedCreatorNames: creatorNames,
      energyStyle: data.energy_style ?? "Confident and adaptable",
      contentTone: data.content_tone ?? "Clear and authentic",
      editingStyle: data.editing_style ?? "Clean, focused edits",
      captionStyle: data.caption_style ?? "Concise captions with a clear takeaway",
      growthAngle: data.growth_angle ?? "Build recognition through consistency.",
    },
  };
}

export async function saveGeneratedIdeas(
  _previousState: SaveIdeasState,
  formData: FormData,
): Promise<SaveIdeasState> {
  const selectedKeys = [...new Set(formData.getAll("idea_keys").map(String))];
  const submittedIdeas = parseSelectedIdeas(formData);

  if (selectedKeys.length === 0 && submittedIdeas.length === 0) {
    return { status: "error", message: "Select at least one idea to save." };
  }

  const result = await getIdeaProfile();

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  const fallbackIdeas = generateAdaptiveIdeas(result.profile, { count: 250 }).filter((idea) =>
    selectedKeys.includes(idea.key),
  );
  const submittedKeySet = new Set<string>();
  const ideas = submittedIdeas.length > 0 ? submittedIdeas : fallbackIdeas;
  const validIdeas = ideas.filter((idea) => {
    submittedKeySet.add(idea.key);

    return idea.niche === result.profile.niche && idea.sub_niche === result.profile.subNiche;
  });
  const skippedCount = Math.max(0, selectedKeys.length - validIdeas.length);

  if (validIdeas.length === 0) {
    return {
      status: "error",
      message: "Your generated ideas changed. Please select again.",
    };
  }

  const supabase = await createClient();
  const { data: existingIdeas, error: existingError } = await supabase
    .from("content_ideas")
    .select(savedIdeaSelect)
    .eq("user_id", result.userId)
    .in(
      "title",
      validIdeas.map((idea) => idea.title),
    );

  if (existingError) {
    console.error("Saved idea duplicate check failed:", existingError.message);
    return { status: "error", message: "We could not check your idea bank. Please try again." };
  }

  const existingTitles = new Set((existingIdeas ?? []).map((idea) => idea.title));
  const newIdeas = validIdeas.filter((idea) => !existingTitles.has(idea.title));
  let insertedIdeas: SavedIdeaPayload[] = [];

  if (newIdeas.length > 0) {
    const { data: insertedData, error: insertError } = await supabase
      .from("content_ideas")
      .insert(
        newIdeas.map((idea) => ({
          user_id: result.userId,
          title: idea.title,
          niche: idea.niche,
          sub_niche: idea.sub_niche,
          hook: idea.hook,
          format: idea.format,
          shot_list: idea.shot_list,
          caption_angle: idea.caption_angle,
          difficulty: idea.difficulty,
          goal: idea.goal,
          status: idea.status,
          priority: idea.priority,
        })),
      )
      .select(savedIdeaSelect);

    if (insertError) {
      console.error("Content idea save failed:", insertError.message);
      return { status: "error", message: "We could not save your ideas. Please try again." };
    }

    insertedIdeas = (insertedData ?? []) as SavedIdeaPayload[];
  }

  revalidatePath("/ideas");
  revalidatePath("/dashboard");

  const duplicateIdeas = (existingIdeas ?? []) as SavedIdeaPayload[];
  const skippedIdeaTitles = duplicateIdeas.map((idea) => idea.title);
  const message =
    skippedCount > 0 && insertedIdeas.length > 0
      ? "Saved available ideas. Some changed ideas were skipped."
      : skippedCount > 0
        ? "Your generated ideas changed. Please select again."
        : insertedIdeas.length > 0 && duplicateIdeas.length > 0
      ? "Ideas saved to your idea bank. Fresh ideas added. Some ideas were already saved."
      : insertedIdeas.length > 0
        ? "Ideas saved to your idea bank. Fresh ideas added."
        : "Some ideas were already saved.";

  return {
    status: "success",
    message,
    savedIdeaKeys: newIdeas.map((idea) => idea.key),
    savedIdeaTitles: newIdeas.map((idea) => idea.title),
    savedIdeas: insertedIdeas,
    duplicateIdeas,
    skippedIdeaTitles,
  };
}

export async function updateSavedIdea(formData: FormData) {
  const ideaId = String(formData.get("idea_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");

  if (
    !ideaId ||
    !allowedStatuses.includes(status) ||
    !allowedPriorities.includes(priority)
  ) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("content_ideas")
    .update({ status, priority })
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Content idea update failed:", error.message);
    return;
  }

  revalidatePath("/ideas");
}

export async function deleteSavedIdeas(
  _previousState: DeleteIdeasState,
  formData: FormData,
): Promise<DeleteIdeasState> {
  const ideaIds = [...new Set(formData.getAll("idea_ids").map(String).filter(Boolean))];

  if (ideaIds.length === 0) {
    return { status: "error", message: "Select at least one saved idea to delete." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data, error } = await supabase
    .from("content_ideas")
    .delete()
    .eq("user_id", user.id)
    .in("id", ideaIds)
    .select("id");

  if (error) {
    console.error("Content idea delete failed:", error.message);
    return { status: "error", message: "We could not delete those ideas. Please try again." };
  }

  const deletedIdeaIds = (data ?? []).map((idea) => idea.id);

  if (deletedIdeaIds.length === 0) {
    return { status: "error", message: "No matching saved ideas were deleted." };
  }

  revalidatePath("/ideas");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message:
      deletedIdeaIds.length === 1
        ? "Saved idea deleted."
        : `${deletedIdeaIds.length} saved ideas deleted.`,
    deletedIdeaIds,
  };
}
