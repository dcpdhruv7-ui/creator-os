import { SlidersHorizontal } from "lucide-react";

import { getVapidPublicKey, hasPushConfig } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { SettingsCenter } from "./settings-center";
import type {
  AccountSettings,
  ContentPreferences,
  CreatorProfileSettings,
} from "./types";

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, creatorProfileResult, contentPreferencesResult, reminderResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, username, avatar_url, primary_niche")
        .eq("id", user!.id)
        .maybeSingle(),
      supabase
        .from("user_creator_profiles")
        .select(
          "niche, sub_niche, content_tone, energy_style, editing_style, caption_style, best_formats, posting_frequency, growth_angle, personal_brand_direction",
        )
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("user_content_preferences")
        .select(
          "preferred_platforms, preferred_formats, weekly_posting_goal, default_platform, content_style_notes",
        )
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("notification_preferences")
        .select("reminder_minutes_before")
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

  const profile = profileResult.data;
  const creatorProfile = creatorProfileResult.data;
  const savedPreferences = contentPreferencesResult.data;
  const account: AccountSettings = {
    fullName:
      profile?.full_name ??
      (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""),
    username: profile?.username ?? "",
    avatarUrl: profile?.avatar_url ?? "",
    email: user?.email ?? "",
  };
  const creator: CreatorProfileSettings = {
    exists: Boolean(creatorProfile),
    niche: creatorProfile?.niche ?? profile?.primary_niche ?? "",
    subNiche: creatorProfile?.sub_niche ?? "",
    contentTone: creatorProfile?.content_tone ?? "",
    energyStyle: creatorProfile?.energy_style ?? "",
    editingStyle: creatorProfile?.editing_style ?? "",
    captionStyle: creatorProfile?.caption_style ?? "",
    bestFormats: stringArray(creatorProfile?.best_formats),
    postingFrequency: creatorProfile?.posting_frequency ?? "",
    growthAngle: creatorProfile?.growth_angle ?? "",
    personalBrandDirection: creatorProfile?.personal_brand_direction ?? "",
  };
  const contentPreferences: ContentPreferences = {
    preferredPlatforms: stringArray(savedPreferences?.preferred_platforms),
    preferredFormats: stringArray(savedPreferences?.preferred_formats),
    weeklyPostingGoal: savedPreferences?.weekly_posting_goal ?? 3,
    defaultPlatform: savedPreferences?.default_platform ?? "Instagram",
    reminderMinutesBefore: reminderResult.data?.reminder_minutes_before ?? 60,
    contentStyleNotes: savedPreferences?.content_style_notes ?? "",
  };

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
          <SlidersHorizontal />
        </div>
        <p className="text-sm font-medium text-emerald-300">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Creator OS Settings
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Manage your account, creator direction, content defaults, reminders, and data.
        </p>
      </div>

      <SettingsCenter
        account={account}
        contentPreferences={contentPreferences}
        contentPreferencesSetupNeeded={Boolean(contentPreferencesResult.error)}
        creatorProfile={creator}
        pushConfigured={hasPushConfig()}
        vapidPublicKey={getVapidPublicKey()}
      />
    </section>
  );
}
