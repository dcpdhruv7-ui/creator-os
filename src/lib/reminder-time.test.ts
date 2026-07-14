import { describe, expect, it } from "vitest";

import {
  DEFAULT_REMINDER_TIME_ZONE,
  isCalendarEntryEligible,
  isReminderDue,
  reminderTimeForPost,
  zonedDateTimeToUtc,
} from "@/lib/reminder-time";

describe("reminder timing", () => {
  it("makes a 15-minute reminder due at the correct time", () => {
    const now = new Date("2026-07-14T04:45:00.000Z");
    const reminder = reminderTimeForPost("2026-07-14", "10:30", 15);

    expect(reminder?.reminderAt.toISOString()).toBe("2026-07-14T04:45:00.000Z");
    expect(
      reminder && isReminderDue({ now, ...reminder, reminderMinutes: 15 }),
    ).toBe(true);
  });

  it("uses Asia/Kolkata for calendar values by default", () => {
    expect(DEFAULT_REMINDER_TIME_ZONE).toBe("Asia/Kolkata");
    expect(zonedDateTimeToUtc("2026-07-14", "10:30")?.toISOString()).toBe(
      "2026-07-14T05:00:00.000Z",
    );
  });

  it("ignores posted, deleted, and cancelled entries", () => {
    expect(isCalendarEntryEligible("Posted")).toBe(false);
    expect(isCalendarEntryEligible("Deleted")).toBe(false);
    expect(isCalendarEntryEligible("Cancelled")).toBe(false);
    expect(isCalendarEntryEligible("Scheduled")).toBe(true);
  });

  it("does not send reminders for past scheduled posts", () => {
    expect(
      isReminderDue({
        now: new Date("2026-07-14T05:10:00.000Z"),
        reminderAt: new Date("2026-07-14T04:45:00.000Z"),
        reminderMinutes: 15,
        scheduledAt: new Date("2026-07-14T05:00:00.000Z"),
      }),
    ).toBe(false);
  });
});
