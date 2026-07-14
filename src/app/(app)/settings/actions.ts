"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  settingsFormats,
  settingsPlatforms,
  settingsReminderOptions,
  type SettingsActionResult,
} from "./types";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function limitedField(formData: FormData, name: string, maxLength: number) {
  return field(formData, name).slice(0, maxLength);
}

async function authenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function updateAccountSettings(formData: FormData): Promise<SettingsActionResult> {
  const fullName = limitedField(formData, "full_name", 80);
  const username = field(formData, "username");
  const avatarUrl = field(formData, "avatar_url");

  if (username && (!/^[a-zA-Z0-9._]{3,30}$/.test(username) || username.length > 30)) {
    return {
      status: "error",
      message: "Username must be 3-30 characters using letters, numbers, periods, or underscores.",
    };
  }

  if (avatarUrl) {
    try {
      const url = new URL(avatarUrl);

      if (!["http:", "https:"].includes(url.protocol) || avatarUrl.length > 1000) {
        throw new Error("Invalid avatar URL");
      }
    } catch {
      return { status: "error", message: "Enter a valid http or https avatar URL." };
    }
  }

  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName || null,
    username: username || null,
    avatar_url: avatarUrl || null,
  });

  if (error) {
    console.error("Account settings update failed:", error.message);
    return { status: "error", message: "Your account settings could not be saved." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { status: "success", message: "Account settings saved." };
}

export async function updateCreatorProfileSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { data: creatorProfile, error: lookupError } = await supabase
    .from("user_creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("Creator profile lookup failed:", lookupError.message);
    return { status: "error", message: "Your creator profile could not be loaded." };
  }

  if (!creatorProfile) {
    return { status: "error", message: "Choose your niche foundation before editing this profile." };
  }

  const bestFormats = limitedField(formData, "best_formats", 500)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 8);
  const payload = {
    content_tone: limitedField(formData, "content_tone", 160) || null,
    energy_style: limitedField(formData, "energy_style", 160) || null,
    editing_style: limitedField(formData, "editing_style", 240) || null,
    caption_style: limitedField(formData, "caption_style", 240) || null,
    best_formats: bestFormats,
    posting_frequency: limitedField(formData, "posting_frequency", 160) || null,
    growth_angle: limitedField(formData, "growth_angle", 600) || null,
    personal_brand_direction:
      limitedField(formData, "personal_brand_direction", 800) || null,
  };

  const { error } = await supabase
    .from("user_creator_profiles")
    .update(payload)
    .eq("id", creatorProfile.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Creator profile settings update failed:", error.message);
    return { status: "error", message: "Your creator profile could not be saved." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/ideas");

  return { status: "success", message: "Creator profile settings saved." };
}

export async function updateContentPreferences(
  formData: FormData,
): Promise<SettingsActionResult> {
  const preferredPlatforms = formData
    .getAll("preferred_platforms")
    .map(String)
    .filter((value): value is (typeof settingsPlatforms)[number] =>
      settingsPlatforms.includes(value as (typeof settingsPlatforms)[number]),
    );
  const preferredFormats = formData
    .getAll("preferred_formats")
    .map(String)
    .filter((value): value is (typeof settingsFormats)[number] =>
      settingsFormats.includes(value as (typeof settingsFormats)[number]),
    );
  const weeklyPostingGoal = Number(field(formData, "weekly_posting_goal"));
  const defaultPlatform = field(formData, "default_platform");
  const reminderMinutesBefore = Number(field(formData, "reminder_minutes_before"));
  const contentStyleNotes = limitedField(formData, "content_style_notes", 1000);

  if (!Number.isInteger(weeklyPostingGoal) || weeklyPostingGoal < 1 || weeklyPostingGoal > 21) {
    return { status: "error", message: "Weekly posting goal must be between 1 and 21." };
  }

  if (!settingsPlatforms.includes(defaultPlatform as (typeof settingsPlatforms)[number])) {
    return { status: "error", message: "Choose a valid default platform." };
  }

  if (!settingsReminderOptions.some((option) => option.value === reminderMinutesBefore)) {
    return { status: "error", message: "Choose a valid reminder timing." };
  }

  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { error: preferencesError } = await supabase.from("user_content_preferences").upsert(
    {
      user_id: user.id,
      preferred_platforms: [...new Set(preferredPlatforms)],
      preferred_formats: [...new Set(preferredFormats)],
      weekly_posting_goal: weeklyPostingGoal,
      default_platform: defaultPlatform,
      content_style_notes: contentStyleNotes || null,
    },
    { onConflict: "user_id" },
  );

  if (preferencesError) {
    console.error("Content preferences update failed:", preferencesError.message);
    return {
      status: "error",
      message: "Content preferences need the Settings Center database migration before they can be saved.",
      setupNeeded: true,
    };
  }

  const { error: reminderError } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      reminder_minutes_before: reminderMinutesBefore,
    },
    { onConflict: "user_id" },
  );

  if (reminderError) {
    console.error("Default reminder timing update failed:", reminderError.message);
    return {
      status: "error",
      message: "Content preferences saved, but reminder timing could not be updated.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/calendar");

  return { status: "success", message: "Content preferences saved." };
}

export async function resetNicheFoundation(): Promise<SettingsActionResult> {
  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { error: creatorProfileError } = await supabase
    .from("user_creator_profiles")
    .update({
      niche: null,
      sub_niche: null,
      selected_creators: [],
      energy_style: null,
      content_tone: null,
      editing_style: null,
      caption_style: null,
      best_formats: [],
      posting_frequency: null,
      growth_angle: null,
      personal_brand_direction: null,
    })
    .eq("user_id", user.id);

  if (creatorProfileError) {
    console.error("Creator profile reset failed:", creatorProfileError.message);
    return { status: "error", message: "Your niche foundation could not be reset." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ primary_niche: null })
    .eq("id", user.id);

  if (profileError) {
    console.error("Primary niche reset failed:", profileError.message);
    return { status: "error", message: "Your niche foundation could not be fully reset." };
  }

  revalidatePath("/settings");
  revalidatePath("/niche");
  revalidatePath("/creators");
  revalidatePath("/ideas");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Niche foundation reset. Your saved content and analytics were preserved.",
  };
}
