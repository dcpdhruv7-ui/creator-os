"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Check, Layers3, LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateAdaptiveIdeas,
  type GeneratedIdea,
  type IdeaProfile,
} from "@/lib/content-ideas";
import { cn } from "@/lib/utils";
import {
  deleteSavedIdeas,
  type DeleteIdeasState,
  saveGeneratedIdeas,
  type SaveIdeasState,
  type SavedIdeaPayload,
  updateSavedIdea,
} from "./actions";

export type SavedIdea = SavedIdeaPayload;

type IdeaEngineProps = {
  profile: IdeaProfile;
  savedIdeas: SavedIdea[];
};

type ClientGeneratedIdea = GeneratedIdea & {
  clientId: string;
};

const initialState: SaveIdeasState = { status: "idle", message: "" };
const initialDeleteState: DeleteIdeasState = { status: "idle", message: "" };
const statuses = ["Idea", "Scripted", "Shot", "Editing", "Scheduled", "Posted"];
const priorities = ["Low", "Medium", "High"];

function normalizeSavedIdeaText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function savedIdeaFingerprint(idea: Pick<SavedIdea, "title" | "hook" | "format">) {
  return [
    normalizeSavedIdeaText(idea.title),
    normalizeSavedIdeaText(idea.hook),
    normalizeSavedIdeaText(idea.format),
  ].join("|");
}

function mergeSavedIdeas(currentIdeas: SavedIdea[], incomingIdeas: SavedIdea[]) {
  const byId = new Set(currentIdeas.map((idea) => idea.id));
  const byFingerprint = new Set(currentIdeas.map((idea) => savedIdeaFingerprint(idea)));
  const nextIdeas = [...currentIdeas];

  incomingIdeas.forEach((idea) => {
    const fingerprint = savedIdeaFingerprint(idea);

    if (byId.has(idea.id) || byFingerprint.has(fingerprint)) {
      return;
    }

    byId.add(idea.id);
    byFingerprint.add(fingerprint);
    nextIdeas.unshift(idea);
  });

  return nextIdeas;
}

function savedIdeaMatchesProfile(idea: SavedIdea, profile: IdeaProfile) {
  return idea.niche === profile.niche && idea.sub_niche === profile.subNiche;
}

function ideaGroupLabel(idea: SavedIdea) {
  return `${idea.niche ?? "Unknown niche"} / ${idea.sub_niche ?? "General"}`;
}

function groupSavedIdeas(ideas: SavedIdea[]) {
  return ideas.reduce<Array<{ label: string; ideas: SavedIdea[] }>>((groups, idea) => {
    const label = ideaGroupLabel(idea);
    const existingGroup = groups.find((group) => group.label === label);

    if (existingGroup) {
      existingGroup.ideas.push(idea);
      return groups;
    }

    groups.push({ label, ideas: [idea] });
    return groups;
  }, []);
}

function withClientIds(ideas: GeneratedIdea[], batchId: number): ClientGeneratedIdea[] {
  return ideas.map((idea, index) => ({
    ...idea,
    clientId: `${batchId}-${index}-${idea.key}`,
  }));
}

function reconcileSelectedIdeas(generatedIdeas: ClientGeneratedIdea[], selectedIds: string[]) {
  const visibleIds = new Set(generatedIdeas.map((idea) => idea.clientId));

  return selectedIds.filter((id) => visibleIds.has(id));
}

function getValidSelectedIdeas(
  generatedIdeas: ClientGeneratedIdea[],
  selectedIds: string[],
) {
  const selectedIdSet = new Set(reconcileSelectedIdeas(generatedIdeas, selectedIds));

  return generatedIdeas.filter((idea) => selectedIdSet.has(idea.clientId));
}

function SaveIdeasButton({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
      {pending ? "Saving ideas..." : "Save selected ideas"}
    </Button>
  );
}

function UpdateIdeaButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit" variant="secondary">
      {pending ? "Updating..." : "Update"}
    </Button>
  );
}

