/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Database,
  Download,
  FileText,
  Gauge,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
} from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  resetNicheFoundation,
  updateAccountSettings,
  updateContentPreferences,
  updateCreatorProfileSettings,
} from "./actions";
import { NotificationSettings } from "./notification-settings";
import {
  settingsFormats,
  settingsPlatforms,
  settingsReminderOptions,
  type AccountSettings,
  type ContentPreferences,
  type CreatorProfileSettings,
  type SettingsActionResult,
  type SettingsDiagnostics,
} from "./types";

type SettingsCenterProps = {
  account: AccountSettings;
  creatorProfile: CreatorProfileSettings;
  contentPreferences: ContentPreferences;
  contentPreferencesSetupNeeded: boolean;
  pushConfigured: boolean;
  vapidPublicKey: string;
};

const sections = [
  { id: "account", label: "Account", icon: CircleUserRound },
  { id: "creator-profile", label: "Creator Profile", icon: UserRoundCog },
  { id: "content-preferences", label: "Content Preferences", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data-exports", label: "Data & Exports", icon: Database },
  { id: "diagnostics", label: "Diagnostics", icon: Gauge },
  { id: "privacy-safety", label: "Privacy & Safety", icon: ShieldCheck },
] as const;

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "CO";
  const parts = source.split(/\s+/).filter(Boolean);

  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

function Message({ result }: { result: SettingsActionResult | null }) {
  if (!result) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm",
        result.status === "success"
          ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100"
          : "border-red-400/25 bg-red-400/[0.08] text-red-100",
      )}
      role={result.status === "error" ? "alert" : "status"}
    >
      {result.status === "success" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{result.message}</span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

function AccountSection({ account }: { account: AccountSettings }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SettingsActionResult | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl);
  const [avatarFailed, setAvatarFailed] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => setResult(await updateAccountSettings(formData)));
  }

  return (
    <Card className="border-emerald-300/15">
      <CardHeader>
        <CardTitle>Account details</CardTitle>
        <CardDescription>Your public Creator OS identity and sign-in email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <div className="flex flex-col gap-4 rounded-md border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-emerald-300/20 bg-emerald-400/10 text-lg font-bold text-emerald-100">
              {avatarUrl && !avatarFailed ? (
                <img
                  alt="Account avatar"
                  className="size-full object-cover"
                  onError={() => setAvatarFailed(true)}
                  src={avatarUrl}
                />
              ) : (
                initials(account.fullName, account.email)
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white">Profile image</p>
              <p className="mt-1 text-sm leading-5 text-zinc-500">
                Add a direct image URL, or Creator OS will use your initials.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input defaultValue={account.fullName} id="full_name" maxLength={80} name="full_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                autoCapitalize="none"
                defaultValue={account.username}
                id="username"
                maxLength={30}
                name="username"
                placeholder="creator.name"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="account_email">Email</Label>
              <Input disabled id="account_email" type="email" value={account.email} />
              <p className="text-xs text-zinc-500">Your sign-in email is managed by Supabase Auth.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                maxLength={1000}
                name="avatar_url"
                onChange={(event) => {
                  setAvatarUrl(event.target.value);
                  setAvatarFailed(false);
                }}
                placeholder="https://example.com/avatar.jpg"
                type="url"
                value={avatarUrl}
              />
            </div>
          </div>

          <Message result={result} />

          <div className="flex flex-wrap gap-2">
            <Button disabled={isPending} type="submit">
              {isPending ? <LoaderCircle className="animate-spin" /> : <CircleUserRound />}
              Save profile
            </Button>
          </div>
        </form>
        <form action={logout} className="mt-2">
          <Button type="submit" variant="secondary">
            <LogOut />
            Logout
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreatorProfileSection({ profile }: { profile: CreatorProfileSettings }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SettingsActionResult | null>(null);
  const hasFoundation = profile.exists && Boolean(profile.niche);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => setResult(await updateCreatorProfileSettings(formData)));
  }

  if (!hasFoundation) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-white">No niche foundation yet</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Choose your niche and content direction before editing Creator Profile settings.
            </p>
          </div>
          <Button asChild>
            <Link href="/niche">
              Choose niche <ChevronRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-300/15">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Creator strategy profile</CardTitle>
            <CardDescription className="mt-1">
              Refine the profile Creator OS uses to shape your strategy.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/niche">Edit niche foundation</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
              <p className="text-xs text-zinc-500">Primary niche</p>
              <p className="mt-1 font-medium text-white">{profile.niche}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
              <p className="text-xs text-zinc-500">Content direction</p>
              <p className="mt-1 font-medium text-white">{profile.subNiche || "Not selected"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["content_tone", "Content tone", profile.contentTone],
              ["energy_style", "Energy style", profile.energyStyle],
              ["editing_style", "Editing style", profile.editingStyle],
              ["caption_style", "Caption style", profile.captionStyle],
              ["posting_frequency", "Posting frequency", profile.postingFrequency],
            ].map(([name, label, value]) => (
              <div className="space-y-2" key={name}>
                <Label htmlFor={name}>{label}</Label>
                <Input defaultValue={value} id={name} maxLength={240} name={name} />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="best_formats">Best formats</Label>
              <Input
                defaultValue={profile.bestFormats.join(", ")}
                id="best_formats"
                maxLength={500}
                name="best_formats"
                placeholder="Tutorial, BTS, Talking head"
              />
              <p className="text-xs text-zinc-500">Separate formats with commas.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="growth_angle">Growth angle</Label>
              <Textarea defaultValue={profile.growthAngle} id="growth_angle" maxLength={600} name="growth_angle" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="personal_brand_direction">Personal brand direction</Label>
              <Textarea
                defaultValue={profile.personalBrandDirection}
                id="personal_brand_direction"
                maxLength={800}
                name="personal_brand_direction"
              />
            </div>
          </div>

          <Message result={result} />
          <Button disabled={isPending} type="submit">
            {isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            Save creator profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ContentPreferencesSection({
  preferences,
  setupNeeded,
}: {
  preferences: ContentPreferences;
  setupNeeded: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SettingsActionResult | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => setResult(await updateContentPreferences(formData)));
  }

  return (
    <Card className="border-emerald-300/15">
      <CardHeader>
        <CardTitle>Planning defaults</CardTitle>
        <CardDescription>
          Save your preferred platforms and formats for future Creator OS personalization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {setupNeeded ? (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-amber-300/25 bg-amber-400/[0.07] p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Database setup needed</p>
              <p className="mt-1 leading-6 text-amber-100/75">
                Apply the Settings Center preferences migration in Supabase before saving this section.
              </p>
            </div>
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={submit}>
          <fieldset>
            <legend className="text-sm font-medium text-zinc-200">Preferred platforms</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {settingsPlatforms.map((platform) => (
                <label
                  className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-300"
                  key={platform}
                >
                  <input
                    className="size-4 accent-emerald-400"
                    defaultChecked={preferences.preferredPlatforms.includes(platform)}
                    name="preferred_platforms"
                    type="checkbox"
                    value={platform}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-200">Preferred content formats</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {settingsFormats.map((format) => (
                <label
                  className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 text-sm text-zinc-300"
                  key={format}
                >
                  <input
                    className="size-4 accent-emerald-400"
                    defaultChecked={preferences.preferredFormats.includes(format)}
                    name="preferred_formats"
                    type="checkbox"
                    value={format}
                  />
                  {format}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekly_posting_goal">Weekly posting goal</Label>
              <Input
                defaultValue={preferences.weeklyPostingGoal}
                id="weekly_posting_goal"
                max={21}
                min={1}
                name="weekly_posting_goal"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_platform">Default calendar platform</Label>
              <select
                className="h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15"
                defaultValue={preferences.defaultPlatform}
                id="default_platform"
                name="default_platform"
              >
                {settingsPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reminder_minutes_before">Default reminder timing</Label>
              <select
                className="h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15 sm:max-w-sm"
                defaultValue={preferences.reminderMinutesBefore}
                id="reminder_minutes_before"
                name="reminder_minutes_before"
              >
                {settingsReminderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">
                This is the same reminder timing used in Notification settings.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="content_style_notes">Preferred content style notes</Label>
              <Textarea
                defaultValue={preferences.contentStyleNotes}
                id="content_style_notes"
                maxLength={1000}
                name="content_style_notes"
                placeholder="Example: Keep my content practical, energetic, and easy to save."
              />
            </div>
          </div>

          <Message result={result} />
          <Button disabled={isPending || setupNeeded} type="submit">
            {isPending ? <LoaderCircle className="animate-spin" /> : <Settings2 />}
            Save preferences
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DataExportsSection({ onReset }: { onReset: () => void }) {
  const [isResetting, startResetTransition] = useTransition();
  const [result, setResult] = useState<SettingsActionResult | null>(null);

  function clearDismissal() {
    localStorage.removeItem("creator-os-notification-opt-in-dismissed-until");
    setResult({ status: "success", message: "Notification prompt dismissal cleared on this device." });
  }

  function resetFoundation() {
    if (
      !window.confirm(
        "Reset your niche foundation and creator profile? Saved ideas, captions, calendar posts, and analytics will be preserved.",
      )
    ) {
      return;
    }

    startResetTransition(async () => {
      const nextResult = await resetNicheFoundation();
      setResult(nextResult);

      if (nextResult.status === "success") onReset();
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-emerald-300/15">
        <CardHeader>
          <CardTitle>Export your data</CardTitle>
          <CardDescription>Download your Creator OS records as CSV files.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {[
            ["ideas", "Saved ideas"],
            ["captions", "Captions"],
            ["calendar", "Calendar posts"],
            ["analytics", "Analytics entries"],
          ].map(([resource, label]) => (
            <Button asChild className="justify-start" key={resource} variant="secondary">
              <a href={`/api/settings/export/${resource}`}>
                <Download />
                Export {label}
              </a>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset and local controls</CardTitle>
          <CardDescription>Manage onboarding choices without deleting saved work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" onClick={clearDismissal} type="button" variant="secondary">
            <Bell />
            Show notification opt-in prompt again
          </Button>
          <Button
            className="w-full justify-start"
            disabled={isResetting}
            onClick={resetFoundation}
            type="button"
            variant="secondary"
          >
            {isResetting ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}
            Reset niche foundation
          </Button>
          <Button className="w-full justify-between" disabled type="button" variant="secondary">
            <span className="flex items-center gap-2">
              <LockKeyhole /> Delete account
            </span>
            <span className="text-xs text-zinc-500">Coming later</span>
          </Button>
          <Message result={result} />
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosticsSection() {
  const [diagnostics, setDiagnostics] = useState<SettingsDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/settings/diagnostics", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Diagnostics could not be loaded.");
      setDiagnostics(data);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Diagnostics could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetch("/api/settings/diagnostics", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) throw new Error(data.error ?? "Diagnostics could not be loaded.");
        return data;
      })
      .then((data) => {
        if (active) setDiagnostics(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Diagnostics could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () => [
      ["Auth session active", diagnostics?.authSessionActive],
      ["Profile row exists", diagnostics?.profileExists],
      ["Creator profile exists", diagnostics?.creatorProfileExists],
      ["Saved ideas", diagnostics?.savedIdeasCount],
      ["Saved captions", diagnostics?.savedCaptionsCount],
      ["Calendar posts", diagnostics?.calendarPostsCount],
      ["Analytics entries", diagnostics?.analyticsEntriesCount],
      ["Notification devices", diagnostics?.notificationDevicesCount],
      ["Last reminder log", diagnostics?.lastReminderLogStatus ?? "No reminder log yet"],
      ["App environment", diagnostics?.appEnvironment],
      ["App version", diagnostics?.appVersion],
    ],
    [diagnostics],
  );

  function displayValue(value: unknown) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (value === null || value === undefined || value === "") return "Unavailable";
    return String(value);
  }

  return (
    <Card className="border-emerald-300/15">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Safe app diagnostics</CardTitle>
            <CardDescription className="mt-1">
              Check account data and app status without exposing configuration secrets.
            </CardDescription>
          </div>
          <Button disabled={isLoading} onClick={refresh} size="sm" type="button" variant="secondary">
            {isLoading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
            Refresh diagnostics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-md border border-red-400/25 bg-red-400/[0.08] p-3 text-sm text-red-100" role="alert">
            {error}
          </div>
        ) : null}
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(([label, value]) => (
            <div className="rounded-md border border-white/10 bg-white/[0.025] p-3" key={String(label)}>
              <dt className="text-xs text-zinc-500">{String(label)}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-zinc-100">
                {isLoading && !diagnostics ? "Checking..." : displayValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function PrivacySection() {
  const safeguards = [
    "Creator OS never asks for your social media passwords.",
    "Creator OS does not auto-like, auto-follow, auto-comment, scrape, or send mass DMs.",
    "Creator OS does not auto-post to social platforms in the MVP.",
    "Your saved data is scoped to your signed-in account through database access rules.",
    "Future social integrations will use official platform APIs only.",
  ];

  return (
    <Card className="border-emerald-300/15">
      <CardHeader>
        <CardTitle>Privacy and product safety</CardTitle>
        <CardDescription>Clear boundaries for how Creator OS handles your workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {safeguards.map((item) => (
            <div className="flex items-start gap-3 text-sm leading-6 text-zinc-300" key={item}>
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/api/settings/export/ideas">
              <Download /> Export saved ideas
            </Link>
          </Button>
          <Button disabled variant="secondary">
            <LockKeyhole /> Delete account - Coming later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsCenter({
  account,
  creatorProfile,
  contentPreferences,
  contentPreferencesSetupNeeded,
  pushConfigured,
  vapidPublicKey,
}: SettingsCenterProps) {
  const router = useRouter();
  const [creator, setCreator] = useState(creatorProfile);

  function jumpToSection(value: string) {
    document.getElementById(value)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNicheReset() {
    setCreator({
      ...creator,
      niche: "",
      subNiche: "",
      contentTone: "",
      energyStyle: "",
      editingStyle: "",
      captionStyle: "",
      bestFormats: [],
      postingFrequency: "",
      growthAngle: "",
      personalBrandDirection: "",
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <label className="block text-sm font-medium text-zinc-300 lg:hidden" htmlFor="settings-section">
          Jump to settings
        </label>
        <select
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 lg:hidden"
          defaultValue="account"
          id="settings-section"
          onChange={(event) => jumpToSection(event.target.value)}
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>

        <nav className="hidden rounded-lg border border-white/10 bg-zinc-950/72 p-2 lg:block">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <a
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                href={`#${section.id}`}
                key={section.id}
              >
                <Icon className="size-4" />
                {section.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 space-y-10">
        <section className="scroll-mt-24" id="account">
          <SectionHeading
            description="Manage your profile details and see the email connected to this account."
            eyebrow="Account"
            title="Your Creator OS account"
          />
          <AccountSection account={account} />
        </section>

        <section className="scroll-mt-24" id="creator-profile">
          <SectionHeading
            description="Adjust the strategy profile built from your niche and inspiration choices."
            eyebrow="Creator Profile"
            title="How Creator OS understands your brand"
          />
          <CreatorProfileSection profile={creator} />
        </section>

        <section className="scroll-mt-24" id="content-preferences">
          <SectionHeading
            description="Set lightweight defaults for your planning workflow. These preferences do not change generators yet."
            eyebrow="Content Preferences"
            title="Your planning defaults"
          />
          <ContentPreferencesSection
            preferences={contentPreferences}
            setupNeeded={contentPreferencesSetupNeeded}
          />
        </section>

        <section className="scroll-mt-24" id="notifications">
          <SectionHeading
            description="Control reminders, connected devices, delivery timing, and notification diagnostics."
            eyebrow="Notifications"
            title="Reminder controls"
          />
          <NotificationSettings pushConfigured={pushConfigured} vapidPublicKey={vapidPublicKey} />
        </section>

        <section className="scroll-mt-24" id="data-exports">
          <SectionHeading
            description="Download your records or reset onboarding choices without removing saved work."
            eyebrow="Data & Exports"
            title="Your data controls"
          />
          <DataExportsSection onReset={handleNicheReset} />
        </section>

        <section className="scroll-mt-24" id="diagnostics">
          <SectionHeading
            description="Check the health of your account data and app connection without exposing secrets."
            eyebrow="Diagnostics"
            title="Creator OS status"
          />
          <DiagnosticsSection />
        </section>

        <section className="scroll-mt-24" id="privacy-safety">
          <SectionHeading
            description="Understand what Creator OS does, what it stores, and the automation it intentionally avoids."
            eyebrow="Privacy & Safety"
            title="Clear product boundaries"
          />
          <PrivacySection />
        </section>

        <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-zinc-600">
          <FileText className="size-4" />
          Settings are saved per account. Notification permission remains per device.
        </div>
      </div>
    </div>
  );
}
