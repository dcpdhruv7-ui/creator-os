import { DEFAULT_REMINDER_TIME_ZONE } from "@/lib/reminder-time";

export const serverEnvironmentKeys = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "CREATOR_OS_TIME_ZONE",
] as const;

export type ServerEnvironmentKey = (typeof serverEnvironmentKeys)[number];
export type EnvironmentStatus = Record<ServerEnvironmentKey, "Configured" | "Missing">;

function hasValue(key: ServerEnvironmentKey) {
  return Boolean(process.env[key]?.trim());
}

export function serverEnvironmentStatus(): EnvironmentStatus {
  return Object.fromEntries(
    serverEnvironmentKeys.map((key) => [key, hasValue(key) ? "Configured" : "Missing"]),
  ) as EnvironmentStatus;
}

export function missingAutomaticReminderEnvironment() {
  const required: ServerEnvironmentKey[] = [
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
  ];

  return required.filter((key) => !hasValue(key));
}

export function getReminderTimeZone() {
  const configured = process.env.CREATOR_OS_TIME_ZONE?.trim();

  if (!configured) return DEFAULT_REMINDER_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: configured }).format(new Date());
    return configured;
  } catch {
    console.error("CREATOR_OS_TIME_ZONE is invalid; using the default reminder timezone.");
    return DEFAULT_REMINDER_TIME_ZONE;
  }
}
