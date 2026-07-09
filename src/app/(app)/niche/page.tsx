import { AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { NicheOnboardingForm } from "./niche-onboarding-form";

export default async function NichePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [nichesResult, subNichesResult, profileResult, creatorProfileResult] = await Promise.all([
    supabase.from("niches").select("id, name, description").order("name"),
    supabase
      .from("sub_niches")
      .select("id, niche_id, name, description")
      .order("name"),
    supabase.from("profiles").select("primary_niche").eq("id", user!.id).maybeSingle(),
    supabase
      .from("user_creator_profiles")
      .select("niche, sub_niche, personal_brand_direction")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const loadError = nichesResult.error ?? subNichesResult.error;
  const niches = nichesResult.data ?? [];
  const subNiches = subNichesResult.data ?? [];
  const savedNicheName =
    creatorProfileResult.data?.niche ?? profileResult.data?.primary_niche ?? "";
  const savedSubNicheName = creatorProfileResult.data?.sub_niche ?? "";
  const initialNicheId =
    niches.find((niche) => niche.name === savedNicheName)?.id ?? "";
  const initialSubNicheId =
    subNiches.find(
      (subNiche) =>
        subNiche.niche_id === initialNicheId && subNiche.name === savedSubNicheName,
    )?.id ?? "";

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Niche foundation</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Choose your niche
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Start by selecting the content world you want to build in.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 md:p-6">
          {loadError ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">We could not load your niche options.</p>
                <p className="mt-1 text-red-200/70">Refresh the page and try again.</p>
              </div>
            </div>
          ) : niches.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
              No niches are available yet.
            </div>
          ) : (
            <NicheOnboardingForm
              initialCreatorGoal={
                creatorProfileResult.data?.personal_brand_direction ?? ""
              }
              initialNicheId={initialNicheId}
              initialSubNicheId={initialSubNicheId}
              niches={niches}
              subNiches={subNiches}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
