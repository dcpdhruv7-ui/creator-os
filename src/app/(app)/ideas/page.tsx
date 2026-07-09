import Link from "next/link";
import { AlertCircle, ArrowRight, Compass, UserRoundCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IdeaProfile } from "@/lib/content-ideas";
import { createClient } from "@/lib/supabase/server";
import { IdeaEngine, type SavedIdea } from "./idea-engine";

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

export default async function IdeasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profileResult, ideasResult] = await Promise.all([
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
      .select("id, title, hook, format, difficulty, goal, status, priority")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || ideasResult.error) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          We could not load your idea workspace. Refresh and try again.
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

  const creatorNames = getSelectedCreatorNames(creatorProfile.selected_creators);

  if (creatorNames.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <UserRoundCog />
            </div>
            <CardTitle>Choose your creator inspirations first</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/creators">
                Go to Creators
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const profile: IdeaProfile = {
    niche: creatorProfile.niche,
    subNiche: creatorProfile.sub_niche,
    selectedCreatorNames: creatorNames,
    energyStyle: creatorProfile.energy_style ?? "Confident and adaptable",
    contentTone: creatorProfile.content_tone ?? "Clear and authentic",
    editingStyle: creatorProfile.editing_style ?? "Clean, focused edits",
    captionStyle: creatorProfile.caption_style ?? "Concise captions with a clear takeaway",
    growthAngle: creatorProfile.growth_angle ?? "Build recognition through consistency.",
  };
  const savedIdeas = (ideasResult.data ?? []) as SavedIdea[];

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Idea engine</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Generate content ideas
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Turn your niche, direction, and creator profile into ready-to-shoot content ideas.
        </p>
      </div>

      <Card className="mb-8 border-emerald-300/20">
        <CardHeader>
          <CardTitle>Your Creator OS foundation</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-zinc-500">Niche</dt>
              <dd className="mt-1 text-zinc-100">{profile.niche}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Direction</dt>
              <dd className="mt-1 text-zinc-100">{profile.subNiche}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Energy</dt>
              <dd className="mt-1 text-zinc-100">{profile.energyStyle}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Tone</dt>
              <dd className="mt-1 text-zinc-100">{profile.contentTone}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Editing style</dt>
              <dd className="mt-1 text-zinc-100">{profile.editingStyle}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Caption style</dt>
              <dd className="mt-1 text-zinc-100">{profile.captionStyle}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-zinc-500">Growth angle</dt>
              <dd className="mt-1 text-zinc-100">{profile.growthAngle}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <IdeaEngine profile={profile} savedIdeas={savedIdeas} />
    </section>
  );
}
