import {
  BarChart3,
  CalendarDays,
  Captions,
  Compass,
  Gauge,
  Lightbulb,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export const navigationItems = [
  { title: "Dashboard", href: "/dashboard", icon: Gauge },
  { title: "Niche", href: "/niche", icon: Compass },
  { title: "Creators", href: "/creators", icon: Users },
  { title: "Ideas", href: "/ideas", icon: Lightbulb },
  { title: "Captions", href: "/captions", icon: Captions },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Recommendations", href: "/recommendations", icon: Sparkles },
  { title: "Settings", href: "/settings", icon: Settings },
];
