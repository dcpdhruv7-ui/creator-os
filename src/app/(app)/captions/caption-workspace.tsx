"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  Clipboard,
  Copy,
  Hash,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { captionFingerprint } from "@/lib/caption-fingerprint";
import {
  creativeDirectionOptions,
  describeCreativeDirection,
  generateCaptionSet,
  type CaptionIdea,
  type CaptionProfile,
  type CaptionSet,
  type CreativeDirection,
  type GeneratedCaption,
  type RemixMode,
} from "@/lib/caption-generator";
import { cn } from "@/lib/utils";
import {
  clearCaptionsForIdea,
  deleteCaption,
  saveCaption,
  type ClearCaptionsState,
  type DeleteCaptionState,
  type SaveCaptionState,
} from "./actions";

export type SavedCaption = {
  id: string;
  content_idea_id: string | null;
  relatedIdeaTitle: string;
  caption_type: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string | null;
  created_at: string | null;
};

type CaptionWorkspaceProps = {
  profile: CaptionProfile;
  ideas: CaptionIdea[];
  savedCaptions: SavedCaption[];
};

const initialState: SaveCaptionState = { status: "idle", message: "" };
const initialDeleteState: DeleteCaptionState = { status: "idle", message: "" };
const initialClearState: ClearCaptionsState = { status: "idle", message: "" };

const remixButtons: Array<{
  label: string;
  remix: RemixMode;
  direction?: CreativeDirection;
}> = [
  { label: "Regenerate all", remix: "all" },
  { label: "Regenerate hooks", remix: "hooks" },
  { label: "Regenerate captions", remix: "captions" },
  { label: "Shorter", remix: "shorter" },
  { label: "More emotional", remix: "emotional", direction: "emotional" },
  { label: "More direct", remix: "direct", direction: "bold" },
  { label: "Hinglish", remix: "hinglish", direction: "hinglish" },
  { label: "More educational", remix: "educational", direction: "educational" },
];

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Button onClick={copyValue} size="sm" type="button" variant="secondary">
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function SaveCaptionButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || saved} size="sm" type="submit" variant={saved ? "secondary" : "default"}>
      {saved ? <Check /> : pending ? <LoaderCircle className="animate-spin" /> : <Save />}
      {saved ? "Saved" : pending ? "Saving..." : "Save caption"}
    </Button>
  );
}

function DeleteCaptionButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit" variant="secondary">
      {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}

function ClearCaptionsButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit" variant="secondary">
      {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
      {pending ? "Clearing..." : "Clear all for this idea"}
    </Button>
  );
}

function captionToClipboard(caption: GeneratedCaption) {
  return [caption.hook, caption.body, caption.cta, caption.hashtags]
    .filter(Boolean)
    .join("\n\n");
}

function savedCaptionKey(caption: SavedCaption) {
  return captionFingerprint(caption);
}

function generatedCaptionKey(contentIdeaId: string, caption: GeneratedCaption) {
  return captionFingerprint({
    content_idea_id: contentIdeaId,
    hook: caption.hook,
    body: caption.body,
    cta: caption.cta,
    hashtags: caption.hashtags,
  });
}

function dedupeSavedCaptions(captions: SavedCaption[]) {
  const seen = new Set<string>();
  let hiddenCount = 0;

  const deduped = captions.filter((caption) => {
    const key = savedCaptionKey(caption);

    if (seen.has(key)) {
      hiddenCount += 1;
      return false;
    }

    seen.add(key);
    return true;
  });

  return { captions: deduped, hiddenCount };
}

function groupSavedCaptionsByIdea(captions: SavedCaption[]) {
  const groups = new Map<string, SavedCaption[]>();

  captions.forEach((caption) => {
    const title = caption.relatedIdeaTitle || "Saved content idea";
    groups.set(title, [...(groups.get(title) ?? []), caption]);
  });

  return [...groups.entries()].map(([title, captions]) => ({ title, captions }));
}

