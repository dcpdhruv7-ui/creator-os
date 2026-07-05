import {
  BarChart3,
  CalendarDays,
  Compass,
  Lightbulb,
  Sparkles,
  UserRoundCog,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const dashboardCards = [
  {
    title: "My Niche",
    description: "Your primary niche and sub-niche choices will appear here.",
    icon: Compass,
  },
  {
    title: "Creator Profile",
    description: "Tone, energy, editing style, and growth angle are coming next.",
    icon: UserRoundCog,
  },
  {
    title: "Ideas",
    description: "Generated content ideas and hooks will live in this workspace.",
    icon: Lightbulb,
  },
  {
    title: "Calendar",
    description: "Your weekly content plan will be organized here.",
    icon: CalendarDays,
  },
  {
    title: "Analytics",
    description: "Manual tracking for views, saves, reach, and engagement.",
    icon: BarChart3,
  },
  {
    title: "Recommendations",
    description: "Simple growth recommendations based on your inputs.",
    icon: Sparkles,
  },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-300">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
          Creator OS foundation
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Day 1 is focused on account access, navigation, database structure, and a clean home for
          the next MVP layers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card className="min-h-40" key={card.title}>
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Placeholder
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
