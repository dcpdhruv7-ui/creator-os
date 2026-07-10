"use client";

import { useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Check, Layers3, LoaderCircle, RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateAdaptiveIdeas,
  type GeneratedIdea,
  type IdeaProfile,
} from "@/lib/content-ideas";
import { cn } from "@/lib/utils";
import {
  saveGeneratedIdeas,
  type SaveIdeasState,
  updateSavedIdea,
} from "./actions";

export type SavedIdea = {
  id: string;
  title: string;
  hook: string | null;
  format: string | null;
  difficulty: string | null;
  goal: string | null;
  status: string | null;
  priority: string | null;
};

type IdeaEngineProps = {
  profile: IdeaProfile;
  savedIdeas: SavedIdea[];
};

const initialState: SaveIdeasState = { status: "idle", message: "" };
const statuses = ["Idea", "Scripted", "Shot", "Editing", "Scheduled", "Posted"];
const priorities = ["Low", "Medium", "High"];

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
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [state, setState] = useState<SaveIdeasState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [generationOffset, setGenerationOffset] = useState(0);
  const [localSavedIdeaTitles, setLocalSavedIdeaTitles] = useState(
    savedIdeas.map((idea) => idea.title),
  );

  function generateIdeas() {
    const nextOffset = generationOffset;
    setGeneratedIdeas(
      generateAdaptiveIdeas(profile, {
        count: 10,
        excludeTitles: localSavedIdeaTitles,
        offset: nextOffset,
      }),
    );
    setGenerationOffset(nextOffset + 10);
    setSelectedKeys([]);
  }

  function toggleIdea(key: string) {
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  function toggleAll() {
    setSelectedKeys((current) =>
      current.length === generatedIdeas.length ? [] : generatedIdeas.map((idea) => idea.key),
    );
  }

  async function saveSelectedIdeas(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedKeys.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const nextState = await saveGeneratedIdeas(state, formData);
      setState(nextState);

      if (nextState.status !== "success" || !nextState.savedIdeaKeys?.length) {
        return;
      }

      const savedKeySet = new Set(nextState.savedIdeaKeys);
      const savedTitleSet = new Set(nextState.savedIdeaTitles ?? []);
      const nextOffset = generationOffset;

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
        const replacements = generateAdaptiveIdeas(profile, {
          count: replacementCount,
          excludeTitles,
          offset: nextOffset,
        });

        return [...remainingIdeas, ...replacements].slice(0, 10);
      });
      setGenerationOffset(nextOffset + 10);
      setLocalSavedIdeaTitles((current) => [
        ...new Set([...current, ...(nextState.savedIdeaTitles ?? [])]),
      ]);
      setSelectedKeys([]);
    } finally {
      setIsSaving(false);
    }
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
          </div>
          <Button onClick={generateIdeas} type="button">
            <RefreshCw />
            {generatedIdeas.length ? "Generate again" : "Generate 10 ideas"}
          </Button>
        </div>

        {generatedIdeas.length > 0 ? (
          <form className="mt-5 space-y-5" onSubmit={saveSelectedIdeas}>
            {selectedKeys.map((key) => (
              <input key={key} name="idea_keys" type="hidden" value={key} />
            ))}

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                {selectedKeys.length} of {generatedIdeas.length} selected
              </p>
              <Button onClick={toggleAll} size="sm" type="button" variant="ghost">
                {selectedKeys.length === generatedIdeas.length ? "Clear selection" : "Select all"}
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {generatedIdeas.map((idea) => {
                const selected = selectedKeys.includes(idea.key);

                return (
                  <Card
                    aria-checked={selected}
                    className={cn(
                      "relative cursor-pointer transition-colors hover:border-white/25",
                      selected && "border-emerald-300/70 bg-emerald-400/[0.06]",
                    )}
                    key={idea.key}
                    onClick={() => toggleIdea(idea.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleIdea(idea.key);
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
                {state.message}
              </div>
            ) : null}

            <div className="flex justify-end">
              <SaveIdeasButton disabled={selectedKeys.length === 0} pending={isSaving} />
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">
            Generate your first set of ten ideas.
          </div>
        )}
      </section>

      <section className="border-t border-white/10 pt-8">
        <div>
          <h3 className="text-lg font-semibold text-white">Saved idea bank</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {savedIdeas.length} saved idea{savedIdeas.length === 1 ? "" : "s"}
          </p>
        </div>

        {savedIdeas.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {savedIdeas.map((idea) => (
              <Card key={idea.id}>
                <CardHeader>
                  <p className="text-xs text-emerald-300">{idea.format ?? "Content idea"}</p>
                  <CardTitle>{idea.title}</CardTitle>
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
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
            Saved ideas will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
