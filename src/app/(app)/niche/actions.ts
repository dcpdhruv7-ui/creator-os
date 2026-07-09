"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type SaveNicheState = {
  status: "idle" | "success" | "error";
  message: string;
};

const successMessage = "Niche saved. Your Creator OS profile is ready for the next layer.";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveNiche(
  _previousState: SaveNicheState,
  formData: FormData,
): Promise<SaveNicheState> {
  const nicheId = field(formData, "niche_id");
  const subNicheId = field(formData, "sub_niche_id");
  const creatorGoal = field(formData, "creator_goal");

  if (!nicheId || !subNicheId) {
    return {
      status: "error",
      message: "Choose a niche and sub-niche before saving.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Your session has expired. Please log in and try again.",
    };
  }

  const [{ data: niche, error: nicheError }, { data: subNiche, error: subNicheError }] =
    await Promise.all([
      supabase.from("niches").select("id, name").eq("id", nicheId).maybeSingle(),
      supabase
        .from("sub_niches")
        .select("id, niche_id, name")
        .eq("id", subNicheId)
        .eq("niche_id", nicheId)
        .maybeSingle(),
    ]);

  if (nicheError || subNicheError || !niche || !subNiche) {
    console.error("Niche selection validation failed:", nicheError ?? subNicheError);

    return {
      status: "error",
      message: "That niche selection is no longer available. Refresh and try again.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    primary_niche: niche.name,
  });

  if (profileError) {
    console.error("Profile niche update failed:", profileError.message);

    return {
      status: "error",
      message: "We could not save your niche right now. Please try again.",
    };
  }

  const { data: creatorProfile, error: creatorProfileReadError } = await supabase
    .from("user_creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (creatorProfileReadError) {
    console.error("Creator profile lookup failed:", creatorProfileReadError.message);

    return {
      status: "error",
      message: "Your primary niche was saved, but your creator profile could not be updated.",
    };
  }

  const creatorProfileValues = {
    niche: niche.name,
    sub_niche: subNiche.name,
    personal_brand_direction: creatorGoal || null,
  };

  const creatorProfileResult = creatorProfile
    ? await supabase
        .from("user_creator_profiles")
        .update(creatorProfileValues)
        .eq("id", creatorProfile.id)
        .eq("user_id", user.id)
    : await supabase.from("user_creator_profiles").insert({
        ...creatorProfileValues,
        user_id: user.id,
        selected_creators: [],
        best_formats: [],
      });

  if (creatorProfileResult.error) {
    console.error("Creator profile niche save failed:", creatorProfileResult.error.message);

    return {
      status: "error",
      message: "Your primary niche was saved, but your creator profile could not be updated.",
    };
  }

  revalidatePath("/niche");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: successMessage,
  };
}
