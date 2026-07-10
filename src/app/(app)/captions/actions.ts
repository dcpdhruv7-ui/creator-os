"use server";

import { revalidatePath } from "next/cache";

import { captionFingerprint } from "@/lib/caption-fingerprint";
import { createClient } from "@/lib/supabase/server";

export type SavedCaptionPayload = {
  id: string;
  content_idea_id: string | null;
  relatedIdeaTitle: string;
  caption_type: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string | null;
  created_at: string | null;
};

export type SaveCaptionState = {
  status: "idle" | "success" | "error";
  message: string;
  savedCaption?: SavedCaptionPayload;
  savedCaptions?: SavedCaptionPayload[];
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveCaption(
  previousState: SaveCaptionState,
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
    .select("id, title")
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

  const { data: existingCaptions, error: duplicateError } = await supabase
    .from("captions")
    .select("id, content_idea_id, caption_type, hook, body, cta, hashtags, created_at")
    .eq("user_id", user.id)
    .eq("content_idea_id", contentIdeaId)
    .eq("caption_type", captionType);

  if (duplicateError) {
    console.error("Caption duplicate check failed:", duplicateError.message);

    return {
      status: "error",
      message: "We could not check your caption bank. Please try again.",
    };
  }

  const nextFingerprint = captionFingerprint({
    content_idea_id: contentIdeaId,
    caption_type: captionType,
    hook,
    body,
  });
  const duplicate = (existingCaptions ?? []).find(
    (caption) => captionFingerprint(caption) === nextFingerprint,
  );

  if (duplicate) {
    const savedCaption = {
      ...duplicate,
      relatedIdeaTitle: idea.title,
    };

    return {
      status: "success",
      message: "This caption is already saved.",
      savedCaption,
      savedCaptions: [savedCaption, ...(previousState.savedCaptions ?? [])],
    };
  }

  const { data: insertedCaption, error: insertError } = await supabase
    .from("captions")
    .insert({
      user_id: user.id,
      content_idea_id: contentIdeaId,
      caption_type: captionType,
      hook,
      body,
      cta,
      hashtags,
    })
    .select("id, content_idea_id, caption_type, hook, body, cta, hashtags, created_at")
    .single();

  if (insertError) {
    console.error("Caption save failed:", insertError.message);

    return {
      status: "error",
      message: "We could not save that caption. Please try again.",
    };
  }

  revalidatePath("/captions");
  revalidatePath("/dashboard");

  const savedCaption = {
    ...insertedCaption,
    relatedIdeaTitle: idea.title,
  };

  return {
    status: "success",
    message: "Caption saved to your caption bank.",
    savedCaption,
    savedCaptions: [savedCaption, ...(previousState.savedCaptions ?? [])],
  };
}
