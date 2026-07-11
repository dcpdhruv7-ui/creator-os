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
} from "lucide-react";

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
  initialEntries: CalendarEntryPayload[];
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

export function CalendarWorkspace({
  ideas,
  captions,
  initialEntries,
}: CalendarWorkspaceProps) {
  const todayValue = toDateInputValue(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [entries, setEntries] = useState(initialEntries.sort(compareEntries));
  const [selectedIdeaId, setSelectedIdeaId] = useState(ideas[0]?.id ?? "");
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

  function resetForm() {
    setEditingEntryId(null);
    setSelectedIdeaId(ideas[0]?.id ?? "");
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
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function editEntry(entry: CalendarEntryPayload) {
    const parsedNotes = parseCalendarNotes(entry.notes);

    setEditingEntryId(entry.id);
    setSelectedIdeaId(entry.content_idea_id ?? ideas[0]?.id ?? "");
    setSelectedCaptionId(parsedNotes.captionId ?? "");
    setScheduledDate(entry.scheduled_date ?? todayValue);
    setScheduledTime(timeLabel(entry.scheduled_time));
    setPlatform(entry.platform ?? "Instagram");
    setStatus(entry.status ?? "Planned");
    setNotes(parsedNotes.notes);
    setActionState(initialActionState);
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

  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.4fr]">
        <section className="space-y-5">
          <Card className="border-emerald-300/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
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
                <label className="block text-xs font-medium text-zinc-500">
                  Saved idea
                  <select
                    className="mt-1 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
                    name="content_idea_id"
                    onChange={(event) => {
                      setSelectedIdeaId(event.target.value);
                      setSelectedCaptionId("");
                    }}
                    value={selectedIdeaId}
                  >
                    {ideas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.title}
                      </option>
                    ))}
                  </select>
                </label>

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
                  <Button disabled={isSaving} type="submit">
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
                        const idea = ideaMap.get(entry.content_idea_id ?? "");
                        const caption = captionMap.get(entryCaptionId(entry) ?? "");

                        return (
                          <div
                            className="rounded-md border border-white/10 bg-white/[0.035] p-3"
                            key={entry.id}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium leading-5 text-white">
                                  {entry.title}
                                </p>
                                <p className="mt-1 text-xs text-emerald-300">
                                  {idea?.format ?? "Content idea"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-zinc-400">
                              <p>
                                <Clock className="mr-1 inline size-3" />
                                {timeLabel(entry.scheduled_time)} / {entry.platform ?? "Platform"}
                              </p>
                              <p>Status: {entry.status ?? "Planned"}</p>
                              <p>{caption ? "Caption attached" : "No caption"}</p>
                              <p>Priority: {idea?.priority ?? "Medium"}</p>
                            </div>
                            {entryNotes(entry) ? (
                              <p className="mt-3 text-xs leading-5 text-zinc-500">
                                {entryNotes(entry)}
                              </p>
                            ) : null}
                            <div className="mt-3 flex gap-2">
                              <Button
                                onClick={() => editEntry(entry)}
                                size="sm"
                                type="button"
                                variant="secondary"
                              >
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
    </div>
  );
}
