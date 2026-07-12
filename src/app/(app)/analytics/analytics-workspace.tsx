"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BarChart3,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createAnalyticsEntry,
  deleteAnalyticsEntry,
  updateAnalyticsEntry,
  type AnalyticsActionState,
  type AnalyticsEntryPayload,
} from "./actions";

export type AnalyticsIdea = {
  id: string;
  title: string;
  niche: string | null;
  sub_niche: string | null;
  format: string | null;
};

export type AnalyticsCalendarPost = {
  id: string;
  content_idea_id: string | null;
  title: string;
  platform: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

type AnalyticsWorkspaceProps = {
  entries: AnalyticsEntryPayload[];
  ideas: AnalyticsIdea[];
  calendarPosts: AnalyticsCalendarPost[];
  currentNiche: string | null;
  currentSubNiche: string | null;
};

const platforms = ["Instagram", "YouTube Shorts", "TikTok", "LinkedIn", "Twitter / X", "Other"];
const initialActionState: AnalyticsActionState = { status: "idle", message: "" };

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function metric(value: number | null | undefined) {
  return value ?? 0;
}

function engagementRate(entry: Pick<AnalyticsEntryPayload, "views" | "likes" | "comments" | "shares" | "saves">) {
  const views = metric(entry.views);

  if (views <= 0) return 0;

  return ((metric(entry.likes) + metric(entry.comments) + metric(entry.shares) + metric(entry.saves)) / views) * 100;
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function formatNumber(value: number | null | undefined) {
  return metric(value).toLocaleString();
}

function cleanMetricInput(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits.replace(/^0+(?=\d)/, "");
}

function entryMatchesCurrentNiche(
  entry: AnalyticsEntryPayload,
  currentNiche: string | null,
  currentSubNiche: string | null,
) {
  if (!entry.niche && !entry.sub_niche) {
    return false;
  }

  return entry.niche === currentNiche && entry.sub_niche === currentSubNiche;
}

function sumBy<T>(items: T[], getKey: (item: T) => string | null | undefined, getValue: (item: T) => number) {
  const totals = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item) || "Unknown";
    totals.set(key, (totals.get(key) ?? 0) + getValue(item));
  });

  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

function dateKey(value: string | null) {
  return value ? value.slice(0, 10) : "No date";
}

