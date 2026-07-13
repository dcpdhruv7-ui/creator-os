"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Captions,
  Lightbulb,
  Pencil,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PostInsightEntry = {
  id: string;
  content_idea_id: string | null;
  platform: string | null;
  post_title: string | null;
  niche: string | null;
  sub_niche: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  follows_gained: number | null;
  notes?: string | null;
  posted_at: string | null;
};

export type PostInsightIdea = {
  id: string;
  title: string;
  niche: string | null;
  sub_niche: string | null;
  format: string | null;
};

export type PostInsightCaption = {
  id: string;
  content_idea_id: string | null;
  caption_type: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string | null;
};

export type PostInsightDetail = {
  entry: PostInsightEntry;
  idea?: PostInsightIdea | null;
  caption?: PostInsightCaption | null;
};

type PostInsightDrawerProps = {
  detail: PostInsightDetail | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (entry: PostInsightEntry) => void;
};

function metric(value: number | null | undefined) {
  return value ?? 0;
}

function formatNumber(value: number | null | undefined) {
  return metric(value).toLocaleString();
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function displayDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function engagement(entry: PostInsightEntry) {
  return metric(entry.likes) + metric(entry.comments) + metric(entry.shares) + metric(entry.saves);
}

function engagementRate(entry: PostInsightEntry) {
  const views = metric(entry.views);

  if (views <= 0) return 0;

  return (engagement(entry) / views) * 100;
}

function buildWhyItWorked(detail: PostInsightDetail) {
  const { entry } = detail;
  const views = metric(entry.views);
  const saves = metric(entry.saves);
  const shares = metric(entry.shares);
  const comments = metric(entry.comments);
  const rate = engagementRate(entry);
  const reasons: string[] = [];

  if (saves >= 5 || saves >= comments + shares) {
    reasons.push(
      "This post has strong saves, which may suggest it was useful or worth revisiting.",
    );
  }

  if (shares >= 3 || shares > saves) {
    reasons.push(
      "This post has meaningful shares, which may suggest the idea felt relatable or share-worthy.",
    );
  }

  if (comments >= 3) {
    reasons.push(
      "This post created discussion. Consider making a follow-up or response post from the comments.",
    );
  }

  if (views >= 1000 && rate < 2) {
    reasons.push(
      "This post reached people, but engagement was lower. Try a clearer CTA or stronger value hook next time.",
    );
  }

  if (rate >= 5) {
    reasons.push(
      "This post had strong engagement compared with its views based on your tracked data.",
    );
  }

  if (!entry.content_idea_id && !detail.idea) {
    reasons.push(
      "Link this analytics entry to a saved idea for better format and niche recommendations.",
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "This entry is still useful signal. Add more tracked posts so Creator OS can compare patterns more confidently.",
    );
  }

  return reasons.slice(0, 4);
}

function buildNextMoves(detail: PostInsightDetail) {
  const { entry, idea, caption } = detail;
  const moves: string[] = [];
  const rate = engagementRate(entry);

  if (metric(entry.views) > 0) {
    moves.push("Create a follow-up post using the same format or topic angle.");
  }

  if (metric(entry.saves) > 0 || idea?.format?.toLowerCase().includes("tutorial")) {
    moves.push("Turn the useful part into a tutorial, checklist, or breakdown.");
  }

  if (metric(entry.comments) > 0 || rate >= 5) {
    moves.push("Use the comments or strongest reaction as the next post prompt.");
  }

  if (!caption) {
    moves.push("Generate captions for a follow-up idea before scheduling the next version.");
  }

  if (!entry.content_idea_id && !idea) {
    moves.push("Link this entry to a saved idea so recommendations can learn from it.");
  }

  if (moves.length < 2) {
    moves.push("Schedule a similar post this week and compare the result.");
  }

  return Array.from(new Set(moves)).slice(0, 4);
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-zinc-100">{value}</p>
    </div>
  );
}

