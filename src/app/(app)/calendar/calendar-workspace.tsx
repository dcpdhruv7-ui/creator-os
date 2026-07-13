"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  LoaderCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { NotificationOptInCard } from "@/components/notification-opt-in-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCalendarNotes } from "@/lib/calendar-notes";
import { cn } from "@/lib/utils";
import {
  createCalendarEntry,
  deleteCalendarEntry,
  saveSuggestedPlan,
  updateCalendarEntry,
  type CalendarActionState,
  type CalendarEntryPayload,
} from "./actions";

export type CalendarIdea = {
  id: string;
  title: string;
  hook: string | null;
  niche: string | null;
  sub_niche: string | null;
  format: string | null;
  difficulty: string | null;
  goal: string | null;
  status: string | null;
  priority: string | null;
};

export type CalendarCaption = {
  id: string;
  content_idea_id: string | null;
  caption_type: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string | null;
};

type SuggestedPost = {
  localId: string;
  ideaId: string;
  captionId: string;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  status: string;
  notes: string;
};

type CalendarWorkspaceProps = {
  ideas: CalendarIdea[];
  captions: CalendarCaption[];
  currentNiche: string | null;
  currentSubNiche: string | null;
  initialEntries: CalendarEntryPayload[];
  pushConfigured: boolean;
  vapidPublicKey: string;
};

const initialActionState: CalendarActionState = { status: "idle", message: "" };
const platforms = ["Instagram", "YouTube Shorts", "TikTok", "LinkedIn", "Other"];
const statuses = ["Planned", "Scripted", "Shot", "Editing", "Scheduled", "Posted"];
const frequencyOptions = [
  { label: "3 posts/week", value: 3 },
  { label: "5 posts/week", value: 5 },
  { label: "7 posts/week", value: 7 },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);

  return next;
}