export function CaptionWorkspace({
  profile,
  ideas,
  savedCaptions,
}: CaptionWorkspaceProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState(ideas[0]?.id ?? "");
  const [captionSet, setCaptionSet] = useState<CaptionSet | null>(null);
  const [creativeDirection, setCreativeDirection] =
    useState<CreativeDirection>("balanced");
  const [showAllSavedCaptions, setShowAllSavedCaptions] = useState(false);
  const [variant, setVariant] = useState(0);
  const [state, formAction] = useActionState(saveCaption, initialState);
  const [deleteState, deleteAction] = useActionState(deleteCaption, initialDeleteState);
  const [clearState, clearAction] = useActionState(
    clearCaptionsForIdea,
    initialClearState,
  );

  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0],
    [ideas, selectedIdeaId],
  );
  const deletedCaptionIds = useMemo(
    () =>
      new Set([
        ...(deleteState.deletedCaptionIds ?? []),
        ...(clearState.deletedCaptionIds ?? []),
      ]),
    [clearState.deletedCaptionIds, deleteState.deletedCaptionIds],
  );
  const dedupedSavedCaptionResult = useMemo(
    () =>
      dedupeSavedCaptions(
        [...(state.savedCaptions ?? []), ...savedCaptions].filter(
          (caption) => !deletedCaptionIds.has(caption.id),
        ),
      ),
    [deletedCaptionIds, savedCaptions, state.savedCaptions],
  );
  const visibleSavedCaptions = dedupedSavedCaptionResult.captions;
  const hiddenDuplicateCount = dedupedSavedCaptionResult.hiddenCount;
  const selectedIdeaSavedCaptions = useMemo(
    () =>
      visibleSavedCaptions.filter(
        (caption) => caption.content_idea_id === selectedIdea?.id,
      ),
    [selectedIdea?.id, visibleSavedCaptions],
  );
  const savedCaptionKeys = useMemo(
    () => new Set(visibleSavedCaptions.map((caption) => savedCaptionKey(caption))),
    [visibleSavedCaptions],
  );
  const groupedSavedCaptions = useMemo(
    () => groupSavedCaptionsByIdea(visibleSavedCaptions),
    [visibleSavedCaptions],
  );

  function nextCaptionSet(remix: RemixMode, direction = creativeDirection) {
    if (!selectedIdea) {
      return null;
    }

    const nextVariant = variant + 1;
    setVariant(nextVariant);
    const currentHooks = captionSet?.hooks.map((hook) => hook.text) ?? [];
    const currentCaptions =
      captionSet?.captions.map((caption) => ({
        hook: caption.hook,
        body: caption.body,
      })) ?? [];
    const savedCaptionsForIdea = selectedIdeaSavedCaptions.map((caption) => ({
      hook: caption.hook,
      body: caption.body,
    }));

    return generateCaptionSet(profile, selectedIdea, {
      direction,
      remix,
      variant: nextVariant,
      excludeHooks: currentHooks,
      excludeCaptions: [...currentCaptions, ...savedCaptionsForIdea],
    });
  }

  function selectIdea(ideaId: string) {
    setSelectedIdeaId(ideaId);
    setCaptionSet(null);
    setVariant(0);
  }

  function generateCaptions() {
    const nextSet = nextCaptionSet("all");

    if (nextSet) {
      setCaptionSet(nextSet);
    }
  }

  function confirmClearSelectedIdea() {
    return window.confirm("Clear all saved captions for this idea?");
  }

  function applyRemix(remix: RemixMode, direction = creativeDirection) {
    setCreativeDirection(direction);

    const nextSet = nextCaptionSet(remix, direction);

    if (!nextSet) {
      return;
    }

    setCaptionSet((current) => {
      if (!current || remix === "all") {
        return nextSet;
      }

      if (remix === "hooks") {
        return { ...current, direction, hooks: nextSet.hooks };
      }

      return {
        ...current,
        direction,
        captions: nextSet.captions,
        ctas: nextSet.ctas,
        hashtagSets: nextSet.hashtagSets,
      };
    });
  }

  function renderSavedCaptionCard(caption: SavedCaption) {
    return (
      <Card key={caption.id}>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs text-emerald-300">
                {caption.caption_type ?? "Saved caption"}
              </p>
              <CardTitle className="mt-2 text-lg">{caption.hook}</CardTitle>
              <p className="mt-2 text-xs text-zinc-600">
                {caption.created_at
                  ? new Date(caption.created_at).toLocaleDateString()
                  : "Recently saved"}
              </p>
            </div>
            <form action={deleteAction}>
              <input name="caption_id" type="hidden" value={caption.id} />
              <DeleteCaptionButton />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm leading-6 text-zinc-300">
            <p className="whitespace-pre-line">{caption.body}</p>
            <p>
              <span className="text-zinc-600">CTA: </span>
              {caption.cta}
            </p>
            <p className="text-emerald-200/90">{caption.hashtags}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Clipboard />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Saved ideas</h3>
              <p className="text-sm text-zinc-400">Select one idea to write from.</p>
            </div>
          </div>

          <div className="space-y-3">
            {ideas.map((idea) => {
              const selected = idea.id === selectedIdea?.id;

              return (
                <button
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-colors",
                    selected
                      ? "border-emerald-300/60 bg-emerald-400/[0.07]"
                      : "border-white/10 bg-zinc-950/72 hover:border-white/25",
                  )}
                  key={idea.id}
                  onClick={() => selectIdea(idea.id)}
                  type="button"
                >
                  <p className="text-xs text-emerald-300">{idea.format ?? "Saved idea"}</p>
                  <h4 className="mt-2 text-sm font-semibold leading-5 text-white">
                    {idea.title}
                  </h4>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
                    {idea.hook ?? "Generate captions from this idea."}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Card className="border-emerald-300/20">
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs text-emerald-300">
                    {selectedIdea?.format ?? "Caption source"}
                  </p>
                  <CardTitle className="mt-2 text-xl">
                    {selectedIdea?.title ?? "Choose a saved idea"}
                  </CardTitle>
                </div>
                <Button disabled={!selectedIdea} onClick={generateCaptions} type="button">
                  <RefreshCw />
                  {captionSet ? "Generate another version" : "Generate captions"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.025] p-4">
                <label className="text-xs font-medium text-zinc-500" htmlFor="creative-direction">
                  Creative direction
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <select
                    className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 sm:min-w-64"
                    id="creative-direction"
                    onChange={(event) =>
                      setCreativeDirection(event.target.value as CreativeDirection)
                    }
                    value={creativeDirection}
                  >
                    {creativeDirectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button disabled={!selectedIdea} onClick={generateCaptions} type="button" variant="secondary">
                    <SlidersHorizontal />
                    Apply direction
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  Current output is tuned to feel {describeCreativeDirection(creativeDirection)}.
                </p>
              </div>

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-600">Niche</dt>
                  <dd className="mt-1 text-zinc-200">
                    {selectedIdea?.niche ?? profile.niche}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-600">Direction</dt>
                  <dd className="mt-1 text-zinc-200">
                    {selectedIdea?.sub_niche ?? profile.subNiche}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-600">Goal</dt>
                  <dd className="mt-1 text-zinc-200">{selectedIdea?.goal ?? "Growth"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-600">Priority</dt>
                  <dd className="mt-1 text-zinc-200">
                    {selectedIdea?.priority ?? "Medium"}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm leading-6">
                <p>
                  <span className="text-zinc-600">Hook: </span>
                  <span className="text-zinc-300">{selectedIdea?.hook}</span>
                </p>
                <p>
                  <span className="text-zinc-600">Caption angle: </span>
                  <span className="text-zinc-300">{selectedIdea?.caption_angle}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {captionSet ? (
            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap gap-2">
                {remixButtons.map((button) => (
                  <Button
                    key={button.label}
                    onClick={() =>
                      applyRemix(button.remix, button.direction ?? creativeDirection)
                    }
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <RefreshCw />
                    {button.label}
                  </Button>
                ))}
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

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="size-5 text-emerald-300" />
                    <CardTitle>Hook Bank</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {captionSet.hooks.map((hook, index) => (
                      <div
                        className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                        key={hook.key}
                      >
                        <div>
                          <p className="text-xs font-medium text-emerald-300">
                            {index + 1}. {hook.category}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-200">{hook.text}</p>
                        </div>
                        <CopyButton label="Copy hook" value={hook.text} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-5 text-emerald-300" />
                    <CardTitle>Caption Variations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {captionSet.captions.map((caption) => {
                      const isSaved = savedCaptionKeys.has(
                        generatedCaptionKey(selectedIdea.id, caption),
                      );

                      return (
                        <div
                          className="rounded-lg border border-white/10 bg-white/[0.025] p-5"
                          key={caption.key}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs text-emerald-300">
                                {caption.caption_type}
                              </p>
                              <h4 className="mt-2 text-lg font-semibold leading-6 text-white">
                                {caption.hook}
                              </h4>
                            </div>
                            <CopyButton
                              label="Copy caption"
                              value={captionToClipboard(caption)}
                            />
                          </div>
                          <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-300">
                            <p className="whitespace-pre-line">{caption.body}</p>
                            <p>
                              <span className="text-zinc-600">CTA: </span>
                              {caption.cta}
                            </p>
                            <p>
                              <span className="text-zinc-600">
                                {caption.hashtag_category}:{" "}
                              </span>
                              <span className="text-emerald-200/90">{caption.hashtags}</span>
                            </p>
                          </div>
                          <form action={formAction} className="mt-5 flex justify-end">
                            <input
                              name="content_idea_id"
                              type="hidden"
                              value={selectedIdea.id}
                            />
                            <input
                              name="caption_type"
                              type="hidden"
                              value={caption.caption_type}
                            />
                            <input name="hook" type="hidden" value={caption.hook} />
                            <input name="body" type="hidden" value={caption.body} />
                            <input name="cta" type="hidden" value={caption.cta} />
                            <input name="hashtags" type="hidden" value={caption.hashtags} />
                            <SaveCaptionButton saved={isSaved} />
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>CTA Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {captionSet.ctas.map((cta) => (
                        <div
                          className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                          key={cta.key}
                        >
                          <div>
                            <p className="text-xs text-emerald-300">{cta.category}</p>
                            <p className="mt-1 text-sm text-zinc-300">{cta.text}</p>
                          </div>
                          <CopyButton label="Copy CTA" value={cta.text} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Hash className="size-5 text-emerald-300" />
                      <CardTitle>Hashtag Sets</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {captionSet.hashtagSets.map((set) => (
                        <div
                          className="rounded-md border border-white/10 bg-white/[0.025] p-3"
                          key={set.key}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs text-emerald-300">{set.category}</p>
                              <p className="mt-1 text-sm leading-6 text-emerald-100">
                                {set.hashtags}
                              </p>
                            </div>
                            <CopyButton label="Copy set" value={set.hashtags} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      These are local planning hashtags, not live trend data.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">
              Generate captions to see hooks, body variations, CTAs, and hashtag sets.
            </div>
          )}
        </section>
      </div>

      <section className="border-t border-white/10 pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Saved Captions</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {showAllSavedCaptions
                ? `${visibleSavedCaptions.length} saved caption${visibleSavedCaptions.length === 1 ? "" : "s"} total`
                : `${selectedIdeaSavedCaptions.length} saved caption${selectedIdeaSavedCaptions.length === 1 ? "" : "s"} for this idea`}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Saved captions stay in your caption bank. You can delete old versions or regenerate new ones anytime.
            </p>
            {hiddenDuplicateCount > 0 ? (
              <p className="mt-2 text-sm text-amber-200">
                Duplicate saved captions hidden.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowAllSavedCaptions((current) => !current)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {showAllSavedCaptions ? "Show selected idea only" : "Show all saved captions"}
            </Button>
            {!showAllSavedCaptions && selectedIdeaSavedCaptions.length > 0 ? (
              <form action={clearAction} onSubmit={confirmClearSelectedIdea}>
                <input name="content_idea_id" type="hidden" value={selectedIdea.id} />
                <ClearCaptionsButton />
              </form>
            ) : null}
          </div>
        </div>

        {[deleteState, clearState].map((actionState) =>
          actionState.message ? (
            <div
              className={cn(
                "mt-4 rounded-lg border px-4 py-3 text-sm",
                actionState.status === "success"
                  ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100"
                  : "border-red-400/25 bg-red-400/[0.08] text-red-100",
              )}
              key={`${actionState.status}-${actionState.message}`}
              role={actionState.status === "error" ? "alert" : "status"}
            >
              {actionState.message}
            </div>
          ) : null,
        )}

        {showAllSavedCaptions ? (
          groupedSavedCaptions.length > 0 ? (
            <div className="mt-5 space-y-6">
              {groupedSavedCaptions.map((group) => (
                <div key={group.title}>
                  <div className="mb-3">
                    <h4 className="text-base font-semibold text-white">{group.title}</h4>
                    <p className="mt-1 text-sm text-zinc-500">
                      {group.captions.length} saved caption{group.captions.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {group.captions.map((caption) => renderSavedCaptionCard(caption))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
              Saved captions will appear here.
            </div>
          )
        ) : selectedIdeaSavedCaptions.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {selectedIdeaSavedCaptions.map((caption) => renderSavedCaptionCard(caption))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
            Saved captions for this idea will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
