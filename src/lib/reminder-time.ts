export const DEFAULT_REMINDER_TIME_ZONE = "Asia/Kolkata";
export const REMINDER_LOOKBACK_MINUTES = 20;
export const REMINDER_SOON_WINDOW_MINUTES = 15;

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function dateValueInTimeZone(date: Date, timeZone = DEFAULT_REMINDER_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function partNumber(parts: Intl.DateTimeFormatPart[], type: string) {
  return Number(parts.find((part) => part.type === type)?.value ?? 0);
}

export function zonedDateTimeToUtc(
  dateValue: string | null,
  timeValue: string | null,
  timeZone = DEFAULT_REMINDER_TIME_ZONE,
) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.slice(0, 5).split(":").map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return null;
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const zonedParts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(utcGuess);
  const zonedAsUtc = Date.UTC(
    partNumber(zonedParts, "year"),
    partNumber(zonedParts, "month") - 1,
    partNumber(zonedParts, "day"),
    partNumber(zonedParts, "hour"),
    partNumber(zonedParts, "minute"),
    partNumber(zonedParts, "second"),
  );
  const offset = zonedAsUtc - utcGuess.getTime();

  return new Date(utcGuess.getTime() - offset);
}

export function reminderTimeForPost(
  scheduledDate: string | null,
  scheduledTime: string | null,
  reminderMinutes: number,
  timeZone = DEFAULT_REMINDER_TIME_ZONE,
) {
  const scheduledAt = zonedDateTimeToUtc(scheduledDate, scheduledTime, timeZone);

  if (!scheduledAt) {
    return null;
  }

  return {
    reminderAt: addMinutes(scheduledAt, -reminderMinutes),
    scheduledAt,
  };
}

export function formatReminderTime(
  date: Date,
  timeZone = DEFAULT_REMINDER_TIME_ZONE,
) {
  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
  });
}
