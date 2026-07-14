export type AccountSettings = {
  fullName: string;
  username: string;
  avatarUrl: string;
  email: string;
};

export type CreatorProfileSettings = {
  exists: boolean;
  niche: string;
  subNiche: string;
  contentTone: string;
  energyStyle: string;
  editingStyle: string;
  captionStyle: string;
  bestFormats: string[];
  postingFrequency: string;
  growthAngle: string;
  personalBrandDirection: string;
};

export type ContentPreferences = {
  preferredPlatforms: string[];
  preferredFormats: string[];
  weeklyPostingGoal: number;
  defaultPlatform: string;
  reminderMinutesBefore: number;
  contentStyleNotes: string;
};

export type SettingsActionResult = {
  status: "success" | "error";
  message: string;
  setupNeeded?: boolean;
};

export type SettingsDiagnostics = {
  authSessionActive: boolean;
  profileExists: boolean | null;
  creatorProfileExists: boolean | null;
  savedIdeasCount: number | null;
  savedCaptionsCount: number | null;
  calendarPostsCount: number | null;
  analyticsEntriesCount: number | null;
  notificationDevicesCount: number | null;
  lastReminderLogStatus: string | null;
  appEnvironment: string;
  appVersion: string;
};

export const settingsPlatforms = [
  "Instagram",
  "YouTube Shorts",
  "TikTok",
  "LinkedIn",
  "Other",
] as const;

export const settingsFormats = [
  "Short-form video",
  "Carousel",
  "Talking head",
  "Tutorial",
  "Behind the scenes",
  "Story-led post",
] as const;

export const settingsReminderOptions = [
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
] as const;
