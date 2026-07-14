import { describe, expect, it } from "vitest";

import { classifySchedulerHealth } from "@/lib/scheduler-status";

const now = new Date("2026-07-14T05:10:00.000Z");

describe("scheduler diagnostics", () => {
  it("classifies a recent successful run as active", () => {
    const run = {
      status: "success",
      started_at: "2026-07-14T05:08:00.000Z",
      completed_at: "2026-07-14T05:08:30.000Z",
    };
    expect(classifySchedulerHealth({ latestRun: run, lastSuccessfulRun: run, now })).toBe(
      "active",
    );
  });

  it("classifies an old successful run as delayed", () => {
    const run = {
      status: "success",
      started_at: "2026-07-14T05:00:00.000Z",
      completed_at: "2026-07-14T05:00:30.000Z",
    };
    expect(classifySchedulerHealth({ latestRun: run, lastSuccessfulRun: run, now })).toBe(
      "delayed",
    );
  });

  it("classifies a failed latest run", () => {
    expect(
      classifySchedulerHealth({
        latestRun: {
          status: "failed",
          started_at: "2026-07-14T05:09:00.000Z",
          completed_at: "2026-07-14T05:09:10.000Z",
        },
        lastSuccessfulRun: null,
        now,
      }),
    ).toBe("last_run_failed");
  });
});
