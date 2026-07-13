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
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
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
  if (!isWebPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  return registration?.pushManager.getSubscription() ?? null;
}

export async function enablePushNotifications({
  pushConfigured,
  vapidPublicKey,
}: {
  pushConfigured: boolean;
  vapidPublicKey: string;
}): Promise<EnableNotificationsResult> {
  if (!isWebPushSupported()) {
    return {
      status: "unsupported",
      message: "This browser does not support web push notifications.",
    };
  }

  if (!pushConfigured || !vapidPublicKey) {
    return {
      status: "error",
      message: "Push notifications are not configured yet.",
    };
  }

  try {
    if (Notification.permission === "denied") {
      return {
        status: "blocked",
        message: "Notifications are blocked in your browser settings.",
      };
    }

    const nextPermission = await Notification.requestPermission();

    if (nextPermission !== "granted") {
      return {
        status: "blocked",
        message: "Notifications were not allowed in this browser.",
      };
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

    return {
      status: "enabled",
      endpoint: subscription.endpoint,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Notifications could not be enabled.",
    };
  }
}
