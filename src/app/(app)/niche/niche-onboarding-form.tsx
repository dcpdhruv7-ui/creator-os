"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveNiche, type SaveNicheState } from "./actions";

type Niche = {
  id: string;
  name: string;
  description: string | null;
};

type SubNiche = {
  id: string;
  niche_id: string | null;
  name: string;
  description: string | null;
};

type NicheOnboardingFormProps = {
  niches: Niche[];
  subNiches: SubNiche[];
  initialNicheId: string;
  initialSubNicheId: string;
  initialCreatorGoal: string;
};

const initialState: SaveNicheState = {
  status: "idle",
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full sm:w-auto" disabled={pending} size="lg" type="submit">
      {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
      {pending ? "Saving niche..." : "Save niche"}
    </Button>
  );
}

export function NicheOnboardingForm({
  niches,
  subNiches,
  initialNicheId,
  initialSubNicheId,
  initialCreatorGoal,
}: NicheOnboardingFormProps) {
  const [selectedNicheId, setSelectedNicheId] = useState(initialNicheId);
  const [selectedSubNicheId, setSelectedSubNicheId] = useState(initialSubNicheId);
  const [state, formAction] = useActionState(saveNiche, initialState);
  const availableSubNiches = subNiches.filter(
    (subNiche) => subNiche.niche_id === selectedNicheId,
  );

  return (
    <form action={formAction} className="space-y-8">
      <fieldset>
        <legend className="text-base font-semibold text-white">1. Pick your content world</legend>
        <p className="mt-1 text-sm text-zinc-400">Choose the niche that best anchors your content.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {niches.map((niche) => {
            const selected = selectedNicheId === niche.id;

            return (
              <label
                className={cn(
                  "relative min-h-32 cursor-pointer rounded-lg border bg-zinc-950/72 p-4 transition-colors hover:border-white/25 hover:bg-white/[0.04]",
                  selected
                    ? "border-emerald-300/70 bg-emerald-400/[0.08]"
                    : "border-white/10",
                )}
                key={niche.id}
              >
                <input
                  checked={selected}
                  className="sr-only"
                  name="niche_id"
                  onChange={() => {
                    setSelectedNicheId(niche.id);
                    setSelectedSubNicheId("");
                  }}
                  type="radio"
                  value={niche.id}
                />
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-zinc-100">{niche.name}</span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-emerald-300 bg-emerald-300 text-zinc-950"
                        : "border-zinc-700 text-transparent",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </span>
                <span className="mt-3 block text-sm leading-5 text-zinc-500">
                  {niche.description ?? "Build a focused creator strategy in this niche."}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {selectedNicheId ? (
        <fieldset>
          <legend className="text-base font-semibold text-white">2. Refine your direction</legend>
          <p className="mt-1 text-sm text-zinc-400">
            Select one sub-niche or style to make your starting point more specific.
          </p>

          {availableSubNiches.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableSubNiches.map((subNiche) => {
                const selected = selectedSubNicheId === subNiche.id;

                return (
                  <label
                    className={cn(
                      "cursor-pointer rounded-lg border px-4 py-3 transition-colors hover:border-white/25",
                      selected
                        ? "border-emerald-300/70 bg-emerald-400/[0.08]"
                        : "border-white/10 bg-white/[0.025]",
                    )}
                    key={subNiche.id}
                  >
                    <input
                      checked={selected}
                      className="sr-only"
                      name="sub_niche_id"
                      onChange={() => setSelectedSubNicheId(subNiche.id)}
                      type="radio"
                      value={subNiche.id}
                    />
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-zinc-100">{subNiche.name}</span>
                      {selected ? <Check className="size-4 text-emerald-300" /> : null}
                    </span>
                    {subNiche.description ? (
                      <span className="mt-2 block text-xs leading-5 text-zinc-500">
                        {subNiche.description}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
              No sub-niches are available for this niche yet.
            </div>
          )}
        </fieldset>
      ) : null}

      <div className="max-w-2xl">
        <Label htmlFor="creator_goal">Creator goal or niche note (optional)</Label>
        <Textarea
          className="mt-2"
          defaultValue={initialCreatorGoal}
          id="creator_goal"
          maxLength={500}
          name="creator_goal"
          placeholder="Example: Help busy beginners build sustainable fitness habits."
        />
        <p className="mt-2 text-xs text-zinc-500">
          Add a short direction for the audience or outcome you want to focus on.
        </p>
      </div>

      {state.message ? (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            state.status === "success"
              ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100"
              : "border-red-400/25 bg-red-400/[0.08] text-red-100",
          )}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </div>
      ) : null}

      <div className="flex items-center justify-end border-t border-white/10 pt-6">
        <SaveButton />
      </div>
    </form>
  );
}
