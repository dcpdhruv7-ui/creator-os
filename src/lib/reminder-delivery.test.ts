import { describe, expect, it, vi } from "vitest";

import {
  canClaimReminderState,
  deliverReminderToSubscriptions,
} from "@/lib/reminder-delivery";
import type { PushSubscriptionRow } from "@/lib/notifications";

const subscriptions: PushSubscriptionRow[] = [
  { id: "one", endpoint: "one", p256dh: "key", auth: "auth" },
  { id: "two", endpoint: "two", p256dh: "key", auth: "auth" },
];
const payload = { title: "Reminder", body: "Due soon", url: "/calendar" };

describe("reminder claims", () => {
  it("does not claim a sent reminder twice", () => {
    expect(canClaimReminderState({ status: "sent", attemptCount: 1 })).toBe(false);
  });

  it("allows a failed reminder to retry when due", () => {
    expect(
      canClaimReminderState(
        {
          status: "failed",
          attemptCount: 1,
          nextRetryAt: new Date("2026-07-14T05:00:00.000Z"),
        },
        new Date("2026-07-14T05:01:00.000Z"),
      ),
    ).toBe(true);
  });

  it("does not retry successful reminders", () => {
    expect(canClaimReminderState({ status: "sent", attemptCount: 2 })).toBe(false);
  });
});

describe("device delivery", () => {
  it("delivers to every enabled device", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    const result = await deliverReminderToSubscriptions({
      subscriptions,
      payload,
      send,
      disable: vi.fn(),
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(result.sentCount).toBe(2);
  });

  it("disables one invalid device without blocking another", async () => {
    const disable = vi.fn().mockResolvedValue(undefined);
    const result = await deliverReminderToSubscriptions({
      subscriptions,
      payload,
      send: async (subscription) =>
        subscription.id === "one"
          ? { ok: false, reason: "permanent_invalid", statusCode: 410 }
          : { ok: true },
      disable,
    });

    expect(result.sentCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(disable).toHaveBeenCalledWith("one");
  });
});
