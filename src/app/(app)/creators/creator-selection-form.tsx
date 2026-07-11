"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, Save, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildCreatorProfile,
  type CreatorInspiration,
  type GeneratedCreatorProfile,
} from "@/lib/creator-profile";
import { cn } from "@/lib/utils";
import { saveCreatorInspirations, type SaveCreatorState } from "./actions";

type CreatorSelectionFormProps = {
  creators: CreatorInspiration[];
  niche: string;
  direction: string | null;
  initialSelectedIds: string[];
  savedProfile: GeneratedCreatorProfile | null;
};

const initialState: SaveCreatorState = { status: "idle", message: "" };

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} size="lg" type="submit">
      {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
      {pending ? "Saving inspirations..." : "Save inspirations"}
    </Button>
  );
}

export function CreatorSelectionForm({
  creators,
  niche,
  direction,
  initialSelectedIds,
  savedProfile,
}: CreatorSelectionFormProps) {
  const router = useRouter();
  const validInitialIds = initialSelectedIds.filter((id) =>
    creators.some((creator) => creator.id === id),
  );
  const [selectedIds, setSelectedIds] = useState(validInitialIds);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [state, formAction] = useActionState(saveCreatorInspirations, initialState);
  const selectedCreators = creators.filter((creator) => selectedIds.includes(creator.id));
  const preview =
    selectedCreators.length > 0 ? buildCreatorProfile(niche, selectedCreators) : savedProfile;

  useEffect(() => {
    if (state.status === "success") {
      router.push("/ideas");
    }
  }, [router, state.status]);

  function toggleCreator(creatorId: string) {
    if (selectedIds.includes(creatorId)) {
      setSelectedIds((current) => current.filter((id) => id !== creatorId));
      setSelectionMessage("");
      return;
    }

    if (selectedIds.length >= 5) {
      setSelectionMessage("Choose up to 5 inspirations for a clearer Creator OS profile.");
      return;
    }

    setSelectedIds((current) => [...current, creatorId]);
    setSelectionMessage("");
  }

  return (
    <form action={formAction} className="space-y-6">
      {selectedIds.map((id) => (
        <input key={id} name="creator_ids" type="hidden" value={id} />
      ))}

      <div className="flex flex-col gap-3 border-y border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">Current foundation</p>
          <p className="mt-1 text-sm text-zinc-200">
            <span className="font-medium text-white">{niche}</span>
            {direction ? <span className="text-zinc-500"> / {direction}</span> : null}
          </p>
        </div>
        <p className="text-sm text-zinc-400">{selectedIds.length} of 5 selected</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {creators.map((creator) => {
          const selected = selectedIds.includes(creator.id);

          return (
            <Card
              aria-checked={selected}
              className={cn(
                "relative cursor-pointer transition-colors hover:border-white/25",
                selected && "border-emerald-300/70 bg-emerald-400/[0.06]",
              )}
              key={creator.id}
              onClick={() => toggleCreator(creator.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleCreator(creator.id);
                }
              }}
              role="checkbox"
              tabIndex={0}
            >
              <CardHeader className="pr-14">
                <div
                  className={cn(
                    "absolute right-5 top-5 flex size-6 items-center justify-center rounded-full border",
                    selected
                      ? "border-emerald-300 bg-emerald-300 text-zinc-950"
                      : "border-zinc-700 text-transparent",
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </div>
                <p className="text-xs text-emerald-300">
                  {niche} / {creator.sub_niche_name ?? "General"} / {creator.platform}
                </p>
                <CardTitle className="text-lg">{creator.name}</CardTitle>
                <p className="text-sm text-zinc-400">{creator.style}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-zinc-600">Content strength</dt>
                    <dd className="mt-1 text-zinc-300">{creator.content_strength}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-600">Hook style</dt>
                    <dd className="mt-1 text-zinc-300">{creator.hook_style}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-600">Editing style</dt>
                    <dd className="mt-1 text-zinc-300">{creator.editing_style}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-600">Posting style</dt>
                    <dd className="mt-1 text-zinc-300">{creator.posting_style}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-600">Audience</dt>
                    <dd className="mt-1 text-zinc-300">{creator.audience_type}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-600">What you can learn</dt>
                    <dd className="mt-1 text-zinc-300">{creator.learnings}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectionMessage ? (
        <p className="text-sm text-amber-200" role="alert">
          {selectionMessage}
        </p>
      ) : null}

      {preview ? (
        <Card className="border-emerald-300/20">
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Sparkles />
            </div>
            <CardTitle>Your Creator OS profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-zinc-500">Energy</dt>
                <dd className="mt-1 text-zinc-100">{preview.energyStyle}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Tone</dt>
                <dd className="mt-1 text-zinc-100">{preview.contentTone}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Editing style</dt>
                <dd className="mt-1 text-zinc-100">{preview.editingStyle}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Best formats</dt>
                <dd className="mt-1 text-zinc-100">{preview.bestFormats.join(", ")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">Growth angle</dt>
                <dd className="mt-1 text-zinc-100">{preview.growthAngle}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

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

      <div className="flex justify-end border-t border-white/10 pt-6">
        <SaveButton disabled={selectedIds.length === 0} />
      </div>
    </form>
  );
}
