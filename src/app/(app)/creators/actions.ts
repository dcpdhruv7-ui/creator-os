"use server";

import { revalidatePath } from "next/cache";

import {
  buildCreatorProfile,
  type CreatorInspiration,
} from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/server";

export type SaveCreatorState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveCreatorInspirations(
  _previousState: SaveCreatorState,
  formData: FormData,
): Promise<SaveCreatorState> {
  const creatorIds = [...new Set(formData.getAll("creator_ids").map(String))];

  if (creatorIds.length === 0) {
    return { status: "error", message: "Choose at least one inspiration before saving." };
  }

  if (creatorIds.length > 5) {
    return {
      status: "error",
      message: "Choose up to 5 inspirations for a clearer Creator OS profile.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data: creatorProfile, error: profileError } = await supabase
    .from("user_creator_profiles")
    .select("id, niche, personal_brand_direction")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (profileError || !creatorProfile?.niche) {
    return { status: "error", message: "Choose and save your niche before continuing." };
  }

  const { data: niche } = await supabase
    .from("niches")
    .select("id")
    .eq("name", creatorProfile.niche)
    .maybeSingle();

  if (!niche) {
    return { status: "error", message: "Your saved niche is no longer available." };
  }

  const { data: creators, error: creatorsError } = await supabase
    .from("creators")
    .select(
      "id, name, platform, style, content_strength, hook_style, editing_style, posting_style, audience_type, learnings",
    )
    .eq("niche_id", niche.id)
    .in("id", creatorIds);

  if (creatorsError || !creators || creators.length !== creatorIds.length) {
    console.error("Creator inspiration validation failed:", creatorsError?.message);
    return { status: "error", message: "One of those inspirations is no longer available." };
  }

  const inspirations = creators as CreatorInspiration[];
  const generatedProfile = buildCreatorProfile(creatorProfile.niche, inspirations);
  const selectedCreators = inspirations.map((creator) => ({
    id: creator.id,
    name: creator.name,
    style: creator.style,
    content_strength: creator.content_strength,
  }));

  const { error: updateError } = await supabase
    .from("user_creator_profiles")
    .update({
      selected_creators: selectedCreators,
      energy_style: generatedProfile.energyStyle,
      content_tone: generatedProfile.contentTone,
      editing_style: generatedProfile.editingStyle,
      caption_style: generatedProfile.captionStyle,
      best_formats: generatedProfile.bestFormats,
      posting_frequency: generatedProfile.postingFrequency,
      growth_angle: generatedProfile.growthAngle,
      personal_brand_direction:
        creatorProfile.personal_brand_direction || generatedProfile.personalBrandDirection,
    })
    .eq("id", creatorProfile.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Creator inspiration save failed:", updateError.message);
    return { status: "error", message: "We could not save your inspirations. Please try again." };
  }

  revalidatePath("/creators");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Inspirations saved. Your Creator OS profile has been updated.",
  };
}
