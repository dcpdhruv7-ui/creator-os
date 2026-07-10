"use server";

import { revalidatePath } from "next/cache";

import {
  generateAdaptiveIdeas,
  type IdeaProfile,
} from "@/lib/content-ideas";
import { createClient } from "@/lib/supabase/server";

export type SaveIdeasState = {
  status: "idle" | "success" | "error";
  message: string;
  savedIdeaKeys?: string[];
  savedIdeaTitles?: string[];
};

const allowedStatuses = ["Idea", "Scripted", "Shot", "Editing", "Scheduled", "Posted"];
const allowedPriorities = ["Low", "Medium", "High"];

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

  if (selectedKeys.length === 0) {
    return { status: "error", message: "Select at least one idea to save." };
  }

  const result = await getIdeaProfile();

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  const ideas = generateAdaptiveIdeas(result.profile, { count: 100 }).filter((idea) =>
    selectedKeys.includes(idea.key),
  );

  if (ideas.length !== selectedKeys.length) {
    return { status: "error", message: "One of the selected ideas is no longer available." };
  }

  const supabase = await createClient();
  const { data: existingIdeas, error: existingError } = await supabase
    .from("content_ideas")
    .select("title")
    .eq("user_id", result.userId)
    .in(
      "title",
      ideas.map((idea) => idea.title),
    );

  if (existingError) {
    console.error("Saved idea duplicate check failed:", existingError.message);
    return { status: "error", message: "We could not check your idea bank. Please try again." };
  }

  const existingTitles = new Set((existingIdeas ?? []).map((idea) => idea.title));
  const newIdeas = ideas.filter((idea) => !existingTitles.has(idea.title));

  if (newIdeas.length > 0) {
    const { error: insertError } = await supabase.from("content_ideas").insert(
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
    );

    if (insertError) {
      console.error("Content idea save failed:", insertError.message);
      return { status: "error", message: "We could not save your ideas. Please try again." };
    }
  }

  revalidatePath("/ideas");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message:
      newIdeas.length > 0
        ? "Ideas saved. Fresh ideas added to your generator."
        : "Those ideas are already in your idea bank.",
    savedIdeaKeys: newIdeas.map((idea) => idea.key),
    savedIdeaTitles: newIdeas.map((idea) => idea.title),
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
