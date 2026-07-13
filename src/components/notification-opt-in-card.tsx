"use client";

import { useEffect, useState } from "react";
import { Bell, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  enablePushNotifications,
  getActiveSubscription,
  getNotificationPermission,
  isWebPushSupported,
} from "@/lib/notification-client";
import { cn } from "@/lib/utils";

const dismissalKey = "creator-os-notification-opt-in-dismissed-until";
const dismissalMs = 7 * 24 * 60 * 60 * 1000;

type NotificationOptInCardProps = {
  pushConfigured: boolean;
  vapidPublicKey: string;
  className?: string;
};

function isDismissed() {
  if (typeof window === "undefined") return true;

  const dismissedUntil = Number(window.localStorage.getItem(dismissalKey) ?? 0);

  return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
}

export function NotificationOptInCard({
  pushConfigured,
  vapidPublicKey,
  className,
}: NotificationOptInCardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      if (!pushConfigured || !vapidPublicKey || !isWebPushSupported() || isDismissed()) {
        if (isMounted) {
          setIsVisible(false);
          setIsChecking(false);
        }
        return;
      }

      const nextPermission = getNotificationPermission();
      const subscription = await getActiveSubscription().catch(() => null);

      if (!isMounted) {
        return;
      }

      setPermission(nextPermission);
      setIsVisible(!subscription);
      setIsChecking(false);

      if (nextPermission === "denied") {
        setMessage("Notifications are blocked in your browser settings.");
        setMessageTone("error");
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [pushConfigured, vapidPublicKey]);

  async function enableReminders() {
    setIsBusy(true);
    setMessage("");

    try {
      const result = await enablePushNotifications({ pushConfigured, vapidPublicKey });
      setPermission(getNotificationPermission());

      if (result.status === "enabled" || result.status === "already-enabled") {
        setMessage("Notifications enabled for this device.");
        setMessageTone("success");
        setIsVisible(false);
        window.localStorage.removeItem(dismissalKey);
        return;
      }

      setMessage(result.message);
      setMessageTone(result.status === "blocked" ? "error" : "error");
    } finally {
      setIsBusy(false);
    }
  }

  function dismissPrompt() {
    window.localStorage.setItem(dismissalKey, String(Date.now() + dismissalMs));
    setIsVisible(false);
  }

  if (isChecking || !isVisible) {
    return null;
  }

  const isBlocked = permission === "denied";

  return (
    <Card className={cn("border-emerald-300/20", className)}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
            <Bell />
          </div>
          <div>
            <p className="font-semibold text-white">Turn on Creator OS reminders</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Get reminders for scheduled posts, saved ideas, and content tasks on this device.
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-100">
              Notifications are enabled per device. Turn them on for each phone, tablet, or browser
              where you want reminders.
            </p>
            {isBlocked ? (
              <p className="mt-2 text-sm text-red-200">
                Notifications are blocked in your browser settings.
              </p>
            ) : null}
            {message ? (
              <p
                className={cn(
                  "mt-2 text-sm",
                  messageTone === "success" ? "text-emerald-200" : "text-red-200",
                )}
                role={messageTone === "error" ? "alert" : "status"}
              >
                {message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {!isBlocked ? (
            <Button disabled={isBusy} onClick={enableReminders} type="button">
              {isBusy ? <LoaderCircle className="animate-spin" /> : <Bell />}
              Enable reminders
            </Button>
          ) : null}
          <Button disabled={isBusy} onClick={dismissPrompt} type="button" variant="secondary">
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
