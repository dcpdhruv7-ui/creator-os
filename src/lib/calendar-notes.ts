const calendarNotesMarker = "creator_os_calendar";

type CalendarNotesPayload = {
  kind: typeof calendarNotesMarker;
  caption_id: string | null;
  notes: string;
};

export function encodeCalendarNotes(captionId: string | null, notes: string) {
  const cleanNotes = notes.trim();

  if (!captionId && !cleanNotes) {
    return null;
  }

  return JSON.stringify({
    kind: calendarNotesMarker,
    caption_id: captionId,
    notes: cleanNotes,
  } satisfies CalendarNotesPayload);
}

export function parseCalendarNotes(value: string | null | undefined) {
  if (!value) {
    return { captionId: null as string | null, notes: "" };
  }

  try {
    const parsed = JSON.parse(value) as Partial<CalendarNotesPayload>;

    if (parsed.kind === calendarNotesMarker) {
      return {
        captionId: parsed.caption_id ?? null,
        notes: parsed.notes ?? "",
      };
    }
  } catch {
    return { captionId: null, notes: value };
  }

  return { captionId: null, notes: value };
}
