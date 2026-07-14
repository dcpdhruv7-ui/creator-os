import webPush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushDeliveryResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_config" | "permanent_invalid" | "temporary_failure";
      statusCode?: number;
    };

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
}

export function hasPushConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

export function configureWebPush() {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendWebPushNotification(
  subscription: PushSubscriptionRow,
  payload: PushPayload,
): Promise<PushDeliveryResult> {
  if (!configureWebPush()) {
    return { ok: false, reason: "missing_config" as const };
  }

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    );

    return { ok: true as const };
  } catch (error) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number(error.statusCode)
        : undefined;

    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, reason: "permanent_invalid", statusCode };
    }

    console.error(
      "Push delivery failed.",
      Number.isFinite(statusCode) ? `Provider status: ${statusCode}` : "Provider status unavailable.",
    );

    return {
      ok: false,
      reason: "temporary_failure",
      ...(Number.isFinite(statusCode) ? { statusCode } : {}),
    };
  }
}
