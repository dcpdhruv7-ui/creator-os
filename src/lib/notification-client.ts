"use client";

export type EnableNotificationsResult =
  | { status: "enabled"; endpoint: string }
  | { status: "already-enabled"; endpoint: string }
  | { status: "blocked"; message: string }
  | { status: "unsupported"; message: string }
  | { status: "error"; message: string };

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

export function getCurrentBrowserLabel() {
  if (typeof navigator === "undefined") return "Unknown browser";

  const userAgent = navigator.userAgent;
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Browser";
  const device = /Android|iPhone|iPad|Mobile/i.test(userAgent) ? "Mobile" : "Desktop";

  return `${browser} on ${device}`;
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function getActiveSubscription() {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager.getSubscription() ?? null;
}

async function readyServiceWorker() {
  await navigator.serviceWorker.register("/sw.js");

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      window.setTimeout(
        () => reject(new Error("The notification service worker is not ready. Refresh and try again.")),
        10000,
      ),
    ),
  ]);
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "The browser subscription could not be saved to Creator OS.");
  }
}

async function subscribe(vapidPublicKey: string) {
  const registration = await readyServiceWorker();
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

function safeClientError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Notifications could not be enabled on this device.";
}

export async function enablePushNotifications({
  pushConfigured,
  vapidPublicKey,
}: {
  pushConfigured: boolean;
  vapidPublicKey: string;
}): Promise<EnableNotificationsResult> {
  if (!isWebPushSupported()) {
    return { status: "unsupported", message: "This browser does not support web push notifications." };
  }

  if (!pushConfigured || !vapidPublicKey) {
    return {
      status: "error",
      message: "The VAPID public key is missing in production. Add it in Vercel and redeploy.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      status: "blocked",
      message: "Notifications are blocked in this browser. Open site settings and allow notifications for Creator OS.",
    };
  }

  try {
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== "granted") {
      return {
        status: "blocked",
        message: "Notifications were not allowed. Use this browser's site settings to allow them, then try again.",
      };
    }

    const existing = await getActiveSubscription();
    const subscription = existing ?? (await subscribe(vapidPublicKey));
    await saveSubscription(subscription);

    return {
      status: existing ? "already-enabled" : "enabled",
      endpoint: subscription.endpoint,
    };
  } catch (error) {
    return { status: "error", message: safeClientError(error) };
  }
}

export async function repairPushNotifications({
  pushConfigured,
  vapidPublicKey,
}: {
  pushConfigured: boolean;
  vapidPublicKey: string;
}): Promise<EnableNotificationsResult> {
  if (!isWebPushSupported()) {
    return { status: "unsupported", message: "This browser does not support web push notifications." };
  }

  if (Notification.permission === "denied") {
    return {
      status: "blocked",
      message: "Notifications are blocked in this browser. Open site settings and allow notifications for Creator OS.",
    };
  }

  if (Notification.permission !== "granted") {
    return {
      status: "error",
      message: "Allow notifications first, then use Repair this device if the subscription is stale.",
    };
  }

  if (!pushConfigured || !vapidPublicKey) {
    return {
      status: "error",
      message: "The VAPID public key is missing in production. Add it in Vercel and redeploy.",
    };
  }

  try {
    const existing = await getActiveSubscription();

    if (existing) {
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: existing.endpoint }),
      });
      await existing.unsubscribe();
    }

    const subscription = await subscribe(vapidPublicKey);
    await saveSubscription(subscription);

    return { status: "enabled", endpoint: subscription.endpoint };
  } catch (error) {
    return { status: "error", message: safeClientError(error) };
  }
}
