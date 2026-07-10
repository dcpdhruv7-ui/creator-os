"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type SaveCaptionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveCaption(
  _previousState: SaveCaptionState,
  formData: FormData,
): Promise<SaveCaptionState> {
  const contentIdeaId = field(formData, "content_idea_id");
  const captionType = field(formData, "caption_type");
  const hook = field(formData, "hook");
  const body = field(formData, "body");
  const cta = field(formData, "cta");
  const hashtags = field(formData, "hashtags");

  if (!contentIdeaId || !captionType || !hook || !body) {
    return {
      status: "error",
      message: "Choose an idea and generated caption before saving.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data: idea, error: ideaError } = await supabase
    .from("content_ideas")
    .select("id")
    .eq("id", contentIdeaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ideaError || !idea) {
    console.error("Caption idea validation failed:", ideaError?.message);

    return {
      status: "error",
      message: "That saved idea is no longer available.",
    };
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("captions")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_idea_id", contentIdeaId)
    .eq("caption_type", captionType)
    .eq("body", body)
    .limit(1)
    .maybeSingle();

  if (duplicateError) {
    console.error("Caption duplicate check failed:", duplicateError.message);

    return {
      status: "error",
      message: "We could not check your caption bank. Please try again.",
    };
  }

  if (duplicate) {
    return {
      status: "success",
      message: "That caption is already in your caption bank.",
    };
  }

  const { error: insertError } = await supabase.from("captions").insert({
    user_id: user.id,
    content_idea_id: contentIdeaId,
    caption_type: captionType,
    hook,
    body,
    cta,
    hashtags,
  });

  if (insertError) {
    console.error("Caption save failed:", insertError.message);

    return {
      status: "error",
      message: "We could not save that caption. Please try again.",
    };
  }

  revalidatePath("/captions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Caption saved to your caption bank.",
  };
}