export function IdeaEngine({ profile, savedIdeas }: IdeaEngineProps) {
  const [generatedIdeas, setGeneratedIdeas] = useState<ClientGeneratedIdea[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, setState] = useState<SaveIdeasState>(initialState);
  const [deleteState, setDeleteState] = useState<DeleteIdeasState>(initialDeleteState);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeletingIdeas, setIsDeletingIdeas] = useState(false);
  const [generationOffset, setGenerationOffset] = useState(0);
  const [generationBatch, setGenerationBatch] = useState(0);
  const [localSavedIdeas, setLocalSavedIdeas] = useState(savedIdeas);
  const [selectedSavedIdeaIds, setSelectedSavedIdeaIds] = useState<string[]>([]);
  const [localSavedIdeaTitles, setLocalSavedIdeaTitles] = useState(
    savedIdeas.map((idea) => idea.title),
  );
  const [showAllSavedIdeas, setShowAllSavedIdeas] = useState(false);
  const reconciledSelectedIds = reconcileSelectedIdeas(generatedIdeas, selectedIds);
  const currentNicheSavedIdeas = localSavedIdeas.filter((idea) =>
    savedIdeaMatchesProfile(idea, profile),
  );
  const visibleSavedIdeas = showAllSavedIdeas ? localSavedIdeas : currentNicheSavedIdeas;
  const visibleSavedIdeaIds = new Set(visibleSavedIdeas.map((idea) => idea.id));
  const groupedSavedIdeas = showAllSavedIdeas ? groupSavedIdeas(visibleSavedIdeas) : [];
  const visibleSelectedSavedIdeaIds = selectedSavedIdeaIds.filter((id) =>
    visibleSavedIdeaIds.has(id),
  );

  function generateIdeas() {
    if (isSaving || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setSelectedIds([]);
    const nextOffset = generationOffset;
    const nextBatch = generationBatch + 1;
    setGeneratedIdeas(
      withClientIds(
        generateAdaptiveIdeas(profile, {
          count: 10,
          excludeTitles: localSavedIdeaTitles,
          offset: nextOffset,
        }),
        nextBatch,
      ),
    );
    setGenerationOffset(nextOffset + 10);
    setGenerationBatch(nextBatch);
    setIsGenerating(false);
  }

  function toggleIdea(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds((current) =>
      reconcileSelectedIdeas(generatedIdeas, current).length === generatedIdeas.length
        ? []
        : generatedIdeas.map((idea) => idea.clientId),
    );
  }

  function toggleSavedIdea(id: string) {
    setSelectedSavedIdeaIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAllSavedIdeas() {
    setSelectedSavedIdeaIds((current) =>
      current.filter((id) => visibleSavedIdeaIds.has(id)).length === visibleSavedIdeas.length
        ? current.filter((id) => !visibleSavedIdeaIds.has(id))
        : [
            ...current.filter((id) => !visibleSavedIdeaIds.has(id)),
            ...visibleSavedIdeas.map((idea) => idea.id),
          ],
    );
  }

  async function saveSelectedIdeas(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedIdeas = getValidSelectedIdeas(generatedIdeas, selectedIds);

    if (selectedIdeas.length === 0 || isSaving || isGenerating) {
      setSelectedIds([]);
      setState({
        status: "error",
        message: "Your generated ideas changed. Please select again.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("selected_ideas", JSON.stringify(selectedIdeas));
      formData.delete("idea_keys");
      selectedIdeas.forEach((idea) => formData.append("idea_keys", idea.key));
      const nextState = await saveGeneratedIdeas(state, formData);
      setState(nextState);

      if (nextState.status !== "success") {
        return;
      }

      const returnedSavedIdeas = [
        ...(nextState.savedIdeas ?? []),
        ...(nextState.duplicateIdeas ?? []),
      ];

      if (returnedSavedIdeas.length > 0) {
        setLocalSavedIdeas((current) => mergeSavedIdeas(current, returnedSavedIdeas));
        setLocalSavedIdeaTitles((current) => [
          ...new Set([...current, ...returnedSavedIdeas.map((idea) => idea.title)]),
        ]);
      }

      if (!nextState.savedIdeaKeys?.length) {
        setSelectedIds([]);
        return;
      }

      const savedKeySet = new Set(nextState.savedIdeaKeys);
      const savedTitleSet = new Set(nextState.savedIdeaTitles ?? []);
      const nextOffset = generationOffset;
      const nextBatch = generationBatch + 1;

      setGeneratedIdeas((currentIdeas) => {
        const remainingIdeas = currentIdeas.filter(
          (idea) => !savedKeySet.has(idea.key) && !savedTitleSet.has(idea.title),
        );
        const replacementCount = Math.max(0, 10 - remainingIdeas.length);
        const excludeTitles = [
          ...localSavedIdeaTitles,
          ...remainingIdeas.map((idea) => idea.title),
          ...(nextState.savedIdeaTitles ?? []),
        ];
        const replacements = withClientIds(
          generateAdaptiveIdeas(profile, {
            count: replacementCount,
            excludeTitles,
            excludeKeys: nextState.savedIdeaKeys,
            offset: nextOffset,
          }),
          nextBatch,
        );

        return [...remainingIdeas, ...replacements].slice(0, 10);
      });
      setGenerationOffset(nextOffset + 10);
      setGenerationBatch(nextBatch);
      setLocalSavedIdeaTitles((current) => [
        ...new Set([...current, ...(nextState.savedIdeaTitles ?? [])]),
      ]);
      setSelectedIds([]);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSelectedSavedIdeas(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (visibleSelectedSavedIdeaIds.length === 0 || isDeletingIdeas) {
      return;
    }

    const confirmed = window.confirm(
      visibleSelectedSavedIdeaIds.length === 1
        ? "Delete this saved idea?"
        : `Delete ${visibleSelectedSavedIdeaIds.length} selected saved ideas?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingIdeas(true);

    try {
      const formData = new FormData(event.currentTarget);
      const nextState = await deleteSavedIdeas(deleteState, formData);
      setDeleteState(nextState);

      if (nextState.status !== "success" || !nextState.deletedIdeaIds?.length) {
        return;
      }

      const deletedIdSet = new Set(nextState.deletedIdeaIds);
      setLocalSavedIdeas((current) => current.filter((idea) => !deletedIdSet.has(idea.id)));
      setSelectedSavedIdeaIds([]);
      setLocalSavedIdeaTitles((current) => {
        const remainingTitles = localSavedIdeas
          .filter((idea) => !deletedIdSet.has(idea.id))
          .map((idea) => idea.title);

        return current.filter((title) => remainingTitles.includes(title));
      });
    } finally {
      setIsDeletingIdeas(false);
    }
  }

  function renderSavedIdeaCard(idea: SavedIdea) {
    const selected = selectedSavedIdeaIds.includes(idea.id);

    return (
      <Card
        className={cn(selected && "border-red-300/50 bg-red-400/[0.04]")}
        key={idea.id}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-emerald-300">{idea.format ?? "Content idea"}</p>
              <CardTitle className="mt-2">{idea.title}</CardTitle>
            </div>
            <Button
              aria-pressed={selected}
              onClick={() => toggleSavedIdea(idea.id)}
              size="sm"
              type="button"
              variant={selected ? "destructive" : "secondary"}
            >
              {selected ? <Check /> : null}
              {selected ? "Selected" : "Select"}
            </Button>
          </div>
          <p className="text-sm leading-6 text-zinc-400">{idea.hook}</p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span>{idea.difficulty ?? "Medium"}</span>
            <span>/</span>
            <span>{idea.goal ?? "Growth"}</span>
          </div>
          <form action={updateSavedIdea} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input name="idea_id" type="hidden" value={idea.id} />
            <label className="text-xs text-zinc-500">
              Status
              <select
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-2 text-sm text-zinc-100"
                defaultValue={idea.status ?? "Idea"}
                name="status"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Priority
              <select
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-2 text-sm text-zinc-100"
                defaultValue={idea.priority ?? "Medium"}
                name="priority"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <UpdateIdeaButton />
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6 flex items-start gap-3 border-y border-white/10 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
            <Layers3 />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Creator shortcut</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
              Creator OS can turn one shoot, session, topic, or idea into multiple posts using
              formats like BTS, tutorial, final output, mistake fix, and breakdown.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Generated ideas</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Create ten local, profile-based ideas and save the strongest ones.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Saved ideas are moved to your idea bank and replaced with fresh suggestions.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Creator OS replaces saved ideas with fresh angles, not just rewritten versions.
            </p>
          </div>
          <Button disabled={isSaving || isGenerating} onClick={generateIdeas} type="button">
            {isGenerating ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
            {generatedIdeas.length ? "Generate again" : "Generate 10 ideas"}
          </Button>
        </div>

        {generatedIdeas.length > 0 ? (
          <form className="mt-5 space-y-5" onSubmit={saveSelectedIdeas}>
            {reconciledSelectedIds.map((id) => (
              <input key={id} name="idea_ids" type="hidden" value={id} />
            ))}
            <input
              name="selected_ideas"
              type="hidden"
              value={JSON.stringify(getValidSelectedIdeas(generatedIdeas, reconciledSelectedIds))}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                {reconciledSelectedIds.length} of {generatedIdeas.length} selected
              </p>
              <Button onClick={toggleAll} size="sm" type="button" variant="ghost">
                {reconciledSelectedIds.length === generatedIdeas.length ? "Clear selection" : "Select all"}
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {generatedIdeas.map((idea) => {
                const selected = reconciledSelectedIds.includes(idea.clientId);

                return (
                  <Card
                    aria-checked={selected}
                    className={cn(
                      "relative cursor-pointer transition-colors hover:border-white/25",
                      selected && "border-emerald-300/70 bg-emerald-400/[0.06]",
                    )}
                    key={idea.clientId}
                    onClick={() => toggleIdea(idea.clientId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleIdea(idea.clientId);
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
                      <p className="text-xs text-emerald-300">{idea.format}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Creative angle: {idea.creative_angle}
                      </p>
                      <CardTitle className="text-lg">{idea.title}</CardTitle>
                      <p className="text-sm leading-6 text-zinc-300">{idea.hook}</p>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs text-zinc-600">Difficulty</dt>
                          <dd className="mt-1 text-zinc-300">{idea.difficulty}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-zinc-600">Goal</dt>
                          <dd className="mt-1 text-zinc-300">{idea.goal}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-zinc-600">Priority</dt>
                          <dd className="mt-1 text-zinc-300">{idea.priority}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-xs leading-5">
                        <p>
                          <span className="text-zinc-600">Shot list: </span>
                          <span className="text-zinc-400">{idea.shot_list}</span>
                        </p>
                        <p>
                          <span className="text-zinc-600">Caption angle: </span>
                          <span className="text-zinc-400">{idea.caption_angle}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                {state.status === "success" ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">Ideas saved. Ready to write captions?</p>
                      <p className="mt-1 text-emerald-100/75">
                        Ideas saved to your idea bank.
                      </p>
                    </div>
                    <Button asChild size="sm" type="button">
                      <Link href="/captions">Go to Captions</Link>
                    </Button>
                  </div>
                ) : (
                  state.message
                )}
              </div>
            ) : null}

            <div className="flex justify-end">
              <SaveIdeasButton
                disabled={reconciledSelectedIds.length === 0 || isGenerating}
                pending={isSaving}
              />
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">
            Generate your first set of ten ideas.
          </div>
        )}
      </section>

      <section className="border-t border-white/10 pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {showAllSavedIdeas
                ? "All saved ideas"
                : `Saved ideas for ${profile.niche} / ${profile.subNiche}`}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {visibleSavedIdeas.length} visible saved idea
              {visibleSavedIdeas.length === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Creator OS keeps ideas separated by niche so your Food ideas, Fitness ideas, and
              Dance ideas stay organized.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {localSavedIdeas.length > 0 ? (
              <Button
                onClick={() => {
                  setShowAllSavedIdeas((current) => !current);
                  setSelectedSavedIdeaIds([]);
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                {showAllSavedIdeas ? "Show current niche only" : "Show all saved ideas"}
              </Button>
            ) : null}

            {visibleSavedIdeas.length > 0 ? (
              <form className="flex flex-wrap items-center gap-2" onSubmit={deleteSelectedSavedIdeas}>
                {visibleSelectedSavedIdeaIds.map((id) => (
                  <input key={id} name="idea_ids" type="hidden" value={id} />
                ))}
                <Button onClick={toggleAllSavedIdeas} size="sm" type="button" variant="ghost">
                  {visibleSelectedSavedIdeaIds.length === visibleSavedIdeas.length
                    ? "Clear selection"
                    : "Select visible saved"}
                </Button>
                <Button
                  disabled={visibleSelectedSavedIdeaIds.length === 0 || isDeletingIdeas}
                  size="sm"
                  type="submit"
                  variant="destructive"
                >
                  {isDeletingIdeas ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                  {isDeletingIdeas
                    ? "Deleting..."
                    : `Delete selected${
                        visibleSelectedSavedIdeaIds.length
                          ? ` (${visibleSelectedSavedIdeaIds.length})`
                          : ""
                      }`}
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        {deleteState.message ? (
          <div
            className={cn(
              "mt-4 rounded-lg border px-4 py-3 text-sm",
              deleteState.status === "success"
                ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100"
                : "border-red-400/25 bg-red-400/[0.08] text-red-100",
            )}
            role={deleteState.status === "error" ? "alert" : "status"}
          >
            {deleteState.message}
          </div>
        ) : null}

        {visibleSavedIdeas.length > 0 ? (
          showAllSavedIdeas ? (
            <div className="mt-5 space-y-8">
              {groupedSavedIdeas.map((group) => (
                <div key={group.label}>
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <h4 className="text-sm font-semibold text-white">{group.label}</h4>
                    <p className="text-xs text-zinc-500">
                      {group.ideas.length} idea{group.ideas.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {group.ideas.map((idea) => renderSavedIdeaCard(idea))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {visibleSavedIdeas.map((idea) => renderSavedIdeaCard(idea))}
            </div>
          )
        ) : (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
            <p className="font-medium text-zinc-300">No saved ideas for this niche yet.</p>
            <p className="mt-2">
              Generate and save ideas for this niche to build your idea bank.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
