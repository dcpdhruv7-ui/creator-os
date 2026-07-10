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

export type DeleteCaptionState = {
  status: "idle" | "success" | "error";
  message: string;
  deletedCaptionIds?: string[];
};

export type ClearCaptionsState = {
  status: "idle" | "success" | "error";
  message: string;
  deletedCaptionIds?: string[];
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
    .eq("content_idea_id", contentIdeaId);

  if (duplicateError) {
    console.error("Caption duplicate check failed:", duplicateError.message);

    return {
      status: "error",
      message: "We could not check your caption bank. Please try again.",
    };
  }

  const nextFingerprint = captionFingerprint({
    content_idea_id: contentIdeaId,
    hook,
    body,
    cta,
    hashtags,
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

export async function deleteCaption(
  previousState: DeleteCaptionState,
  formData: FormData,
): Promise<DeleteCaptionState> {
  const captionId = field(formData, "caption_id");

  if (!captionId) {
    return { status: "error", message: "Choose a saved caption to delete." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data: deletedRows, error } = await supabase
    .from("captions")
    .delete()
    .eq("id", captionId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("Caption delete failed:", error.message);

    return {
      status: "error",
      message: "We could not delete that caption. Please try again.",
      deletedCaptionIds: previousState.deletedCaptionIds ?? [],
    };
  }

  if (!deletedRows?.length) {
    return {
      status: "error",
      message: "That saved caption was not found.",
      deletedCaptionIds: previousState.deletedCaptionIds ?? [],
    };
  }

  revalidatePath("/captions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Caption deleted.",
    deletedCaptionIds: [captionId, ...(previousState.deletedCaptionIds ?? [])],
  };
}

export async function clearCaptionsForIdea(
  previousState: ClearCaptionsState,
  formData: FormData,
): Promise<ClearCaptionsState> {
  const contentIdeaId = field(formData, "content_idea_id");

  if (!contentIdeaId) {
    return { status: "error", message: "Choose an idea before clearing captions." };
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
    console.error("Caption clear idea validation failed:", ideaError?.message);

    return {
      status: "error",
      message: "That saved idea is no longer available.",
      deletedCaptionIds: previousState.deletedCaptionIds ?? [],
    };
  }

  const { data: deletedRows, error } = await supabase
    .from("captions")
    .delete()
    .eq("user_id", user.id)
    .eq("content_idea_id", contentIdeaId)
    .select("id");

  if (error) {
    console.error("Caption clear failed:", error.message);

    return {
      status: "error",
      message: "We could not clear captions for this idea. Please try again.",
      deletedCaptionIds: previousState.deletedCaptionIds ?? [],
    };
  }

  const deletedIds = (deletedRows ?? []).map((caption) => caption.id);

  revalidatePath("/captions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: deletedIds.length
      ? "Saved captions cleared for this idea."
      : "There were no saved captions to clear for this idea.",
    deletedCaptionIds: [...deletedIds, ...(previousState.deletedCaptionIds ?? [])],
  };
}
