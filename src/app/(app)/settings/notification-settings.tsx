"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, CalendarDays, LoaderCircle, Send, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  enablePushNotifications,
  getActiveSubscription,
  getNotificationPermission,
  isWebPushSupported,
} from "@/lib/notification-client";
import { cn } from "@/lib/utils";

type NotificationPreferences = {
  calendar_reminders_enabled: boolean;
  reminder_minutes_before: number;
  workflow_reminders_enabled: boolean;
  weekly_summary_enabled: boolean;
};

type NotificationSettingsProps = {
  pushConfigured: boolean;
  vapidPublicKey: string;
};

type NotificationDevice = {
  id: string;
  endpoint: string;
  label: string;
  enabled: boolean;
  created_at: string | null;
  last_used_at: string | null;
};

type ReminderDiagnostics = {
  calendarRemindersEnabled: boolean;
  reminderMinutesBefore: number;
  activeDevicesCount: number;
  upcomingCalendarPostsCount: number;
  nextReminderTime: string | null;
  lastReminderLogStatus: string | null;
  lastReminderSent: string | null;
  schedulerStatus: "active" | "delayed" | "never_run" | "last_run_failed";
  schedulerStatusLabel: string;
  schedulerSetupReady: boolean;
  lastSchedulerCheck: string | null;
  lastSuccessfulSchedulerCheck: string | null;
  lastSchedulerResult: string | null;
  schedulerCheckedCount: number;
  schedulerSentCount: number;
  environment: Record<string, "Configured" | "Missing">;
  timeZone: string;
};

const defaultPreferences: NotificationPreferences = {
  calendar_reminders_enabled: true,
  reminder_minutes_before: 60,
  workflow_reminders_enabled: true,
  weekly_summary_enabled: false,
};

const reminderOptions = [
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
];

