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
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateCaptionSet,
  type CaptionIdea,
  type CaptionProfile,
  type CaptionSet,
  type GeneratedCaption,
} from "@/lib/caption-generator";
import { cn } from "@/lib/utils";
import { saveCaption, type SaveCaptionState } from "./actions";

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

function SaveCaptionButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit">
      {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
      {pending ? "Saving..." : "Save caption"}
    </Button>
  );
}

function captionToClipboard(caption: GeneratedCaption) {
  return [caption.hook, caption.body, caption.cta, caption.hashtags]
    .filter(Boolean)
    .join("\n\n");
}

export function CaptionWorkspace({
  profile,
  ideas,
  savedCaptions,
}: CaptionWorkspaceProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState(ideas[0]?.id ?? "");
  const [captionSet, setCaptionSet] = useState<CaptionSet | null>(null);
  const [state, formAction] = useActionState(saveCaption, initialState);

  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0],
    [ideas, selectedIdeaId],
  );

  function selectIdea(ideaId: string) {
    setSelectedIdeaId(ideaId);
    setCaptionSet(null);
  }

  function generateCaptions() {
    if (!selectedIdea) {
      return;
    }

    setCaptionSet(generateCaptionSet(profile, selectedIdea));
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
              <div className="flex items-start justify-between gap-4">
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
                  {captionSet ? "Generate again" : "Generate captions"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                    <CardTitle>Hook options</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {captionSet.hooks.map((hook, index) => (
                      <div
                        className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                        key={hook}
                      >
                        <p className="text-sm text-zinc-200">
                          <span className="mr-2 text-zinc-600">{index + 1}.</span>
                          {hook}
                        </p>
                        <CopyButton label="Copy hook" value={hook} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-5 text-emerald-300" />
                    <CardTitle>Caption variations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {captionSet.captions.map((caption) => (
                      <Card className="bg-white/[0.025]" key={caption.key}>
                        <CardHeader>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs text-emerald-300">
                                {caption.caption_type}
                              </p>
                              <CardTitle className="mt-2 text-lg">{caption.hook}</CardTitle>
                            </div>
                            <CopyButton
                              label="Copy caption"
                              value={captionToClipboard(caption)}
                            />
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
                            <SaveCaptionButton />
                          </form>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>CTA options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {captionSet.ctas.map((cta) => (
                        <div
                          className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                          key={cta}
                        >
                          <p className="text-sm text-zinc-300">{cta}</p>
                          <CopyButton label="Copy CTA" value={cta} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Hash className="size-5 text-emerald-300" />
                      <CardTitle>Hashtags</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-emerald-100">
                      {captionSet.hashtags}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      These are local planning hashtags, not live trend data.
                    </p>
                    <div className="mt-4">
                      <CopyButton label="Copy hashtags" value={captionSet.hashtags} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">
              Generate captions to see hooks, body variations, CTAs, and hashtags.
            </div>
          )}
        </section>
      </div>

      <section className="border-t border-white/10 pt-8">
        <div>
          <h3 className="text-lg font-semibold text-white">Saved caption bank</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {savedCaptions.length} saved caption{savedCaptions.length === 1 ? "" : "s"}
          </p>
        </div>

        {savedCaptions.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {savedCaptions.map((caption) => (
              <Card key={caption.id}>
                <CardHeader>
                  <p className="text-xs text-emerald-300">
                    {caption.caption_type ?? "Saved caption"}
                  </p>
                  <CardTitle className="text-lg">{caption.relatedIdeaTitle}</CardTitle>
                  <p className="text-xs text-zinc-600">
                    {caption.created_at
                      ? new Date(caption.created_at).toLocaleDateString()
                      : "Recently saved"}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm leading-6 text-zinc-300">
                    <p className="font-medium text-zinc-100">{caption.hook}</p>
                    <p className="whitespace-pre-line">{caption.body}</p>
                    <p>
                      <span className="text-zinc-600">CTA: </span>
                      {caption.cta}
                    </p>
                    <p className="text-emerald-200/90">{caption.hashtags}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
            Saved captions will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
