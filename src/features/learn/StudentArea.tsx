import React, { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  BellRing,
  BookOpen,
  Layers3,
  LogOut,
  MessageSquare,
  Users,
  Video,
} from "lucide-react";
import type { View } from "../../app/views";
import type { RegistrationEntry } from "../../../services/registrationStore";
import { Badge, Button, LoadingPanel, cn } from "../../ui";
import { useStudentData } from "./useStudentData";
import { StudentDataProvider, type StudentActions } from "./StudentDataContext";
import { TopUpDialog } from "./components/TopUpDialog";
import {
  formatNaira,
  sectionFromPathname,
  studentSectionRoutes,
  type StudentSection,
} from "./lib";

const Overview = lazy(() => import("./sections/Overview"));
const Classes = lazy(() => import("./sections/Classes"));
const Resources = lazy(() => import("./sections/Resources"));
const Community = lazy(() => import("./sections/Community"));
const MentorChat = lazy(() => import("./sections/MentorChat"));
const Notifications = lazy(() => import("./sections/Notifications"));
const Badges = lazy(() => import("./sections/Badges"));

const sectionComponents: Record<StudentSection, React.ComponentType> = {
  dashboard: Overview,
  classes: Classes,
  resources: Resources,
  community: Community,
  chat: MentorChat,
  notifications: Notifications,
  badges: Badges,
};

type Props = {
  profile: RegistrationEntry | null;
  onNavigate: (view: View, extraData?: unknown) => void;
  onLogout: () => void;
};

/**
 * The student area: header, section navigation (sidebar on desktop, tabs on
 * phones) and one route per section. Sections share data through
 * StudentDataProvider, so switching sections doesn't reload anything.
 */
const StudentArea: React.FC<Props> = ({ profile, onNavigate, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = sectionFromPathname(location.pathname);
  const data = useStudentData(profile, activeSection);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const paymentBase = useMemo(
    () =>
      profile
        ? {
            uid: profile.uid,
            email: profile.email,
            path: profile.path,
            pathId: profile.pathId,
            courseId: profile.courseId,
            cohortId: data.cohortId,
            cohortLabel: data.cohortLabel,
            cohortKey: data.cohortKey,
            courseDurationWeeks: data.totalProgramWeeks,
            weeklyRate: data.weeklyRate,
          }
        : null,
    [profile, data.cohortId, data.cohortLabel, data.cohortKey, data.totalProgramWeeks, data.weeklyRate],
  );

  const actions: StudentActions = {
    goTo: useCallback(
      (section: StudentSection) => {
        navigate(studentSectionRoutes[section]);
      },
      [navigate],
    ),
    continuePayment: useCallback(() => {
      if (!profile || !paymentBase) return;
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
          : {
              ...paymentBase,
              weeksToCommit: data.intendedWeeks,
              isTopUp: false,
            },
      });
    }, [profile, paymentBase, data.pendingPayment, data.paidWeeks, data.intendedWeeks, onNavigate]),
    openTopUp: useCallback(() => setTopUpOpen(true), []),
  };

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
      },
    });
  };

  if (!profile) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
            <AlertCircle className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 dark:text-white">Finish your registration</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            We couldn't find your student profile. Complete registration to continue, or sign in with
            another account.
          </p>
          <div className="mt-6 grid gap-3">
            <Button onClick={() => onNavigate("continue-registration")}>Complete registration</Button>
            <Button variant="secondary" onClick={onLogout} leftIcon={<LogOut className="h-4 w-4" />}>
              Sign out
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const nav: Array<{ key: StudentSection; label: string; icon: React.ReactNode; count?: number; dot?: boolean }> = [
    { key: "dashboard", label: "Overview", icon: <Layers3 className="h-4 w-4" /> },
    { key: "classes", label: "Classes", icon: <Video className="h-4 w-4" />, count: data.isLocked ? undefined : data.sessions.length },
    { key: "resources", label: "Resources", icon: <BookOpen className="h-4 w-4" /> },
    { key: "community", label: "Community", icon: <Users className="h-4 w-4" /> },
    { key: "chat", label: "Mentor chat", icon: <MessageSquare className="h-4 w-4" />, dot: data.hasUnreadMentorReply },
    { key: "notifications", label: "Notifications", icon: <BellRing className="h-4 w-4" />, count: data.unreadNotificationCount || undefined },
    { key: "badges", label: "Badges", icon: <BadgeCheck className="h-4 w-4" /> },
  ];

  const Section = sectionComponents[activeSection];
  const firstName = String(profile.fullName || "").split(" ")[0] || "there";

  return (
    <StudentDataProvider value={{ ...data, ...actions }}>
      <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:pt-10">
          {/* Header */}
          <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <div
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-900 font-display text-xl font-bold text-white"
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-blue-900 dark:text-white sm:text-2xl">
                  Welcome back, {firstName}
                </h1>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="teal" icon={<Users className="h-3 w-3" aria-hidden />}>
                    {data.cohortLoading ? "Loading cohort…" : data.cohortLabel}
                  </Badge>
                  {data.hasCoursePricing ? (
                    <Badge tone="slate">
                      {data.totalProgramWeeks} weeks · {formatNaira(data.weeklyRate)}/wk
                    </Badge>
                  ) : null}
                  {data.isLocked ? <Badge tone="orange">Payment pending</Badge> : null}
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={onLogout} leftIcon={<LogOut className="h-4 w-4" />} className="self-start sm:self-auto">
              Sign out
            </Button>
          </header>

          <div className="mt-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
            {/* Navigation */}
            <nav aria-label="Student area" className="lg:sticky lg:top-28 lg:self-start">
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
                {nav.map((item) => (
                  <li key={item.key} className="shrink-0">
                    <NavLink
                      to={studentSectionRoutes[item.key]}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                          isActive
                            ? "bg-blue-900 text-white shadow-sm dark:bg-teal-500 dark:text-slate-950"
                            : "bg-white text-slate-600 hover:bg-slate-100 hover:text-blue-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:bg-transparent lg:dark:bg-transparent lg:dark:hover:bg-slate-800",
                        )
                      }
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.count ? (
                        <span
                          className={cn(
                            "min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold",
                            item.key === "notifications"
                              ? "bg-orange-500 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
                          )}
                        >
                          {item.count > 9 ? "9+" : item.count}
                        </span>
                      ) : item.dot ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" aria-label="New" />
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-4 min-w-0 lg:mt-0">
              <Suspense fallback={<LoadingPanel label="Loading" />}>
                <Section />
              </Suspense>
            </div>
          </div>
        </div>

        <TopUpDialog
          open={topUpOpen && data.canTopUp}
          remainingWeeks={data.remainingWeeks}
          weeklyRate={data.weeklyRate}
          onClose={() => setTopUpOpen(false)}
          onContinue={startTopUp}
        />
      </div>
    </StudentDataProvider>
  );
};

export default StudentArea;