export function PostInsightDrawer({ detail, open, onClose, onEdit }: PostInsightDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !detail) {
    return null;
  }

  const { entry, idea, caption } = detail;
  const whyItWorked = buildWhyItWorked(detail);
  const nextMoves = buildNextMoves(detail);
  const title = entry.post_title ?? idea?.title ?? "Manual analytics entry";
  const nicheLabel = entry.niche
    ? `${entry.niche} / ${entry.sub_niche ?? "General"}`
    : "Unlinked";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={onClose}
      role="presentation"
    >
      <aside
        aria-label="Post insight details"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-lg border border-white/10 bg-zinc-950 shadow-2xl sm:max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-zinc-950/95 p-4 backdrop-blur">
          <div>
            <p className="text-sm font-medium text-emerald-300">Post insight</p>
            <h3 className="mt-1 text-xl font-semibold leading-7 text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {entry.platform ?? "Platform"} / {displayDate(entry.posted_at)} / {nicheLabel}
            </p>
          </div>
          <Button aria-label="Close post insight" onClick={onClose} size="icon" type="button" variant="ghost">
            <X />
          </Button>
        </div>

        <div className="space-y-5 p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Views" value={formatNumber(entry.views)} />
            <MetricTile label="Likes" value={formatNumber(entry.likes)} />
            <MetricTile label="Comments" value={formatNumber(entry.comments)} />
            <MetricTile label="Shares" value={formatNumber(entry.shares)} />
            <MetricTile label="Saves" value={formatNumber(entry.saves)} />
            <MetricTile label="Reach" value={formatNumber(entry.reach)} />
            <MetricTile label="Follows gained" value={formatNumber(entry.follows_gained)} />
            <MetricTile label="Engagement rate" value={formatPercent(engagementRate(entry))} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-sm font-medium text-white">Linked saved idea</p>
              {idea ? (
                <div className="mt-2 space-y-2 text-sm leading-6 text-zinc-300">
                  <p className="font-medium text-emerald-100">{idea.title}</p>
                  <p className="text-zinc-500">
                    {idea.format ?? "No format"} / {idea.niche ?? "No niche"} /{" "}
                    {idea.sub_niche ?? "General"}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  No saved idea is linked to this tracked post yet.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-sm font-medium text-white">Linked caption</p>
              {caption ? (
                <div className="mt-2 space-y-2 text-sm leading-6 text-zinc-300">
                  <p className="text-xs font-medium text-emerald-300">
                    {caption.caption_type ?? "Caption"}
                  </p>
                  {caption.hook ? <p className="font-medium text-zinc-100">{caption.hook}</p> : null}
                  {caption.body ? <p className="line-clamp-4 text-zinc-400">{caption.body}</p> : null}
                  {caption.cta ? <p className="text-zinc-500">CTA: {caption.cta}</p> : null}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  No saved caption is linked to this idea yet.
                </p>
              )}
            </div>
          </div>

          {entry.notes ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-sm font-medium text-white">Notes</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{entry.notes}</p>
            </div>
          ) : null}

          <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.06] p-4">
            <p className="text-sm font-medium text-emerald-100">Why this may have worked</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-50/85">
              {whyItWorked.map((reason) => (
                <li className="flex gap-2" key={reason}>
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-300" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <p className="text-sm font-medium text-white">Next moves</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {nextMoves.map((move) => (
                <li className="flex gap-2" key={move}>
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-500" />
                  <span>{move}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {onEdit ? (
              <Button
                onClick={() => {
                  onEdit(entry);
                  onClose();
                }}
                type="button"
              >
                <Pencil />
                Edit in Analytics
              </Button>
            ) : (
              <Button asChild>
                <Link href="/analytics">
                  <Pencil />
                  Edit in Analytics
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href="/analytics">
                <BarChart3 />
                Go to Analytics
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/ideas">
                <Lightbulb />
                Go to Ideas
              </Link>
            </Button>
            <Button
              asChild
              className={cn(!idea && "opacity-60")}
              variant="secondary"
            >
              <Link href="/captions">
                <Captions />
                Go to Captions
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/calendar">
                <CalendarDays />
                Go to Calendar
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
