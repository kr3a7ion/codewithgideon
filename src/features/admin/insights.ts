/**
 * Derived admin data: what needs attention, today's classes and key numbers.
 * Shared by the Today page and the navigation badges so they always agree.
 */
import { useMemo } from "react";
import type { RegistrationEntry } from "../../../services/registrationStore";
import { useAdmin } from "./AdminWorkspaceContext";
import { paymentRecordAmount, sessionTimeToMs, toDateMs, type PaymentRecordDoc } from "./lib";
import type { OverviewSession } from "./useAdminWorkspace";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type PendingCheckout = {
  reg: RegistrationEntry;
  reference: string;
  weeks: number;
  amount: number;
  kind: "initial" | "topup";
  createdAt: number;
  ageMs: number;
};

export const sessionStart = (o: OverviewSession) => sessionTimeToMs((o.session as any).startsAt);
export const sessionEnd = (o: OverviewSession) =>
  sessionStart(o) + Number((o.session as any).durationMins || 60) * 60_000;

export const useAdminInsights = () => {
  const {
    registrations,
    pendingPayments,
    paymentRecords,
    overviewSessions,
    activeByPath,
    paths,
    unreadInboxCount,
    unreadSupportCount,
    stats,
  } = useAdmin();

  return useMemo(() => {
    const now = Date.now();

    const pendingCheckouts: PendingCheckout[] = pendingPayments.map((reg: any) => {
      const p = reg.pendingPayment || {};
      const createdAt = toDateMs(p.createdAt);
      return {
        reg,
        reference: String(p.reference || ""),
        weeks: Number(p.weeks || 0),
        amount: Number(p.amount || 0),
        kind: p.kind === "topup" ? "topup" : "initial",
        createdAt,
        ageMs: createdAt ? now - createdAt : 0,
      };
    });
    // Checkouts younger than 10 minutes are probably still being paid.
    const checkoutsToCheck = pendingCheckouts.filter((c) => c.ageMs >= 10 * 60_000);

    const needsReview: PaymentRecordDoc[] = paymentRecords.filter(
      (p: any) => String(p.status || "").toLowerCase() === "needs_review",
    );

    const newSignups = registrations.filter(
      (r) => r.status === "Pending" && now - Number(r.timestamp || 0) < 7 * DAY,
    );

    const published = overviewSessions.filter((o) => (o.session as any).isPublished !== false);

    const missingRecordings = published
      .filter((o) => {
        const end = sessionEnd(o);
        return (
          end < now - HOUR &&
          end > now - 45 * DAY &&
          !String((o.session as any).recordingUrl || "").trim()
        );
      })
      .sort((a, b) => sessionStart(b) - sessionStart(a));

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = startOfToday.getTime() + DAY;

    const todaysClasses = published
      .filter((o) => sessionStart(o) >= startOfToday.getTime() && sessionStart(o) < endOfToday)
      .sort((a, b) => sessionStart(a) - sessionStart(b));

    const upcoming = published
      .filter((o) => sessionEnd(o) > now)
      .sort((a, b) => sessionStart(a) - sessionStart(b));
    const nextClass = upcoming[0] || null;

    const liveNow = published.filter((o) => sessionStart(o) <= now && sessionEnd(o) > now);

    // Current intake per path, and whether it has classes coming up.
    const intakes = paths
      .filter((p) => p.isActive !== false)
      .map((p) => {
        const active = activeByPath[p.id];
        const cohortKey = String(active?.cohortKey || "");
        const upcomingCount = cohortKey
          ? upcoming.filter((o) => o.cohortId === cohortKey).length
          : 0;
        const totalCount = cohortKey
          ? overviewSessions.filter((o) => o.cohortId === cohortKey).length
          : 0;
        return { path: p, active: active || null, cohortKey, upcomingCount, totalCount };
      });
    const intakesWithoutClasses = intakes.filter((i) => i.cohortKey && i.upcomingCount === 0);
    const pathsWithoutIntake = intakes.filter((i) => !i.cohortKey);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const revenueThisMonth = paymentRecords
      .filter((p: any) => String(p.status || "success") === "success")
      .filter((p) => toDateMs(p.verifiedAt) >= startOfMonth.getTime())
      .reduce((sum, p) => sum + paymentRecordAmount(p), 0);

    const paidStudents = registrations.filter((r) => r.status === "Complete").length;

    const paymentsAttention = checkoutsToCheck.length + needsReview.length;
    const inboxAttention = unreadInboxCount + unreadSupportCount;
    // One per row on the Today list, so the badge matches what you see.
    const todayAttention =
      (checkoutsToCheck.length ? 1 : 0) +
      (needsReview.length ? 1 : 0) +
      (unreadInboxCount ? 1 : 0) +
      (unreadSupportCount ? 1 : 0) +
      (missingRecordings.length ? 1 : 0) +
      intakesWithoutClasses.length +
      pathsWithoutIntake.length;

    // A class that's on now or starts within two hours.
    const soon =
      liveNow[0] ||
      upcoming.find((o) => sessionStart(o) - now <= 2 * HOUR && sessionStart(o) > now) ||
      null;

    return {
      now,
      pendingCheckouts,
      checkoutsToCheck,
      needsReview,
      newSignups,
      missingRecordings,
      todaysClasses,
      nextClass,
      liveNow,
      soon,
      upcoming,
      intakes,
      intakesWithoutClasses,
      pathsWithoutIntake,
      revenueThisMonth,
      totalRevenue: stats.revenue,
      paidStudents,
      pendingStudents: stats.pending,
      paymentsAttention,
      inboxAttention,
      todayAttention,
    };
  }, [
    registrations,
    pendingPayments,
    paymentRecords,
    overviewSessions,
    activeByPath,
    paths,
    unreadInboxCount,
    unreadSupportCount,
    stats,
  ]);
};

export type AdminInsights = ReturnType<typeof useAdminInsights>;
