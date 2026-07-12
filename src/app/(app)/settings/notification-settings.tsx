"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, LoaderCircle, Send, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getActiveSubscription() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  return registration?.pushManager.getSubscription() ?? null;
}

export function NotificationSettings({
  pushConfigured,
  vapidPublicKey,
}: NotificationSettingsProps) {
  const [isSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
  );
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [devices, setDevices] = useState<NotificationDevice[]>([]);
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
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        showMessage("Notifications were not allowed in this browser.", "error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Push subscription could not be saved.");
      }

      setIsSubscribed(true);
      setCurrentEndpoint(subscription.endpoint);
      await refreshDevices();
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

  function formatDate(value: string | null) {
    if (!value) return "Not used yet";

    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
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
              To use reminders in production, add VAPID keys and schedule the secure cron endpoint
              in Vercel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