export function NotificationSettings({
  pushConfigured,
  vapidPublicKey,
}: NotificationSettingsProps) {
  const [isSupported] = useState(() => isWebPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission(),
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isCheckingReminders, setIsCheckingReminders] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [devices, setDevices] = useState<NotificationDevice[]>([]);
  const [diagnostics, setDiagnostics] = useState<ReminderDiagnostics | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState("");
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");

  const statusLabel = useMemo(() => {
    if (!isSupported) return "Not supported in this browser";
    if (!pushConfigured) return "Notification keys not configured";
    if (setupNeeded) return "Database setup needed";
    if (permission === "denied") return "Blocked in browser settings";
    if (isSubscribed) return "Enabled";
    if (permission === "granted") return "Allowed, not enabled";
    return "Not enabled";
  }, [isSupported, isSubscribed, permission, pushConfigured, setupNeeded]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    getActiveSubscription()
      .then((subscription) => {
        setIsSubscribed(Boolean(subscription));
        setCurrentEndpoint(subscription?.endpoint ?? "");
      })
      .catch(() => setIsSubscribed(false));
  }, [isSupported]);

  useEffect(() => {
    refreshDevices();
    refreshDiagnostics();

    fetch("/api/notifications/preferences")
      .then((response) => response.json())
      .then((data) => {
        if (data.preferences) {
          setPreferences(data.preferences);
        }

        setSetupNeeded(Boolean(data.setupNeeded));
      })
      .catch(() => {
        setMessageTone("error");
        setMessage("Notification preferences could not be loaded.");
      });
  }, []);

  async function refreshDevices() {
    try {
      const response = await fetch("/api/notifications/subscribe");
      const data = await response.json();

      if (response.ok && data.devices) {
        setDevices(data.devices);
      }
    } catch {
      setDevices([]);
    }
  }

  async function refreshDiagnostics() {
    try {
      const response = await fetch("/api/notifications/diagnostics");
      const data = await response.json();

      if (response.ok) {
        setDiagnostics(data);
      }
    } catch {
      setDiagnostics(null);
    }
  }

  function showMessage(nextMessage: string, tone: "success" | "error" | "info" = "info") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  async function savePreferences(nextPreferences: NotificationPreferences) {
    setPreferences(nextPreferences);
    setIsSavingPreferences(true);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextPreferences),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Preferences could not be saved.");
      }

      if (data.preferences) {
        setPreferences(data.preferences);
      }

      showMessage("Notification preferences saved.", "success");
      setSetupNeeded(false);
      await refreshDiagnostics();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Preferences could not be saved.", "error");
    } finally {
      setIsSavingPreferences(false);
    }
  }

  async function enableNotifications() {
    if (!isSupported) {
      showMessage("This browser does not support web push notifications.", "error");
      return;
    }

    if (!pushConfigured || !vapidPublicKey) {
      showMessage("Push notifications are not configured yet.", "error");
      return;
    }

    setIsBusy(true);

    try {
      const result = await enablePushNotifications({ pushConfigured, vapidPublicKey });
      setPermission(getNotificationPermission());

      if (result.status !== "enabled" && result.status !== "already-enabled") {
        showMessage(result.message, "error");
        return;
      }

      setIsSubscribed(true);
      setCurrentEndpoint(result.endpoint);
      await refreshDevices();
      await refreshDiagnostics();
      showMessage("Notifications enabled for this device.", "success");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Notifications could not be enabled.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function disableNotifications() {
    setIsBusy(true);

    try {
      const subscription = await getActiveSubscription();
      const endpoint = subscription?.endpoint ?? "";

      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setIsSubscribed(false);
      setCurrentEndpoint("");
      await refreshDevices();
      await refreshDiagnostics();
      showMessage("Notifications disabled for this device.", "success");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Notifications could not be disabled.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTestNotification() {
    setIsTesting(true);

    try {
      const subscription = await getActiveSubscription();
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint ?? currentEndpoint }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Test notification could not be sent.");
      }

      showMessage("Test notification sent to this device.", "success");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Test notification could not be sent.", "error");
    } finally {
      setIsTesting(false);
    }
  }

  async function sendTestToAllDevices() {
    setIsTestingAll(true);

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "all" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Test notification could not be sent.");
      }

      showMessage(`Test notification sent to ${data.sentCount ?? "enabled"} device(s).`, "success");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Test notification could not be sent.", "error");
    } finally {
      setIsTestingAll(false);
    }
  }

  async function checkUpcomingReminders() {
    setIsCheckingReminders(true);

    try {
      const response = await fetch("/api/notifications/check", {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Reminder check could not run.");
      }

      const checked = Number(data.checked ?? 0);
      const sent = Number(data.sent ?? 0);
      const upcoming = Number(data.upcoming ?? 0);
      const pastReminderCount = Number(data.pastReminderCount ?? 0);

      if (data.reason === "no_devices") {
        showMessage("No enabled devices found.", "info");
      } else if (data.reason === "calendar_off") {
        showMessage("Calendar reminders are off.", "info");
      } else if (sent > 0) {
        showMessage(
          `Checked ${upcoming || checked} upcoming post${(upcoming || checked) === 1 ? "" : "s"}. Sent ${sent} reminder${sent === 1 ? "" : "s"}.`,
          "success",
        );
      } else if (pastReminderCount > 0 && upcoming > 0) {
        showMessage("Reminder time already passed for the next upcoming post.", "info");
      } else if (upcoming > 0) {
        showMessage("No reminders due yet.", "info");
      } else {
        showMessage("No upcoming scheduled posts found.", "info");
      }
      await refreshDiagnostics();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Reminder check could not run.", "error");
    } finally {
      setIsCheckingReminders(false);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "Not used yet";

    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateTime(value: string | null) {
    if (!value) return "Never";

    return new Date(value).toLocaleString(undefined, {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-emerald-300/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
              <Bell />
            </div>
            <div>
              <CardTitle>Push notifications</CardTitle>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Get reminders for planned posts, saved ideas, and content workflow tasks.
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-100">
                Notifications are enabled per device. Enable them on each phone, tablet, or
                browser where you want reminders.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Status
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{statusLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={isBusy || isSubscribed || !isSupported || !pushConfigured}
                  onClick={enableNotifications}
                  type="button"
                >
                  {isBusy ? <LoaderCircle className="animate-spin" /> : <Bell />}
                  Enable on this device
                </Button>
                <Button
                  disabled={isTesting || !isSubscribed}
                  onClick={sendTestNotification}
                  type="button"
                  variant="secondary"
                >
                  {isTesting ? <LoaderCircle className="animate-spin" /> : <Send />}
                  Send test to this device
                </Button>
                <Button
                  disabled={isTestingAll || devices.filter((device) => device.enabled).length === 0}
                  onClick={sendTestToAllDevices}
                  type="button"
                  variant="secondary"
                >
                  {isTestingAll ? <LoaderCircle className="animate-spin" /> : <Send />}
                  Send test to all devices
                </Button>
                <Button
                  disabled={isCheckingReminders}
                  onClick={checkUpcomingReminders}
                  type="button"
                  variant="secondary"
                >
                  {isCheckingReminders ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <CalendarDays />
                  )}
                  Check reminders now
                </Button>
                <Button
                  disabled={isBusy || !isSubscribed}
                  onClick={disableNotifications}
                  type="button"
                  variant="secondary"
                >
                  <BellOff />
                  Disable
                </Button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              Browser notifications only work after you allow them on this device. The same account
              can have multiple enabled devices, but each browser creates its own notification
              connection.
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">
              Check reminders now is a manual diagnostic. Automatic delivery is handled separately
              by the secure background scheduler.
            </p>
          </div>

          {message ? (
            <div
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                messageTone === "success"
                  ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100"
                  : messageTone === "error"
                    ? "border-red-400/25 bg-red-400/[0.08] text-red-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-300",
              )}
              role={messageTone === "error" ? "alert" : "status"}
            >
              {message}
            </div>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-zinc-950/70 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Reminder diagnostics</p>
                <p className="mt-1 text-sm text-zinc-500">
                  A safe check of your reminder setup without exposing any keys.
                </p>
              </div>
              <Button onClick={refreshDiagnostics} size="sm" type="button" variant="secondary">
                Refresh
              </Button>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Background reminder scheduler</dt>
                <dd
                  className={cn(
                    "mt-1 text-sm font-medium",
                    diagnostics?.schedulerStatus === "active"
                      ? "text-emerald-200"
                      : "text-amber-200",
                  )}
                >
                  {diagnostics?.schedulerStatusLabel ?? "Not checked"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Last scheduler check</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.lastSchedulerCheck
                    ? formatDateTime(diagnostics.lastSchedulerCheck)
                    : "Never"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Last successful check</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.lastSuccessfulSchedulerCheck
                    ? formatDateTime(diagnostics.lastSuccessfulSchedulerCheck)
                    : "Never"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Last scheduler result</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-zinc-100">
                  {diagnostics?.lastSchedulerResult ?? "No run recorded"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Posts checked</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.schedulerCheckedCount ?? "Not checked"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Reminders sent</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.schedulerSentCount ?? "Not checked"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">This device</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {isSubscribed ? "Notifications enabled" : "Notifications not enabled"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Calendar reminders</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {(diagnostics?.calendarRemindersEnabled ?? preferences.calendar_reminders_enabled)
                    ? "Enabled"
                    : "Off"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Reminder timing</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {reminderOptions.find(
                    (option) =>
                      option.value ===
                      (diagnostics?.reminderMinutesBefore ?? preferences.reminder_minutes_before),
                  )?.label ?? `${preferences.reminder_minutes_before} minutes before`}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Active devices</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.activeDevicesCount ??
                    devices.filter((device) => device.enabled).length}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Upcoming posts</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.upcomingCalendarPostsCount ?? "Not checked"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Next reminder</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.nextReminderTime ?? "None scheduled"}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-500">Last reminder log</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {diagnostics?.lastReminderLogStatus
                    ? `${diagnostics.lastReminderLogStatus}${diagnostics.lastReminderSent ? ` at ${diagnostics.lastReminderSent}` : ""}`
                    : "No reminder log yet"}
                </dd>
              </div>
            </dl>
            {diagnostics && !diagnostics.schedulerSetupReady ? (
              <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-400/[0.06] p-3 text-sm text-amber-100">
                Scheduler database setup is not complete yet. Apply the automatic reminders
                migration, then configure the Supabase Cron job.
              </p>
            ) : null}
            {diagnostics?.environment ? (
              <div className="mt-4 rounded-md border border-white/10 bg-white/[0.025] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Server configuration
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(diagnostics.environment).map(([key, value]) => (
                    <div className="flex items-center justify-between gap-3 text-xs" key={key}>
                      <span className="truncate text-zinc-500">{key}</span>
                      <span
                        className={value === "Configured" ? "text-emerald-200" : "text-amber-200"}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-300">
              <input
                checked={preferences.calendar_reminders_enabled}
                className="mt-1 size-4 accent-emerald-400"
                disabled={isSavingPreferences}
                onChange={(event) =>
                  savePreferences({
                    ...preferences,
                    calendar_reminders_enabled: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>
                <span className="block font-medium text-white">Calendar reminders</span>
                <span className="mt-1 block text-zinc-500">
                  Remind me before scheduled posts.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-300">
              <input
                checked={preferences.workflow_reminders_enabled}
                className="mt-1 size-4 accent-emerald-400"
                disabled={isSavingPreferences}
                onChange={(event) =>
                  savePreferences({
                    ...preferences,
                    workflow_reminders_enabled: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>
                <span className="block font-medium text-white">Workflow reminders</span>
                <span className="mt-1 block text-zinc-500">
                  Keep light nudges on for content tasks.
                </span>
              </span>
            </label>
          </div>

          <label className="block text-sm font-medium text-zinc-400">
            Reminder timing
            <select
              className="mt-2 h-11 w-full max-w-sm rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100"
              disabled={isSavingPreferences}
              onChange={(event) =>
                savePreferences({
                  ...preferences,
                  reminder_minutes_before: Number(event.target.value),
                })
              }
              value={preferences.reminder_minutes_before}
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Connected devices</p>
                <p className="mt-1 text-sm text-zinc-500">
                  These are browsers where this account has enabled notifications.
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {devices.filter((device) => device.enabled).length} active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {devices.length > 0 ? (
                devices.map((device) => {
                  const isCurrentDevice = currentEndpoint && device.endpoint === currentEndpoint;

                  return (
                    <div
                      className="rounded-md border border-white/10 bg-zinc-950/70 p-3"
                      key={device.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {isCurrentDevice ? "Current device" : device.label}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {isCurrentDevice ? device.label : `Last used: ${formatDate(device.last_used_at)}`}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs",
                            device.enabled
                              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                              : "border-white/10 bg-white/[0.04] text-zinc-500",
                          )}
                        >
                          {device.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-600">
                        Added {formatDate(device.created_at)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-md border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                  No notification devices are connected yet.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-white/[0.04] text-zinc-300">
              <Smartphone />
            </div>
            <div>
              <CardTitle>How reminders work</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">A simple web reminder layer for MVP.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm leading-6 text-zinc-400">
            <p>
              Enable notifications on each device where you want Creator OS reminders. A phone,
              tablet, desktop browser, and installed PWA each needs its own setup.
            </p>
            <p>
              Calendar reminders are based on posts you schedule in Creator OS. They do not post,
              like, comment, scrape, or connect to social accounts.
            </p>
            <p className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.06] p-3 text-emerald-100">
              Automatic reminders use a secure background scheduler. Check reminders now runs the
              same reminder check manually for diagnostics; it is not required for normal delivery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
