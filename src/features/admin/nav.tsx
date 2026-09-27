/* Admin navigation: one place that defines pages, groups and legacy URLs. */
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  FolderOpen,
  Home,
  Inbox,
  Megaphone,
  Settings,
  Users,
  UsersRound,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminPageKey =
  | "today"
  | "students"
  | "payments"
  | "inbox"
  | "classes"
  | "cohorts"
  | "announcements"
  | "courses"
  | "resources"
  | "community"
  | "settings";

export type AdminNavGroup = "Overview" | "People" | "Teaching" | "Content" | "System";

export type AdminNavItem = {
  key: AdminPageKey;
  label: string;
  path: string;
  icon: LucideIcon;
  group: AdminNavGroup;
  /** Shown in the phone bottom bar (the rest live under "More"). */
  tab?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { key: "today", label: "Today", path: "/admin/today", icon: Home, group: "Overview", tab: true },
  { key: "students", label: "Students", path: "/admin/students", icon: Users, group: "People", tab: true },
  { key: "payments", label: "Payments", path: "/admin/payments", icon: CreditCard, group: "People" },
  { key: "inbox", label: "Inbox", path: "/admin/inbox", icon: Inbox, group: "People", tab: true },
  { key: "classes", label: "Classes", path: "/admin/classes", icon: CalendarDays, group: "Teaching", tab: true },
  { key: "cohorts", label: "Cohorts", path: "/admin/cohorts", icon: UsersRound, group: "Teaching" },
  { key: "announcements", label: "Announcements", path: "/admin/announcements", icon: Megaphone, group: "Teaching" },
  { key: "courses", label: "Courses & paths", path: "/admin/courses", icon: BookOpen, group: "Content" },
  { key: "resources", label: "Resources", path: "/admin/resources", icon: FolderOpen, group: "Content" },
  { key: "community", label: "Community", path: "/admin/community", icon: Layers, group: "Content" },
  { key: "settings", label: "Settings", path: "/admin/settings", icon: Settings, group: "System" },
];

export const NAV_GROUPS: AdminNavGroup[] = ["Overview", "People", "Teaching", "Content", "System"];

/** Old admin URLs (bookmarks, links in docs) keep working. */
export const LEGACY_ADMIN_REDIRECTS: Record<string, string> = {
  registrations: "/admin/students",
  "mobile-chat": "/admin/inbox",
  messages: "/admin/announcements",
  sessions: "/admin/classes",
  paths: "/admin/courses?tab=paths",
};

export const pageFromPath = (pathname: string): AdminNavItem | undefined => {
  const seg = String(pathname || "").replace(/\/+$/, "").split("/")[2] || "today";
  return ADMIN_NAV.find((i) => i.key === seg);
};