function compactDate(value: string) {
  if (value === "No date") return value;

  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function aggregateByDate(entries: AnalyticsEntryPayload[]) {
  const totals = new Map<
    string,
    {
      views: number;
      engagements: number;
    }
  >();

  entries.forEach((entry) => {
    const key = dateKey(entry.posted_at);
    const current = totals.get(key) ?? { views: 0, engagements: 0 };
    current.views += metric(entry.views);
    current.engagements +=
      metric(entry.likes) + metric(entry.comments) + metric(entry.shares) + metric(entry.saves);
    totals.set(key, current);
  });

  return [...totals.entries()]
    .map(([date, values]) => ({
      date,
      views: values.views,
      engagementRate: values.views > 0 ? (values.engagements / values.views) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function platformStats(entries: AnalyticsEntryPayload[]) {
  return platforms.map((platform) => {
    const platformEntries = entries.filter((entry) => entry.platform === platform);
    const views = platformEntries.reduce((sum, entry) => sum + metric(entry.views), 0);
    const engagements = platformEntries.reduce(
      (sum, entry) =>
        sum +
        metric(entry.likes) +
        metric(entry.comments) +
        metric(entry.shares) +
        metric(entry.saves),
      0,
    );

    return {
      platform,
      views,
      engagementRate: views > 0 ? (engagements / views) * 100 : 0,
      count: platformEntries.length,
    };
  });
}

function metricBreakdown(entries: AnalyticsEntryPayload[]) {
  return [
    ["Views", entries.reduce((sum, entry) => sum + metric(entry.views), 0)],
    ["Likes", entries.reduce((sum, entry) => sum + metric(entry.likes), 0)],
    ["Comments", entries.reduce((sum, entry) => sum + metric(entry.comments), 0)],
    ["Shares", entries.reduce((sum, entry) => sum + metric(entry.shares), 0)],
    ["Saves", entries.reduce((sum, entry) => sum + metric(entry.saves), 0)],
    ["Reach", entries.reduce((sum, entry) => sum + metric(entry.reach), 0)],
    ["Follows", entries.reduce((sum, entry) => sum + metric(entry.follows_gained), 0)],
  ] satisfies Array<[string, number]>;
}

function AnalyticsStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="border-emerald-300/20">
      <CardHeader>
        <CardTitle className="text-sm text-zinc-400">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function BarChartCard({
  title,
  description,
  data,
  valueLabel,
  empty,
}: {
  title: string;
  description: string;
  data: Array<{ label: string; value: number; helper?: string }>;
  valueLabel: (value: number) => string;
  empty: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-6 text-zinc-500">{description}</p>
      </CardHeader>
      <CardContent>
        {data.length > 1 && maxValue > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div className="grid gap-2" key={item.label}>
                <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-zinc-400">{item.label}</span>
                  <span className="shrink-0 font-medium text-zinc-100">
                    {valueLabel(item.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-300"
                    style={{ width: `${Math.max(4, (item.value / maxValue) * 100)}%` }}
                  />
                </div>
                {item.helper ? <p className="text-xs text-zinc-600">{item.helper}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
            {empty}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PlatformComparisonCard({
  data,
}: {
  data: Array<{ platform: string; views: number; engagementRate: number; count: number }>;
}) {
  const maxViews = Math.max(...data.map((item) => item.views), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform comparison</CardTitle>
        <p className="text-sm leading-6 text-zinc-500">
          Compare total views and average engagement rate by platform.
        </p>
      </CardHeader>
      <CardContent>
        {data.some((item) => item.count > 0) ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3" key={item.platform}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.platform}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.count} tracked post{item.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <p>{formatNumber(item.views)} views</p>
                    <p>{formatPercent(item.engagementRate)} engagement</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-300"
                    style={{
                      width:
                        item.views > 0 && maxViews > 0
                          ? `${Math.max(4, (item.views / maxViews) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
            Add analytics entries to compare platforms.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsWorkspace({
  entries,
  ideas,
  calendarPosts,
  currentNiche,
  currentSubNiche,
}: AnalyticsWorkspaceProps) {
  const today = dateInputValue(new Date());
  const [localEntries, setLocalEntries] = useState(entries);
  const [showAllNiches, setShowAllNiches] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [actionState, setActionState] = useState(initialActionState);
  const [deleteState, setDeleteState] = useState(initialActionState);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [postedAt, setPostedAt] = useState(today);
  const [postTitle, setPostTitle] = useState("");
  const [views, setViews] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  const [reach, setReach] = useState("");
  const [followsGained, setFollowsGained] = useState("");
  const [manualNiche, setManualNiche] = useState(currentNiche ?? "");
  const [manualSubNiche, setManualSubNiche] = useState(currentSubNiche ?? "");
  const [notes, setNotes] = useState("");
  const formCardRef = useRef<HTMLDivElement>(null);
  const postTitleInputRef = useRef<HTMLInputElement>(null);
  const ideaMap = useMemo(() => new Map(ideas.map((idea) => [idea.id, idea])), [ideas]);
  const calendarMap = useMemo(
    () => new Map(calendarPosts.map((post) => [post.id, post])),
    [calendarPosts],
  );
  const visibleEntries = localEntries.filter((entry) => {
    const nicheMatch = showAllNiches
      ? true
      : entryMatchesCurrentNiche(entry, currentNiche, currentSubNiche);
    const platformMatch = platformFilter === "All" || entry.platform === platformFilter;

    return nicheMatch && platformMatch;
  });
  const totalViews = visibleEntries.reduce((sum, entry) => sum + metric(entry.views), 0);
  const totalEngagements = visibleEntries.reduce(
    (sum, entry) =>
      sum + metric(entry.likes) + metric(entry.comments) + metric(entry.shares) + metric(entry.saves),
    0,
  );
  const averageEngagement = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
  const bestPost = [...visibleEntries].sort((a, b) => metric(b.views) - metric(a.views))[0];
  const bestPlatform = sumBy(visibleEntries, (entry) => entry.platform, (entry) => metric(entry.views))[0];
  const bestFormat = sumBy(
    visibleEntries,
    (entry) => ideaMap.get(entry.content_idea_id ?? "")?.format,
    (entry) => metric(entry.views),
  )[0];
  const topByViews = [...visibleEntries].sort((a, b) => metric(b.views) - metric(a.views)).slice(0, 5);
  const topByEngagement = [...visibleEntries]
    .sort((a, b) => engagementRate(b) - engagementRate(a))
    .slice(0, 5);
  const dateSeries = aggregateByDate(visibleEntries);
  const platformsSeries = platformStats(visibleEntries);
  const breakdown = metricBreakdown(visibleEntries);
  const insights = buildInsights(visibleEntries, bestPlatform?.[0], bestFormat?.[0]);
  const nicheOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [currentNiche, manualNiche, ...ideas.map((idea) => idea.niche)].filter(
            Boolean,
          ) as string[],
        ),
      ),
    [currentNiche, ideas, manualNiche],
  );
  const subNicheOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            currentSubNiche,
            manualSubNiche,
            ...ideas
              .filter((idea) => !manualNiche || idea.niche === manualNiche)
              .map((idea) => idea.sub_niche),
          ].filter(Boolean) as string[],
        ),
      ),
    [currentSubNiche, ideas, manualNiche, manualSubNiche],
  );
  const selectedIdea = selectedIdeaId ? ideaMap.get(selectedIdeaId) : null;
  const linkedAssignment = selectedIdea
    ? `${selectedIdea.niche ?? "Unknown niche"} / ${selectedIdea.sub_niche ?? "General"}`
    : null;
  const unlinkedEntriesCount = localEntries.filter((entry) => !entry.niche).length;

  const resetForm = useCallback(() => {
    setEditingEntryId(null);
    setSelectedCalendarId("");
    setSelectedIdeaId("");
    setPlatform("Instagram");
    setPostedAt(today);
    setPostTitle("");
    setViews("");
    setLikes("");
    setComments("");
    setShares("");
    setSaves("");
    setReach("");
    setFollowsGained("");
    setManualNiche(currentNiche ?? "");
    setManualSubNiche(currentSubNiche ?? "");
    setNotes("");
  }, [currentNiche, currentSubNiche, today]);

  useEffect(() => {
    if (!editingEntryId) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        resetForm();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingEntryId, resetForm]);

  function selectCalendarPost(calendarId: string) {
    setSelectedCalendarId(calendarId);

    const post = calendarMap.get(calendarId);

    if (!post) {
      return;
    }

    setSelectedIdeaId(post.content_idea_id ?? "");
    setPlatform(post.platform ?? "Instagram");
    setPostedAt(post.scheduled_date ?? today);
    setPostTitle(post.title);

    if (post.content_idea_id) {
      const idea = ideaMap.get(post.content_idea_id);
      setManualNiche(idea?.niche ?? currentNiche ?? "");
      setManualSubNiche(idea?.sub_niche ?? currentSubNiche ?? "");
    }
  }

  function selectIdea(ideaId: string) {
    setSelectedIdeaId(ideaId);

    const idea = ideaMap.get(ideaId);

    if (idea && !postTitle.trim()) {
      setPostTitle(idea.title);
    }

    if (idea) {
      setManualNiche(idea.niche ?? "");
      setManualSubNiche(idea.sub_niche ?? "");
    }
  }

  function focusEditForm() {
    window.requestAnimationFrame(() => {
      postTitleInputRef.current?.focus({ preventScroll: true });
    });
  }

  function editEntry(entry: AnalyticsEntryPayload) {
    setEditingEntryId(entry.id);
    setSelectedCalendarId(entry.content_calendar_id ?? "");
    setSelectedIdeaId(entry.content_idea_id ?? "");
    setPlatform(entry.platform ?? "Instagram");
    setPostedAt(entry.posted_at ? entry.posted_at.slice(0, 10) : today);
    setPostTitle(entry.post_title ?? "");
    setViews(String(metric(entry.views)));
    setLikes(String(metric(entry.likes)));
    setComments(String(metric(entry.comments)));
    setShares(String(metric(entry.shares)));
    setSaves(String(metric(entry.saves)));
    setReach(String(metric(entry.reach)));
    setFollowsGained(String(metric(entry.follows_gained)));
    setManualNiche(entry.niche ?? currentNiche ?? "");
    setManualSubNiche(entry.sub_niche ?? currentSubNiche ?? "");
    setNotes(entry.notes ?? "");
    setActionState(initialActionState);
    focusEditForm();
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const nextState = editingEntryId
        ? await updateAnalyticsEntry(actionState, formData)
        : await createAnalyticsEntry(actionState, formData);

      setActionState(nextState);

      if (nextState.status !== "success" || !nextState.entry) {
        return;
      }

      setLocalEntries((current) =>
        editingEntryId
          ? current.map((entry) => (entry.id === nextState.entry!.id ? nextState.entry! : entry))
          : [nextState.entry!, ...current],
      );
      resetForm();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEntry(entryId: string) {
    if (isDeleting || !window.confirm("Delete this analytics entry?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.set("entry_id", entryId);
      const nextState = await deleteAnalyticsEntry(deleteState, formData);

      setDeleteState(nextState);

      if (nextState.status === "success" && nextState.deletedEntryId) {
        setLocalEntries((current) =>
          current.filter((entry) => entry.id !== nextState.deletedEntryId),
        );
        if (editingEntryId === nextState.deletedEntryId) {
          resetForm();
        }
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function renderMessage(state: AnalyticsActionState) {
    if (!state.message) return null;

    return (
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
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.45fr]">
        <div
          className={cn(
            editingEntryId &&
              "fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center",
          )}
          onClick={editingEntryId ? resetForm : undefined}
        >
          <div
            className={cn(
              editingEntryId && "max-h-[92dvh] w-full overflow-y-auto sm:max-w-2xl",
            )}
            onClick={(event) => event.stopPropagation()}
          >
        <Card className="border-emerald-300/20" ref={formCardRef}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
                <Plus />
              </div>
              <div>
                <CardTitle>{editingEntryId ? "Edit analytics entry" : "Add analytics entry"}</CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  {editingEntryId
                    ? "Update this tracked post and assign it to the right niche."
                    : "Add post results manually after publishing."}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveEntry}>
              {editingEntryId ? <input name="entry_id" type="hidden" value={editingEntryId} /> : null}
              {editingEntryId ? (
                <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100">
                  Editing an existing analytics entry. Save changes or cancel edit when finished.
                </div>
              ) : null}

              <label className="block text-xs font-medium text-zinc-500">
                Scheduled calendar post optional
                <select
                  className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                  name="content_calendar_id"
                  onChange={(event) => selectCalendarPost(event.target.value)}
                  value={selectedCalendarId}
                >
                  <option value="">Manual entry without calendar post</option>
                  {calendarPosts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.scheduled_date ?? "No date"} - {post.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-zinc-500">
                Saved idea optional
                <select
                  className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                  name="content_idea_id"
                  onChange={(event) => selectIdea(event.target.value)}
                  value={selectedIdeaId}
                >
                  <option value="">No linked idea</option>
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      {idea.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                <p className="text-xs font-medium text-zinc-500">Analytics niche assignment</p>
                {linkedAssignment ? (
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Linked idea selected. This entry will use{" "}
                    <span className="font-medium text-emerald-200">{linkedAssignment}</span>.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      No saved idea selected. Assign this manual entry to a niche so recommendations
                      stay separated.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-medium text-zinc-500">
                        Niche optional
                        <select
                          className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                          name="manual_niche"
                          onChange={(event) => {
                            setManualNiche(event.target.value);
                            setManualSubNiche("");
                          }}
                          value={manualNiche}
                        >
                          <option value="">Unassigned</option>
                          {nicheOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-medium text-zinc-500">
                        Sub-niche optional
                        <select
                          className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                          name="manual_sub_niche"
                          onChange={(event) => setManualSubNiche(event.target.value)}
                          value={manualSubNiche}
                        >
                          <option value="">General / unassigned</option>
                          {subNicheOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <label className="block text-xs font-medium text-zinc-500">
                Post title optional
                <Input
                  name="post_title"
                  onChange={(event) => setPostTitle(event.target.value)}
                  placeholder="Manual post title"
                  ref={postTitleInputRef}
                  value={postTitle}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-zinc-500">
                  Platform
                  <select
                    className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                    name="platform"
                    onChange={(event) => setPlatform(event.target.value)}
                    value={platform}
                  >
                    {platforms.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-zinc-500">
                  Date posted
                  <Input
                    name="posted_at"
                    onChange={(event) => setPostedAt(event.target.value)}
                    type="date"
                    value={postedAt}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["views", "Views", views, setViews],
                  ["likes", "Likes", likes, setLikes],
                  ["comments", "Comments", comments, setComments],
                  ["shares", "Shares", shares, setShares],
                  ["saves", "Saves", saves, setSaves],
                  ["reach", "Reach optional", reach, setReach],
                  ["follows_gained", "Follows gained optional", followsGained, setFollowsGained],
                ].map(([name, label, value, setter]) => (
                  <label className="text-xs font-medium text-zinc-500" key={name as string}>
                    {label as string}
                    <Input
                      inputMode="numeric"
                      name={name as string}
                      onChange={(event) =>
                        (setter as (value: string) => void)(
                          cleanMetricInput(event.target.value),
                        )
                      }
                      pattern="[0-9]*"
                      placeholder="0"
                      type="text"
                      value={value as string}
                    />
                  </label>
                ))}
              </div>

              <label className="block text-xs font-medium text-zinc-500">
                Notes optional
                <Textarea
                  name="notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add context, lessons, or what you would change next time."
                  value={notes}
                />
              </label>

              {renderMessage(actionState)}

              <div className="flex flex-wrap justify-end gap-2">
                {editingEntryId ? (
                  <Button onClick={resetForm} type="button" variant="secondary">
                    Cancel
                  </Button>
                ) : null}
                <Button disabled={isSaving} type="submit">
                  {isSaving ? <LoaderCircle className="animate-spin" /> : <Check />}
                  {editingEntryId ? "Save changes" : "Save analytics"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
          </div>
        </div>

        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnalyticsStatCard
              helper="Entries in the current filter."
              label="Total posts tracked"
              value={String(visibleEntries.length)}
            />
            <AnalyticsStatCard
              helper="Views from tracked posts."
              label="Total views"
              value={totalViews.toLocaleString()}
            />
            <AnalyticsStatCard
              helper="Likes, comments, shares, and saves divided by views."
              label="Average engagement"
              value={totalViews > 0 ? formatPercent(averageEngagement) : "Not enough data"}
            />
            <AnalyticsStatCard
              helper={bestPost?.post_title ?? "Track more posts to find a leader."}
              label="Best post"
              value={bestPost ? formatNumber(bestPost.views) : "No data"}
            />
            <AnalyticsStatCard
              helper={bestPlatform ? `${formatNumber(bestPlatform[1])} views` : "No platform leader yet."}
              label="Best platform"
              value={bestPlatform?.[0] ?? "No data"}
            />
            <AnalyticsStatCard
              helper={bestFormat ? `${formatNumber(bestFormat[1])} views` : "Link ideas to show format insights."}
              label="Best format"
              value={bestFormat?.[0] ?? "No data"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-zinc-300">
                {insights.map((insight) => (
                  <li className="rounded-lg border border-white/10 bg-white/[0.025] p-3" key={insight}>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="grid gap-5 border-t border-white/10 pt-8 xl:grid-cols-2">
        <BarChartCard
          data={dateSeries.map((item) => ({
            label: compactDate(item.date),
            value: item.views,
          }))}
          description="Manual views grouped by posted date."
          empty="Add more analytics entries to see views over time."
          title="Views over time"
          valueLabel={(value) => formatNumber(value)}
        />
        <BarChartCard
          data={dateSeries.map((item) => ({
            label: compactDate(item.date),
            value: item.engagementRate,
          }))}
          description="Engagement rate by posted date."
          empty="Add more analytics entries to see engagement rate over time."
          title="Engagement rate over time"
          valueLabel={(value) => formatPercent(value)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <PlatformComparisonCard data={platformsSeries} />
        <BarChartCard
          data={breakdown.map(([label, value]) => ({ label, value }))}
          description="Totals from the entries in the current filter."
          empty="Add analytics entries to see your metric breakdown."
          title="Metrics breakdown"
          valueLabel={(value) => formatNumber(value)}
        />
      </section>

      <section className="space-y-5 border-t border-white/10 pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Performance entries</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Filter tracked posts by platform and current niche.
            </p>
            {unlinkedEntriesCount > 0 ? (
              <p className="mt-2 text-sm text-emerald-200">
                {unlinkedEntriesCount} manual entr{unlinkedEntriesCount === 1 ? "y is" : "ies are"} not assigned
                to a niche yet.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
              onChange={(event) => setPlatformFilter(event.target.value)}
              value={platformFilter}
            >
              <option value="All">All platforms</option>
              {platforms.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button
              onClick={() => setShowAllNiches((current) => !current)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {showAllNiches ? "Show current niche only" : "Show all niches"}
            </Button>
          </div>
        </div>

        {renderMessage(deleteState)}

        {visibleEntries.length > 0 ? (
          <div className="grid gap-4">
            {visibleEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs text-emerald-300">
                        {entry.platform ?? "Platform"} / {displayDate(entry.posted_at)}
                      </p>
                      <CardTitle className="mt-2 text-lg">
                        {entry.post_title ?? "Manual analytics entry"}
                      </CardTitle>
                      <p className="mt-2 text-sm text-zinc-500">
                        {entry.niche
                          ? `${entry.niche} / ${entry.sub_niche ?? "General"}`
                          : "Unlinked manual analytics"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => editEntry(entry)} size="sm" type="button" variant="secondary">
                        <Pencil />
                        Edit
                      </Button>
                      <Button
                        disabled={isDeleting}
                        onClick={() => removeEntry(entry.id)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-7">
                    <Metric label="Views" value={formatNumber(entry.views)} />
                    <Metric label="Likes" value={formatNumber(entry.likes)} />
                    <Metric label="Comments" value={formatNumber(entry.comments)} />
                    <Metric label="Shares" value={formatNumber(entry.shares)} />
                    <Metric label="Saves" value={formatNumber(entry.saves)} />
                    <Metric label="Reach" value={formatNumber(entry.reach)} />
                    <Metric label="Engagement" value={formatPercent(engagementRate(entry))} />
                  </div>
                  {entry.notes ? (
                    <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm leading-6 text-zinc-400">
                      {entry.notes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
            <p className="font-medium text-zinc-300">No analytics tracked yet.</p>
            <p className="mt-2">
              After posting your content, add views, likes, comments, saves, and shares here.
            </p>
            <Button className="mt-4" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} size="sm">
              Add first analytics entry
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <TopContentCard
          entries={topByViews}
          metricLabel="views"
          title="Top 5 by views"
          valueForEntry={(entry) => metric(entry.views)}
          valueLabel={(entry) => formatNumber(entry.views)}
        />
        <TopContentCard
          entries={topByEngagement}
          metricLabel="engagement"
          title="Top 5 by engagement rate"
          valueForEntry={(entry) => engagementRate(entry)}
          valueLabel={(entry) => formatPercent(engagementRate(entry))}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-zinc-100">{value}</p>
    </div>
  );
}

function TopContentCard({
  entries,
  metricLabel,
  title,
  valueForEntry,
  valueLabel,
}: {
  entries: AnalyticsEntryPayload[];
  metricLabel: string;
  title: string;
  valueForEntry: (entry: AnalyticsEntryPayload) => number;
  valueLabel: (entry: AnalyticsEntryPayload) => string;
}) {
  const maxValue = Math.max(...entries.map(valueForEntry), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 text-emerald-300" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3" key={entry.id}>
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-semibold text-emerald-200">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {entry.post_title ?? "Manual analytics entry"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {valueLabel(entry)} {metricLabel} / {formatNumber(entry.views)} views
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {entry.platform ?? "Platform"} / {displayDate(entry.posted_at)}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-emerald-300"
                        style={{
                          width:
                            maxValue > 0
                              ? `${Math.max(4, (valueForEntry(entry) / maxValue) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Track posts to build this list.</p>
        )}
      </CardContent>
    </Card>
  );
}

function buildInsights(entries: AnalyticsEntryPayload[], bestPlatform?: string, bestFormat?: string) {
  if (entries.length < 3) {
    return ["Track at least 3 posts to unlock better insights."];
  }

  const insights = [];
  const highestViewPost = [...entries].sort((a, b) => metric(b.views) - metric(a.views))[0];
  const bestEngagementPost = [...entries].sort((a, b) => engagementRate(b) - engagementRate(a))[0];

  if (highestViewPost?.post_title && metric(highestViewPost.views) > 0) {
    insights.push(`Your highest-view post is ${highestViewPost.post_title}.`);
  }

  if (bestEngagementPost?.post_title && engagementRate(bestEngagementPost) > 0) {
    insights.push(`Your best engagement rate came from ${bestEngagementPost.post_title}.`);
  }

  if (bestPlatform && bestPlatform !== "Unknown") {
    insights.push(`Your ${bestPlatform} posts are getting the most views.`);
  }

  if (bestFormat && bestFormat !== "Unknown") {
    insights.push(`${bestFormat} posts are performing best by views right now.`);
  }

  if (entries.some((entry) => metric(entry.saves) > 0)) {
    insights.push("Posts with saves are likely useful, educational, or worth revisiting.");
  }

  if (entries.every((entry) => metric(entry.views) === 0)) {
    insights.push("Add views to start seeing stronger performance patterns.");
  }

  return insights.length > 0 ? insights : ["Keep tracking posts to reveal clearer patterns."];
}
