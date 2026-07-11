import { Bell } from "lucide-react";

import { getVapidPublicKey, hasPushConfig } from "@/lib/notifications";
import { NotificationSettings } from "./notification-settings";

export default function SettingsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
          <Bell />
        </div>
        <p className="text-sm font-medium text-emerald-300">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Notification settings
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Control browser reminders for scheduled posts and Creator OS workflow nudges.
        </p>
      </div>

      <NotificationSettings
        pushConfigured={hasPushConfig()}
        vapidPublicKey={getVapidPublicKey()}
      />
    </section>
  );
}
