import { describe, expect, it, vi } from "vitest";

import { createCronHandler } from "@/app/api/notifications/cron/route";

function schedulerAdmin() {
  return {
    from: vi.fn(() => ({
      delete: () => ({ lt: vi.fn().mockResolvedValue({ error: null }) }),
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: "run-id" }, error: null }),
        }),
      }),
      select: () => ({
        order: () => ({
          range: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
      update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })),
  };
}

describe("notification cron route", () => {
  it("returns 401 for an unauthorized request", async () => {
    const handler = createCronHandler({
      getSecret: () => "expected-secret",
      missingEnvironment: () => [],
    });
    const response = await handler(
      new Request("https://example.com/api/notifications/cron"),
    );

    expect(response.status).toBe(401);
  });

  it("invokes the reminder checker for a valid Bearer secret", async () => {
    const checkReminders = vi.fn().mockResolvedValue({
      ok: true,
      checked: 1,
      due: 1,
      sent: 1,
      skippedDuplicates: 0,
      upcoming: 1,
      pastReminderCount: 0,
      reason: "sent",
    });
    const handler = createCronHandler({
      createAdmin: () => schedulerAdmin() as never,
      checkReminders: checkReminders as never,
      getSecret: () => "expected-secret",
      missingEnvironment: () => [],
      now: () => new Date("2026-07-14T05:00:00.000Z"),
    });
    const response = await handler(
      new Request("https://example.com/api/notifications/cron", {
        headers: { Authorization: "Bearer expected-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(checkReminders).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toMatchObject({ ok: true, sent: 1 });
  });
});