function displayDate(value: string) {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function displayWeekRange(weekStart: Date) {
  const end = addDays(weekStart, 6);

  return `${weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function timeLabel(value: string | null) {
  if (!value) return "No time";

  return value.slice(0, 5);
}

function mergeEntries(current: CalendarEntryPayload[], incoming: CalendarEntryPayload[]) {
  const byId = new Set(current.map((entry) => entry.id));
  const next = [...current];

  incoming.forEach((entry) => {
    if (byId.has(entry.id)) {
      return;
    }

    byId.add(entry.id);
    next.push(entry);
  });

  return next.sort(compareEntries);
}

function compareEntries(a: CalendarEntryPayload, b: CalendarEntryPayload) {
  return `${a.scheduled_date ?? ""} ${a.scheduled_time ?? ""}`.localeCompare(
    `${b.scheduled_date ?? ""} ${b.scheduled_time ?? ""}`,
  );
}

function captionsForIdea(captions: CalendarCaption[], ideaId: string) {
  return captions.filter((caption) => caption.content_idea_id === ideaId);
}

function captionLabel(caption: CalendarCaption | undefined) {
  if (!caption) return "No caption";

  return `${caption.caption_type ?? "Caption"}: ${caption.hook ?? caption.body ?? "Saved caption"}`;
}

function platformShortLabel(platform: string | null) {
  switch (platform) {
    case "Instagram":
      return "IG";
    case "YouTube Shorts":
      return "YT";
    case "TikTok":
      return "TT";
    case "LinkedIn":
      return "LI";
    case "Other":
      return "Other";
    default:
      return "Post";
  }
}

function ideaMatchesCurrentNiche(
  idea: CalendarIdea,
  currentNiche: string | null,
  currentSubNiche: string | null,
) {
  return idea.niche === currentNiche && idea.sub_niche === currentSubNiche;
}

function ideaGroupLabel(idea: CalendarIdea) {
  return `${idea.niche ?? "Unknown niche"} / ${idea.sub_niche ?? "General"}`;
}

function groupIdeasByNiche(ideas: CalendarIdea[]) {
  return ideas.reduce<Array<{ label: string; ideas: CalendarIdea[] }>>((groups, idea) => {
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

function shortIdeaLabel(idea: CalendarIdea) {
  const title = idea.title.length > 72 ? `${idea.title.slice(0, 69)}...` : idea.title;

  return idea.format ? `${idea.format} - ${title}` : title;
}

export function CalendarWorkspace({
  ideas,
  captions,
  currentNiche,
  currentSubNiche,
  initialEntries,
  pushConfigured,
  vapidPublicKey,
}: CalendarWorkspaceProps) {
  const todayValue = toDateInputValue(new Date());
  const currentNicheIdeas = ideas.filter((idea) =>
    ideaMatchesCurrentNiche(idea, currentNiche, currentSubNiche),
  );
  const [showAllIdeaNiches, setShowAllIdeaNiches] = useState(false);
  const visibleIdeaOptions = showAllIdeaNiches ? ideas : currentNicheIdeas;
  const groupedIdeaOptions = showAllIdeaNiches ? groupIdeasByNiche(visibleIdeaOptions) : [];
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [entries, setEntries] = useState(initialEntries.sort(compareEntries));
  const [selectedIdeaId, setSelectedIdeaId] = useState(
    currentNicheIdeas[0]?.id ?? ideas[0]?.id ?? "",
  );
  const [selectedCaptionId, setSelectedCaptionId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayValue);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [platform, setPlatform] = useState("Instagram");
  const [status, setStatus] = useState("Planned");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [actionState, setActionState] = useState(initialActionState);
  const [deleteState, setDeleteState] = useState(initialActionState);
  const [planState, setPlanState] = useState(initialActionState);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [frequency, setFrequency] = useState(5);
  const [suggestedPlan, setSuggestedPlan] = useState<SuggestedPost[]>([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showPostSaveNotificationPrompt, setShowPostSaveNotificationPrompt] = useState(false);

  const selectedIdeaCaptions = useMemo(
    () => captionsForIdea(captions, selectedIdeaId),
    [captions, selectedIdeaId],
  );
  const captionMap = useMemo(
    () => new Map(captions.map((caption) => [caption.id, caption])),
    [captions],
  );
  const ideaMap = useMemo(() => new Map(ideas.map((idea) => [idea.id, idea])), [ideas]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return { date, value: toDateInputValue(date) };
      }),
    [weekStart],
  );
  const scheduledIdeaIds = useMemo(
    () => new Set(entries.map((entry) => entry.content_idea_id).filter(Boolean) as string[]),
    [entries],
  );
  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );
  const hasUpcomingEntries = entries.some(
    (entry) => entry.scheduled_date && entry.scheduled_date >= todayValue,
  );

  function resetForm() {
    setEditingEntryId(null);
    setShowAllIdeaNiches(false);
    setSelectedIdeaId(currentNicheIdeas[0]?.id ?? ideas[0]?.id ?? "");
    setSelectedCaptionId("");
    setScheduledDate(todayValue);
    setScheduledTime("09:00");
    setPlatform("Instagram");
    setStatus("Planned");
    setNotes("");
  }

  function entryCaptionId(entry: CalendarEntryPayload) {
    return parseCalendarNotes(entry.notes).captionId;
  }

  function entryNotes(entry: CalendarEntryPayload) {
    return parseCalendarNotes(entry.notes).notes;
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const nextState = editingEntryId
        ? await updateCalendarEntry(actionState, formData)
        : await createCalendarEntry(actionState, formData);

      setActionState(nextState);

      if (nextState.status !== "success" || !nextState.entry) {
        return;
      }

      setEntries((current) =>
        editingEntryId
          ? current.map((entry) => (entry.id === nextState.entry!.id ? nextState.entry! : entry))
          : mergeEntries(current, [nextState.entry!]),
      );
      if (!editingEntryId) {
        setShowPostSaveNotificationPrompt(true);
      }
      resetForm();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEntry(entryId: string) {
    if (isDeleting || !window.confirm("Remove this post from the calendar?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.set("entry_id", entryId);
      const nextState = await deleteCalendarEntry(deleteState, formData);

      setDeleteState(nextState);

      if (nextState.status === "success" && nextState.deletedEntryId) {
        setEntries((current) =>
          current.filter((entry) => entry.id !== nextState.deletedEntryId),
        );
        setSelectedEntryId((current) =>
          current === nextState.deletedEntryId ? null : current,
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function editEntry(entry: CalendarEntryPayload) {
    const parsedNotes = parseCalendarNotes(entry.notes);
    const entryIdea = ideas.find((idea) => idea.id === entry.content_idea_id);

    if (
      entryIdea &&
      !ideaMatchesCurrentNiche(entryIdea, currentNiche, currentSubNiche)
    ) {
      setShowAllIdeaNiches(true);
    }

    setEditingEntryId(entry.id);
    setSelectedIdeaId(entry.content_idea_id ?? ideas[0]?.id ?? "");
    setSelectedCaptionId(parsedNotes.captionId ?? "");
    setScheduledDate(entry.scheduled_date ?? todayValue);
    setScheduledTime(timeLabel(entry.scheduled_time));
    setPlatform(entry.platform ?? "Instagram");
    setStatus(entry.status ?? "Planned");
    setNotes(parsedNotes.notes);
    setActionState(initialActionState);
    setSelectedEntryId(null);
  }

  function suggestPlan() {
    const targetDays =
      frequency === 3
        ? [0, 2, 4]
        : frequency === 5
          ? [0, 1, 2, 3, 4]
          : [0, 1, 2, 3, 4, 5, 6];
    const availableIdeas = ideas
      .filter((idea) => !scheduledIdeaIds.has(idea.id))
      .sort((a, b) =>
        `${a.format ?? ""} ${a.goal ?? ""}`.localeCompare(`${b.format ?? ""} ${b.goal ?? ""}`),
      );
    const sourceIdeas = availableIdeas.length >= frequency ? availableIdeas : ideas;
    const plan = sourceIdeas.slice(0, frequency).map((idea, index) => {
      const ideaCaptions = captionsForIdea(captions, idea.id);
      const date = addDays(weekStart, targetDays[index] ?? index);

      return {
        localId: `${idea.id}-${index}-${date.toISOString()}`,
        ideaId: idea.id,
        captionId: ideaCaptions[0]?.id ?? "",
        scheduledDate: toDateInputValue(date),
        scheduledTime: index % 2 === 0 ? "09:00" : "18:00",
        platform: index % 3 === 0 ? "Instagram" : index % 3 === 1 ? "YouTube Shorts" : "TikTok",
        status: "Planned",
        notes: "",
      };
    });

    setSuggestedPlan(plan);
    setPlanState(initialActionState);
  }

  function updateSuggestedPost(
    localId: string,
    field: keyof Omit<SuggestedPost, "localId">,
    value: string,
  ) {
    setSuggestedPlan((current) =>
      current.map((post) =>
        post.localId === localId ? { ...post, [field]: value } : post,
      ),
    );
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSavingPlan || suggestedPlan.length === 0) {
      return;
    }

    setIsSavingPlan(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("suggested_plan", JSON.stringify(suggestedPlan));
      const nextState = await saveSuggestedPlan(planState, formData);

      setPlanState(nextState);

      if (nextState.status === "success" && nextState.entries?.length) {
        setEntries((current) => mergeEntries(current, nextState.entries ?? []));
        setSuggestedPlan([]);
        setShowPostSaveNotificationPrompt(true);
      }
    } finally {
      setIsSavingPlan(false);
    }
  }

  function renderMessage(state: CalendarActionState) {
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

  function renderBadge(label: string, tone: "emerald" | "zinc" = "zinc") {
    return (
      <span
        className={cn(
          "inline-flex min-w-0 max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
          tone === "emerald"
            ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
            : "border-white/10 bg-white/[0.04] text-zinc-300",
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="space-y-8">
      {hasUpcomingEntries || showPostSaveNotificationPrompt ? (
        <NotificationOptInCard
          pushConfigured={pushConfigured}
          vapidPublicKey={vapidPublicKey}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.4fr]">
        <section className="space-y-5">
          <Card className="border-emerald-300/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200"
                >
                  <Plus />
                </div>
                <div>
                  <CardTitle>{editingEntryId ? "Edit scheduled post" : "Create scheduled post"}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-400">
                    Add a saved idea to your manual posting plan.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={saveEntry}>
                {editingEntryId ? (
                  <input name="entry_id" type="hidden" value={editingEntryId} />
                ) : null}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-medium text-zinc-500" htmlFor="calendar-idea">
                      Saved idea
                    </label>
                    <div className="flex rounded-md border border-white/10 bg-zinc-950 p-1">
                      <button
                        className={cn(
                          "rounded px-2 py-1 text-xs transition",
                          !showAllIdeaNiches
                            ? "bg-emerald-400 text-zinc-950"
                            : "text-zinc-400 hover:text-white",
                        )}
                        onClick={() => {
                          setShowAllIdeaNiches(false);
                          setSelectedIdeaId(currentNicheIdeas[0]?.id ?? "");
                          setSelectedCaptionId("");
                        }}
                        type="button"
                      >
                        Current niche only
                      </button>
                      <button
                        className={cn(
                          "rounded px-2 py-1 text-xs transition",
                          showAllIdeaNiches
                            ? "bg-emerald-400 text-zinc-950"
                            : "text-zinc-400 hover:text-white",
                        )}
                        onClick={() => {
                          setShowAllIdeaNiches(true);
                          setSelectedIdeaId((current) => current || ideas[0]?.id || "");
                          setSelectedCaptionId("");
                        }}
                        type="button"
                      >
                        All niches
                      </button>
                    </div>
                  </div>

                  {visibleIdeaOptions.length > 0 ? (
                    <select
                      className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                      id="calendar-idea"
                      name="content_idea_id"
                      onChange={(event) => {
                        setSelectedIdeaId(event.target.value);
                        setSelectedCaptionId("");
                      }}
                      value={selectedIdeaId}
                    >
                      {showAllIdeaNiches
                        ? groupedIdeaOptions.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.ideas.map((idea) => (
                                <option key={idea.id} value={idea.id}>
                                  {shortIdeaLabel(idea)}
                                </option>
                              ))}
                            </optgroup>
                          ))
                        : visibleIdeaOptions.map((idea) => (
                            <option key={idea.id} value={idea.id}>
                              {shortIdeaLabel(idea)}
                            </option>
                          ))}
                    </select>
                  ) : (
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm text-zinc-400">
                      <p className="font-medium text-zinc-200">
                        No saved ideas for this niche yet.
                      </p>
                      <p className="mt-1 text-zinc-500">
                        Save ideas for this niche first, then schedule them here.
                      </p>
                      <Button asChild className="mt-3" size="sm" variant="secondary">
                        <Link href="/ideas">
                          Go to Ideas
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  )}
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Switch to all niches if you want to schedule older ideas from another content
                    direction.
                  </p>
                </div>

                <label className="block text-xs font-medium text-zinc-500">
                  Saved caption optional
                  <select
                    className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                    name="caption_id"
                    onChange={(event) => setSelectedCaptionId(event.target.value)}
                    value={selectedCaptionId}
                  >
                    <option value="">No caption attached</option>
                    {selectedIdeaCaptions.map((caption) => (
                      <option key={caption.id} value={caption.id}>
                        {captionLabel(caption)}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedIdeaCaptions.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm text-zinc-400">
                    You can schedule this idea now or generate a caption first.
                    <Button asChild className="mt-3" size="sm" variant="secondary">
                      <Link href="/captions">
                        Go to Captions
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-zinc-500">
                    Date
                    <input
                      className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                      name="scheduled_date"
                      onChange={(event) => setScheduledDate(event.target.value)}
                      type="date"
                      value={scheduledDate}
                    />
                  </label>
                  <label className="text-xs font-medium text-zinc-500">
                    Time
                    <input
                      className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                      name="scheduled_time"
                      onChange={(event) => setScheduledTime(event.target.value)}
                      type="time"
                      value={scheduledTime}
                    />
                  </label>
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
                    Status
                    <select
                      className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                      name="status"
                      onChange={(event) => setStatus(event.target.value)}
                      value={status}
                    >
                      {statuses.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-xs font-medium text-zinc-500">
                  Notes optional
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                    name="notes"
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add shoot notes, reminders, or posting context."
                    value={notes}
                  />
                </label>

                {renderMessage(actionState)}

                <div className="flex flex-wrap justify-end gap-2">
                  {editingEntryId ? (
                    <Button onClick={resetForm} type="button" variant="secondary">
                      Cancel edit
                    </Button>
                  ) : null}
                  <Button disabled={isSaving || !selectedIdeaId} type="submit">
                    {isSaving ? <LoaderCircle className="animate-spin" /> : <Check />}
                    {editingEntryId ? "Save changes" : "Schedule post"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
                  <Sparkles />
                </div>
                <div>
                  <CardTitle>Smart weekly plan helper</CardTitle>
                  <p className="mt-1 text-sm text-zinc-400">
                    Suggest a simple draft from unscheduled saved ideas.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                  onChange={(event) => setFrequency(Number(event.target.value))}
                  value={frequency}
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button onClick={suggestPlan} type="button" variant="secondary">
                  <Sparkles />
                  Suggest weekly plan
                </Button>
              </div>

              {suggestedPlan.length > 0 ? (
                <form className="mt-5 space-y-4" onSubmit={savePlan}>
                  <input name="suggested_plan" type="hidden" value={JSON.stringify(suggestedPlan)} />
                  {suggestedPlan.map((post) => {
                    const idea = ideaMap.get(post.ideaId);
                    const postCaptions = captionsForIdea(captions, post.ideaId);

                    return (
                      <div
                        className="rounded-lg border border-white/10 bg-white/[0.025] p-3"
                        key={post.localId}
                      >
                        <p className="text-sm font-medium text-white">
                          {idea?.title ?? "Suggested post"}
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input
                            className="h-10 rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
                            onChange={(event) =>
                              updateSuggestedPost(post.localId, "scheduledDate", event.target.value)
                            }
                            type="date"
                            value={post.scheduledDate}
                          />
                          <input
                            className="h-10 rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
                            onChange={(event) =>
                              updateSuggestedPost(post.localId, "scheduledTime", event.target.value)
                            }
                            type="time"
                            value={post.scheduledTime}
                          />
                          <select
                            className="h-10 rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
                            onChange={(event) =>
                              updateSuggestedPost(post.localId, "platform", event.target.value)
                            }
                            value={post.platform}
                          >
                            {platforms.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <select
                            className="h-10 rounded-md border border-white/10 bg-zinc-950 px-2 text-sm text-zinc-100"
                            onChange={(event) =>
                              updateSuggestedPost(post.localId, "captionId", event.target.value)
                            }
                            value={post.captionId}
                          >
                            <option value="">No caption attached</option>
                            {postCaptions.map((caption) => (
                              <option key={caption.id} value={caption.id}>
                                {captionLabel(caption)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {renderMessage(planState)}
                  <div className="flex justify-end">
                    <Button disabled={isSavingPlan} type="submit">
                      {isSavingPlan ? <LoaderCircle className="animate-spin" /> : <Check />}
                      Save plan
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <Card className="border-emerald-300/20">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CalendarDays className="size-5 text-emerald-300" />
                    Week of {displayWeekRange(weekStart)}
                  </CardTitle>
                  <p className="mt-2 text-sm text-zinc-400">
                    Manual content plan for Monday through Sunday.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setWeekStart((current) => addDays(current, -7))}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Previous week
                  </Button>
                  <Button
                    onClick={() => setWeekStart(startOfWeek(new Date()))}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Today / This week
                  </Button>
                  <Button
                    onClick={() => setWeekStart((current) => addDays(current, 7))}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Next week
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 lg:grid-cols-7">
            {weekDays.map((day) => {
              const dayEntries = entries.filter((entry) => entry.scheduled_date === day.value);

              return (
                <div
                  className="min-h-40 rounded-lg border border-white/10 bg-zinc-950/72 p-3"
                  key={day.value}
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-white">
                      {day.date.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p className="text-xs text-zinc-500">{displayDate(day.value)}</p>
                  </div>
                  <div className="space-y-3">
                    {dayEntries.length > 0 ? (
                      dayEntries.map((entry) => {
                        const caption = captionMap.get(entryCaptionId(entry) ?? "");

                        return (
                          <button
                            className="w-full rounded-md border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-emerald-300/30 hover:bg-emerald-400/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                            key={entry.id}
                            onClick={() => setSelectedEntryId(entry.id)}
                            type="button"
                          >
                            <div className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
                              <Clock className="size-3 shrink-0" />
                              <span className="truncate">{timeLabel(entry.scheduled_time)}</span>
                            </div>
                            <p className="mt-2 overflow-hidden text-sm font-medium leading-5 text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                              {entry.title}
                            </p>
                            <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
                              {renderBadge(platformShortLabel(entry.platform), "emerald")}
                              {renderBadge(entry.status ?? "Planned")}
                            </div>
                            <div
                              className="mt-2 flex min-w-0 items-center gap-1 text-xs text-zinc-500"
                              title={caption ? "Caption attached" : "No caption attached"}
                            >
                              {caption ? <Check className="size-3 shrink-0 text-emerald-300" /> : null}
                              <span className="truncate">{caption ? "Caption" : "No cap"}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="rounded-md border border-dashed border-white/10 p-3 text-xs text-zinc-600">
                        No posts planned.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {renderMessage(deleteState)}
        </section>
      </div>

      {selectedEntry ? (
        <div
          aria-labelledby="calendar-entry-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={() => setSelectedEntryId(null)}
          role="dialog"
        >
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-lg border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/40 sm:max-w-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const idea = ideaMap.get(selectedEntry.content_idea_id ?? "");
              const caption = captionMap.get(entryCaptionId(selectedEntry) ?? "");
              const notes = entryNotes(selectedEntry);

              return (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                        Scheduled post
                      </p>
                      <h3
                        className="mt-2 text-xl font-semibold leading-7 text-white"
                        id="calendar-entry-title"
                      >
                        {selectedEntry.title}
                      </h3>
                    </div>
                    <button
                      aria-label="Close scheduled post details"
                      className="rounded-md border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
                      onClick={() => setSelectedEntryId(null)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem label="Format" value={idea?.format ?? "Content idea"} />
                    <DetailItem label="Platform" value={selectedEntry.platform ?? "Platform"} />
                    <DetailItem
                      label="Date"
                      value={
                        selectedEntry.scheduled_date
                          ? displayDate(selectedEntry.scheduled_date)
                          : "No date"
                      }
                    />
                    <DetailItem label="Time" value={timeLabel(selectedEntry.scheduled_time)} />
                    <DetailItem label="Status" value={selectedEntry.status ?? "Planned"} />
                    <DetailItem label="Priority" value={idea?.priority ?? "Medium"} />
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Caption
                    </p>
                    {caption ? (
                      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
                        {caption.hook ? (
                          <p className="font-medium text-white">{caption.hook}</p>
                        ) : null}
                        {caption.body ? <p>{caption.body}</p> : null}
                        {caption.cta ? <p className="text-zinc-400">CTA: {caption.cta}</p> : null}
                        {caption.hashtags ? (
                          <p className="text-emerald-200">{caption.hashtags}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-zinc-500">No caption attached.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Notes
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {notes || "No notes added."}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      onClick={() => editEntry(selectedEntry)}
                      type="button"
                      variant="secondary"
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      disabled={isDeleting}
                      onClick={() => removeEntry(selectedEntry.id)}
                      type="button"
                      variant="secondary"
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}
