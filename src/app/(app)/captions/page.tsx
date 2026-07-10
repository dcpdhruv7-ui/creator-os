import Link from "next/link";
import { AlertCircle, ArrowRight, Compass, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaptionIdea, CaptionProfile } from "@/lib/caption-generator";
import { createClient } from "@/lib/supabase/server";
import { CaptionWorkspace, type SavedCaption } from "./caption-workspace";

function getSelectedCreatorNames(value: unknown) {
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

export default async function CaptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, ideasResult, captionsResult] = await Promise.all([
    supabase
      .from("user_creator_profiles")
      .select(
        "niche, sub_niche, selected_creators, energy_style, content_tone, editing_style, caption_style, growth_angle",
      )
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_ideas")
      .select(
        "id, title, hook, niche, sub_niche, format, shot_list, caption_angle, difficulty, goal, status, priority",
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("captions")
      .select("id, content_idea_id, caption_type, hook, body, cta, hashtags, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || ideasResult.error || captionsResult.error) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          We could not load your caption workspace. Refresh and try again.
        </div>
      </section>
    );
  }

  const creatorProfile = profileResult.data;

  if (!creatorProfile?.niche || !creatorProfile.sub_niche) {
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

  const ideas = (ideasResult.data ?? []) as CaptionIdea[];

  if (ideas.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Lightbulb />
            </div>
            <CardTitle>Generate and save ideas first</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/ideas">
                Go to Ideas
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const profile: CaptionProfile = {
    niche: creatorProfile.niche,
    subNiche: creatorProfile.sub_niche,
    selectedCreatorNames: getSelectedCreatorNames(creatorProfile.selected_creators),
    energyStyle: creatorProfile.energy_style ?? "Confident and adaptable",
    contentTone: creatorProfile.content_tone ?? "Clear and authentic",
    editingStyle: creatorProfile.editing_style ?? "Clean, focused edits",
    captionStyle: creatorProfile.caption_style ?? "Concise captions with a clear takeaway",
    growthAngle: creatorProfile.growth_angle ?? "Build recognition through consistency.",
  };
  const ideaTitleMap = new Map(ideas.map((idea) => [idea.id, idea.title]));
  const savedCaptions = (captionsResult.data ?? []).map((caption) => ({
    ...caption,
    relatedIdeaTitle:
      ideaTitleMap.get(caption.content_idea_id ?? "") ?? "Saved content idea",
  })) as SavedCaption[];

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Caption engine</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Generate hooks and captions
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Turn your saved ideas into scroll-stopping hooks, captions, CTAs, and hashtags.
        </p>
      </div>

      <CaptionWorkspace
        ideas={ideas}
        profile={profile}
        savedCaptions={savedCaptions}
      />
    </section>
  );
}
