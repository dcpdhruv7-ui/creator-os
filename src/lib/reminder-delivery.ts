import type {
  PushDeliveryResult,
  PushPayload,
  PushSubscriptionRow,
} from "@/lib/notifications";

export const MAX_REMINDER_ATTEMPTS = 3;
export const REMINDER_RETRY_DELAY_MINUTES = 2;
export const STALE_REMINDER_CLAIM_SECONDS = 300;

export type ReminderClaimState = {
  status: string;
  attemptCount: number;
  claimedAt?: Date | null;
  nextRetryAt?: Date | null;
};

export function canClaimReminderState(
  state: ReminderClaimState | null,
  now = new Date(),
) {
  if (!state) return true;
  if (state.status === "sent" || state.attemptCount >= MAX_REMINDER_ATTEMPTS) return false;

  if (state.status === "failed") {
    return !state.nextRetryAt || state.nextRetryAt <= now;
  }

  if (state.status === "processing") {
    return Boolean(
      state.claimedAt &&
        state.claimedAt.getTime() <= now.getTime() - STALE_REMINDER_CLAIM_SECONDS * 1000,
    );
  }

  return false;
}

export async function deliverReminderToSubscriptions({
  subscriptions,
  payload,
  send,
  disable,
}: {
  subscriptions: PushSubscriptionRow[];
  payload: PushPayload;
  send: (
    subscription: PushSubscriptionRow,
    payload: PushPayload,
  ) => Promise<PushDeliveryResult>;
  disable: (subscriptionId: string) => Promise<void>;
}) {
  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      const result = await send(subscription, payload).catch(() => ({
        ok: false as const,
        reason: "temporary_failure" as const,
      }));

      if (!result.ok && result.reason === "permanent_invalid") {
        await disable(subscription.id).catch(() => undefined);
      }

      return result;
    }),
  );

  return {
    sentCount: results.filter((result) => result.ok).length,
    invalidCount: results.filter(
      (result) => !result.ok && result.reason === "permanent_invalid",
    ).length,
    temporaryFailureCount: results.filter(
      (result) => !result.ok && result.reason === "temporary_failure",
    ).length,
    missingConfig: results.some(
      (result) => !result.ok && result.reason === "missing_config",
    ),
  };
}
