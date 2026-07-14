export type SchedulerRun = {
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  checked_count?: number | null;
  sent_count?: number | null;
  due_count?: number | null;
  skipped_duplicate_count?: number | null;
  upcoming_count?: number | null;
};

export type SchedulerHealth = "active" | "delayed" | "never_run" | "last_run_failed";

export function classifySchedulerHealth({
  latestRun,
  lastSuccessfulRun,
  now = new Date(),
}: {
  latestRun: SchedulerRun | null;
  lastSuccessfulRun: SchedulerRun | null;
  now?: Date;
}): SchedulerHealth {
  if (!latestRun) return "never_run";
  if (latestRun.status === "failed") return "last_run_failed";
  if (!lastSuccessfulRun?.completed_at) return "never_run";

  const completedAt = new Date(lastSuccessfulRun.completed_at);

  if (Number.isNaN(completedAt.getTime())) return "delayed";

  return now.getTime() - completedAt.getTime() <= 3 * 60 * 1000 ? "active" : "delayed";
}

export function schedulerHealthLabel(health: SchedulerHealth) {
  switch (health) {
    case "active":
      return "Active";
    case "delayed":
      return "Delayed";
    case "last_run_failed":
      return "Last run failed";
    default:
      return "Never run";
  }
}
