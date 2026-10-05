import React, { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  BookOpen,
  CreditCard,
  Download,
  House,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  PlayCircle,
  Smartphone,
  Users,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import type { View } from "../../app/views";
import type { RegistrationEntry } from "../../../services/registrationStore";
import { BrandMark, Lockup, mbtn } from "../../marketing/ui";
import { useContactLinks } from "../../marketing/useContactLinks";
import { cn } from "../../ui";
import { Avatar, Card, IconTile, Spinner } from "../shared/ui";
import { useStudentData, type MentorContext } from "./useStudentData";
import { StudentDataProvider, type StudentActions } from "./StudentDataContext";
import { AddWeeksDialog } from "./components/AddWeeksDialog";
import { UpdatesBell } from "./ui";
import { sectionFromPathname, studentSectionRoutes, type StudentSection } from "./lib";

const Home = lazy(() => import("./sections/Home"));
const Classes = lazy(() => import("./sections/Classes"));
const Resources = lazy(() => import("./sections/Resources"));
const Community = lazy(() => import("./sections/Community"));
const MentorChat = lazy(() => import("./sections/MentorChat"));
const Updates = lazy(() => import("./sections/Updates"));
const Badges = lazy(() => import("./sections/Badges"));
const Account = lazy(() => import("./sections/Account"));
const More = lazy(() => import("./sections/More"));

const sectionComponents: Record<StudentSection, React.ComponentType> = {
  dashboard: Home,
  classes: Classes,
  resources: Resources,
  community: Community,
  chat: MentorChat,
  notifications: Updates,
  badges: Badges,
  account: Account,
  more: More,
};

export const sectionTitles: Record<StudentSection, string> = {
  dashboard: "Home",
  classes: "Classes",
  resources: "Resources",
  community: "Community",
  chat: "Mentor chat",
  notifications: "Updates",
  badges: "Badges",
  account: "Payments & account",
  more: "More",
};

type NavItem = { key: StudentSection; label: string; icon: LucideIcon; count?: number; dot?: boolean };

/** Orange count for unread things (orange is kept for "needs your attention"). */
const CountPill: React.FC<{ count?: number; dot?: boolean; label: string }> = ({ count, dot, label }) =>
  count ? (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
      {count > 9 ? "9+" : count}
      <span className="sr-only"> {label}</span>
    </span>
  ) : dot ? (
    <span className="ml-auto h-2.5 w-2.5 rounded-full bg-orange-500">
      <span className="sr-only">{label}</span>
    </span>
  ) : null;

const Sidebar: React.FC<{
  main: NavItem[];
  account: NavItem[];
  name: string;
  status: string;
  apk?: string;
  onLogout: () => void;
}> = ({ main, account, name, status, apk, onLogout }) => {
  const link = (item: NavItem) => (
    <li key={item.key}>
      <NavLink
        to={studentSectionRoutes[item.key]}
        className={({ isActive }) =>
          cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors",
            isActive
              ? "bg-teal-50 font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-200"
              : "font-semibold text-slate-600 hover:bg-paper hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate">{item.label}</span>
        <CountPill count={item.count} dot={item.dot} label={item.key === "chat" ? "new reply" : "unread"} />
      </NavLink>
    </li>
  );
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-white px-4 pb-4 pt-6 dark:border-line-dark dark:bg-slate-950 lg:flex">
      <Link to="/" aria-label="CodeWithGideon home" className="px-2">
        <Lockup className="h-8" />
      </Link>
      <nav aria-label="Student area" className="mt-8 flex-1 overflow-y-auto">
        <ul className="space-y-1">{main.map(link)}</ul>
        <p className="mb-2 mt-7 px-3 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Account</p>
        <ul className="space-y-1">{account.map(link)}</ul>
      </nav>
      {apk ? (
        <div className="mt-4 rounded-2xl bg-teal-50 p-4 dark:bg-teal-950/60">
          <Smartphone className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden />
          <p className="mt-2 text-sm font-bold text-blue-900 dark:text-white">Get the app</p>
          <p className="mt-1 text-[13px] font-medium leading-5 text-slate-600 dark:text-slate-300">Classes, recordings and mentor chat on your phone.</p>
          <a href={apk} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-700 hover:underline dark:text-teal-300">
            Download for Android <Download className="h-4 w-4" aria-hidden />
          </a>
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line p-3 dark:border-line-dark">
        <Avatar name={name} size={38} />
        <Link to={studentSectionRoutes.account} className="min-w-0 flex-1 hover:underline">
          <span className="block truncate text-sm font-bold text-blue-900 dark:text-white">{name || "Student"}</span>
          <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{status}</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-paper hover:text-blue-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </div>
    </aside>
  );
};

const TabBar: React.FC<{ items: NavItem[] }> = ({ items }) => (
  <nav
    aria-label="Student area"
    className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] dark:border-line-dark dark:bg-slate-950 lg:hidden"
  >
    <ul className="mx-auto grid h-16 max-w-[560px] grid-cols-5">
      {items.map((item) => (
        <li key={item.key}>
          <NavLink
            to={studentSectionRoutes[item.key]}
            className={({ isActive }) =>
              cn("flex h-full flex-col items-center justify-center gap-1 text-[11px]", isActive ? "font-bold text-teal-700 dark:text-teal-300" : "font-semibold text-slate-500 dark:text-slate-400")
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn("relative flex h-7 w-12 items-center justify-center rounded-full", isActive && "bg-teal-50 dark:bg-teal-950")}>
                  <item.icon className="h-[22px] w-[22px]" aria-hidden />
                  {item.count || item.dot ? (
                    <span className="absolute right-2.5 top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-950" aria-hidden />
                  ) : null}
                </span>
                {item.label}
                {item.count || item.dot ? <span className="sr-only">, {item.key === "chat" ? "new reply" : "unread"}</span> : null}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

type Props = {
  profile: RegistrationEntry | null;
  onNavigate: (view: View, extraData?: unknown) => void;
  onLogout: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
};

/**
 * The student app: a sidebar on desktop, a header and bottom tabs on phones,
 * and one route per section. Sections share data through
 * StudentDataProvider, so switching sections doesn't reload anything.
 */
const StudentArea: React.FC<Props> = ({ profile, onNavigate, onLogout, isDark, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = sectionFromPathname(location.pathname);
  const data = useStudentData(profile, activeSection);
  const { apk } = useContactLinks();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [chatContext, setChatContext] = useState<MentorContext | null>(null);

  const paymentBase = useMemo(
    () =>
      profile
        ? {
            uid: profile.uid,
            email: profile.email,
            fullName: profile.fullName,
            phone: profile.phone,
            path: profile.path,
            pathId: profile.pathId,
            courseId: profile.courseId,
            courseTitle: data.courseTitle,
            cohortId: data.cohortId,
            cohortLabel: data.cohortLabel,
            cohortKey: data.cohortKey,
            courseDurationWeeks: data.totalProgramWeeks,
            weeklyRate: data.weeklyRate,
          }
        : null,
    [profile, data.courseTitle, data.cohortId, data.cohortLabel, data.cohortKey, data.totalProgramWeeks, data.weeklyRate],
  );

  const goTo = useCallback((section: StudentSection) => navigate(studentSectionRoutes[section]), [navigate]);

  const continuePayment = useCallback(() => {
    if (!profile || !paymentBase || data.reviewPayment) return;
    const pending = data.pendingPayment;
    onNavigate("payment", {
      selectedPath: profile.path,
      userData: pending
        ? {
            ...paymentBase,
            weeksToCommit: Number(pending.weeks) || 1,
            originalWeeks: data.paidWeeks,
            isTopUp: pending.kind === "topup",
            reference: pending.reference,
          }
        : { ...paymentBase, weeksToCommit: data.intendedWeeks, isTopUp: false },
    });
  }, [profile, paymentBase, data.reviewPayment, data.pendingPayment, data.paidWeeks, data.intendedWeeks, onNavigate]);

  const startTopUp = (weeks: number) => {
    if (!profile || !paymentBase || !data.canTopUp) return;
    setTopUpOpen(false);
    onNavigate("payment", {
      selectedPath: profile.path,
      userData: {
        ...paymentBase,
        weeksToCommit: Math.min(Math.max(1, weeks), data.remainingWeeks || 1),
        originalWeeks: data.paidWeeks,
        isTopUp: true,
        // Opens Paystack straight away; the page stays as the fallback.
        autoStart: `topup_${Date.now()}`,
      },
    });
  };

  const firstName = String(profile?.fullName || "").trim().split(/\s+/)[0] || "";

  const actions: StudentActions = {
    goTo,
    continuePayment,
    openTopUp: useCallback(() => setTopUpOpen(true), []),
    logout: onLogout,
    askAbout: useCallback(
      (context: MentorContext) => {
        setChatContext(context);
        navigate(studentSectionRoutes.chat);
      },
      [navigate],
    ),
    chatContext,
    setChatContext,
    firstName,
    isDark,
    onToggleTheme,
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16 dark:bg-paper-dark">
        <Card className="w-full max-w-md space-y-5 p-6 text-center sm:p-8">
          <div className="flex justify-center">
            <IconTile icon={UserRoundX} size="lg" tone="hire" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-blue-900 dark:text-white">Finish setting up</h1>
            <p className="mt-2 text-[15px] font-medium leading-6 text-slate-600 dark:text-slate-300">
              We couldn't find your student details. Add them to choose your course, or sign in with another account.
            </p>
          </div>
          <div className="grid gap-3">
            <button type="button" onClick={() => onNavigate("continue-registration")} className={mbtn({ kind: "learn", size: "lg", full: true })}>
              Add my details
            </button>
            <button type="button" onClick={onLogout} className={mbtn({ kind: "secondary", size: "lg", full: true })}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const shortCourse = (data.courseTitle || profile.path || "").split(/[\s&]+/)[0] || "Student";
  const status =
    data.paymentState === "active"
      ? `${shortCourse}${data.currentWeek ? ` · Week ${data.currentWeek}` : ""}`
      : data.paymentState === "checking"
        ? `${shortCourse} · Checking`
        : `${shortCourse} · Pending`;

  const updatesUnread = data.unreadNotificationCount;
  const mainNav: NavItem[] = [
    { key: "dashboard", label: "Home", icon: House },
    { key: "classes", label: "Classes", icon: PlayCircle },
    { key: "resources", label: "Resources", icon: BookOpen },
    { key: "community", label: "Community", icon: Users },
    { key: "chat", label: "Mentor chat", icon: MessageSquare, count: data.hasUnreadMentorReply ? 1 : undefined },
    { key: "notifications", label: "Updates", icon: Bell, count: updatesUnread || undefined },
    { key: "badges", label: "Badges", icon: Award },
  ];
  const accountNav: NavItem[] = [{ key: "account", label: "Payments & account", icon: CreditCard }];
  const tabs: NavItem[] = [
    { key: "dashboard", label: "Home", icon: House },
    { key: "classes", label: "Classes", icon: PlayCircle },
    { key: "chat", label: "Chat", icon: MessageSquare, dot: data.hasUnreadMentorReply },
    { key: "notifications", label: "Updates", icon: Bell, dot: updatesUnread > 0 },
    { key: "more", label: "More", icon: MoreHorizontal },
  ];

  const Section = sectionComponents[activeSection];
  const isChat = activeSection === "chat";

  return (
    <StudentDataProvider value={{ ...data, ...actions }}>
      <div className="min-h-screen bg-paper dark:bg-paper-dark">
        <Sidebar main={mainNav} account={accountNav} name={profile.fullName} status={status} apk={apk} onLogout={onLogout} />

        {/* Phone header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur dark:border-line-dark dark:bg-slate-950/95 lg:hidden">
          <Link to={studentSectionRoutes.dashboard} aria-label="Home">
            <BrandMark className="h-7 w-7" />
          </Link>
          <p className="min-w-0 flex-1 truncate font-display text-lg font-bold text-blue-900 dark:text-white">{sectionTitles[activeSection]}</p>
          <UpdatesBell unread={updatesUnread > 0} className="h-10 w-10" />
          <Link to={studentSectionRoutes.more} aria-label="Your account and more">
            <Avatar name={profile.fullName} size={36} />
          </Link>
        </header>

        <div className="lg:pl-[264px]">
          <div
            className={cn(
              "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-10",
              isChat ? "pb-16 pt-0 sm:pt-6 lg:pb-8 lg:pt-8" : "pb-28 pt-5 sm:pt-6 lg:pb-16 lg:pt-8",
            )}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center gap-3 py-24 text-sm font-semibold text-slate-500">
                  <Spinner className="text-teal-600" /> Loading…
                </div>
              }
            >
              <Section />
            </Suspense>
          </div>
        </div>

        <TabBar items={tabs} />

        <AddWeeksDialog
          open={topUpOpen && data.canTopUp}
          paidWeeks={data.paidWeeks}
          totalWeeks={data.totalProgramWeeks}
          weeklyRate={data.weeklyRate}
          onClose={() => setTopUpOpen(false)}
          onPay={startTopUp}
        />
      </div>
    </StudentDataProvider>
  );
};

export default StudentArea;
