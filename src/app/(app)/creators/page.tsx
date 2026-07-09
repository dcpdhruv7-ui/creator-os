import Link from "next/link";
import { AlertCircle, ArrowRight, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CreatorInspiration,
  type GeneratedCreatorProfile,
} from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/server";
import { CreatorSelectionForm } from "./creator-selection-form";

function getSelectedIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }

    if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
      return [item.id];
    }

    return [];
  });
}

function getBestFormats(value: unknown) {
  return Array.isArray(value)
    ? value.filter((format): format is string => typeof format === "string")
    : [];
}

export default async function CreatorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: creatorProfile, error: profileError } = await supabase
    .from("user_creator_profiles")
    .select(
      "niche, sub_niche, selected_creators, energy_style, content_tone, editing_style, caption_style, best_formats, posting_frequency, growth_angle, personal_brand_direction",
    )
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (profileError) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          We could not load your creator foundation. Refresh and try again.
        </div>
      </section>
    );
  }

  if (!creatorProfile?.niche) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Compass />
            </div>
            <CardTitle>Choose your niche first</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 text-sm text-zinc-400">
              Your niche and content direction help Creator OS show relevant inspiration styles.
            </p>
            <Button asChild>
              <Link href="/niche">
                Go to Niche
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const { data: niche, error: nicheError } = await supabase
    .from("niches")
    .select("id")
    .eq("name", creatorProfile.niche)
    .maybeSingle();

  if (nicheError || !niche) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          Your saved niche could not be found. Return to Niche and save it again.
        </div>
      </section>
    );
  }

  const [creatorsResult, subNichesResult] = await Promise.all([
    supabase
      .from("creators")
      .select(
        "id, sub_niche_id, name, platform, style, content_strength, hook_style, editing_style, posting_style, audience_type, learnings",
      )
      .eq("niche_id", niche.id)
      .order("name"),
    supabase.from("sub_niches").select("id, name").eq("niche_id", niche.id),
  ]);

  const loadError = creatorsResult.error ?? subNichesResult.error;
  const subNicheNames = new Map(
    (subNichesResult.data ?? []).map((subNiche) => [subNiche.id, subNiche.name]),
  );
  const creators = (creatorsResult.data ?? [])
    .map(
      (creator): CreatorInspiration => ({
        id: creator.id,
        name: creator.name,
        platform: creator.platform,
        style: creator.style,
        content_strength: creator.content_strength,
        hook_style: creator.hook_style,
        editing_style: creator.editing_style,
        posting_style: creator.posting_style,
        audience_type: creator.audience_type,
        learnings: creator.learnings,
        sub_niche_name: creator.sub_niche_id
          ? (subNicheNames.get(creator.sub_niche_id) ?? null)
          : null,
      }),
    )
    .sort((a, b) => {
      const aMatches = a.sub_niche_name === creatorProfile.sub_niche ? 1 : 0;
      const bMatches = b.sub_niche_name === creatorProfile.sub_niche ? 1 : 0;
      return bMatches - aMatches || a.name.localeCompare(b.name);
    });

  const hasSavedProfile = Boolean(
    creatorProfile.energy_style &&
      creatorProfile.content_tone &&
      creatorProfile.editing_style &&
      creatorProfile.growth_angle,
  );
  const savedProfile: GeneratedCreatorProfile | null = hasSavedProfile
    ? {
        energyStyle: creatorProfile.energy_style!,
        contentTone: creatorProfile.content_tone!,
        editingStyle: creatorProfile.editing_style!,
        captionStyle: creatorProfile.caption_style ?? "",
        bestFormats: getBestFormats(creatorProfile.best_formats),
        postingFrequency: creatorProfile.posting_frequency ?? "",
        growthAngle: creatorProfile.growth_angle!,
        personalBrandDirection: creatorProfile.personal_brand_direction ?? "",
      }
    : null;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Creator inspiration</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Choose your inspiration
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Select creators or content styles that match the direction you want to build.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          We could not load creator inspirations. Refresh and try again.
        </div>
      ) : creators.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          No curated inspirations are available for this niche yet.
        </div>
      ) : (
        <CreatorSelectionForm
          creators={creators}
          direction={creatorProfile.sub_niche}
          initialSelectedIds={getSelectedIds(creatorProfile.selected_creators)}
          niche={creatorProfile.niche}
          savedProfile={savedProfile}
        />
      )}
    </section>
  );
}
