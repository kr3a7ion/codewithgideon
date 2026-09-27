/* Payments: unfinished checkouts (checked with Paystack), review queue, history. */
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, CreditCard, Eraser, HandCoins, Zap } from "lucide-react";
import { Button, cn } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { useAdminInsights } from "../insights";
import { paymentRecordAmount, toDateMs } from "../lib";
import {
  AdminPage,
  CopyButton,
  EmptyHint,
  OverflowMenu,
  Panel,
  Pill,
  SearchInput,
  Spinner,
  StatTile,
  naira,
  relativeTime,
} from "../ui";

const reviewReasonText: Record<string, string> = {
  course_already_paid: "Student had already paid for the whole course",
  amount_below_one_week: "Amount was less than one week's fee",
  missing_course: "The student's course couldn't be found",
};

const PaymentsPage: React.FC = () => {
  const {
    paymentRecords,
    paymentRecordsLoading,
    paymentRecordsError,
    registrationsByUid,
    checkPaymentWithPaystack,
    checkAllPending,
    checkingRefs,
    paymentChecks,
    approvePending,
    clearPending,
    busy,
    automationStatus,
    markPaymentReviewed,
  } = useAdmin();
  const i = useAdminInsights();
  const [search, setSearch] = useState("");

  const history = useMemo(() => {
    const q = search.trim().toLowerCase();
    return paymentRecords
      .filter((p: any) => String(p.status || "success") !== "needs_review")
      .filter((p: any) => {
        if (!q) return true;
        const reg = registrationsByUid.get(p.userId);
        return [reg?.fullName, reg?.email, p.email, p.reference, p.path]
          .some((v) => String(v || "").toLowerCase().includes(q));
      });
  }, [paymentRecords, registrationsByUid, search]);

  const lastAuto = toDateMs(automationStatus.payments?.lastRunAt);

  return (
    <AdminPage
      title="Payments"
      description="Paystack confirms most payments on its own. This page is for the few that need a look."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="This month" value={naira(i.revenueThisMonth)} tone="teal" />
        <StatTile label="All time" value={naira(i.totalRevenue)} />
        <StatTile label="Unfinished checkouts" value={i.pendingCheckouts.length} tone={i.checkoutsToCheck.length ? "orange" : "default"} />
        <StatTile label="Need review" value={i.needsReview.length} tone={i.needsReview.length ? "danger" : "default"} />
      </div>

      <Panel
        title="Unfinished checkouts"
        description={
          lastAuto
            ? `Checked automatically every 30 minutes (last ${relativeTime(lastAuto)}). Paid ones are credited, abandoned ones clear after a day.`
            : "Students who opened Paystack but whose payment wasn't confirmed. Check them to credit the ones that were paid."
        }
        actions={
          i.pendingCheckouts.length ? (
            <Button size="sm" leftIcon={<Zap className="h-4 w-4" />} loading={!!busy.checkAllPending} onClick={checkAllPending}>
              Check all
            </Button>
          ) : null
        }
        padded={false}
      >
        {i.pendingCheckouts.length === 0 ? (
          <EmptyHint icon={<BadgeCheck className="h-5 w-5" />} title="No unfinished checkouts">
            Every checkout has been paid or cleared.
          </EmptyHint>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {i.pendingCheckouts.map((c) => {
              const check = paymentChecks[c.reference];
              const fresh = c.ageMs < 10 * 60_000;
              return (
                <li key={c.reg.uid} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/students?student=${encodeURIComponent(c.reg.uid)}`}
                        className="font-semibold text-slate-900 hover:underline dark:text-white"
                      >
                        {c.reg.fullName}
                      </Link>
                      <Pill tone={c.kind === "topup" ? "navy" : "slate"}>{c.kind === "topup" ? "Top-up" : "First payment"}</Pill>
                      {fresh ? <Pill tone="teal">In progress</Pill> : null}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {c.weeks} week{c.weeks === 1 ? "" : "s"} · {naira(c.amount)} · started {relativeTime(c.createdAt)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      Ref {c.reference} <CopyButton text={c.reference} label="" className="px-1" />
                    </p>
                    {check ? (
                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          check.outcome === "credited" || check.outcome === "already_credited"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : check.outcome === "error"
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-700 dark:text-slate-200",
                        )}
                      >
                        {check.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Zap className="h-4 w-4" />}
                      loading={!!checkingRefs[c.reference]}
                      onClick={() => checkPaymentWithPaystack(c.reg.uid, c.reference)}
                    >
                      Check with Paystack
                    </Button>
                    <OverflowMenu
                      items={[
                        {
                          label: "Credit manually",
                          icon: <HandCoins className="h-4 w-4" />,
                          onSelect: () => approvePending(c.reg),
                        },
                        {
                          label: "Clear checkout",
                          icon: <Eraser className="h-4 w-4" />,
                          danger: true,
                          onSelect: () => clearPending(c.reg.uid),
                        },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {i.needsReview.length ? (
        <Panel
          title="Needs review"
          description="Paystack took the money but it couldn't be matched to weeks automatically. Credit the student yourself (Students → Mark as paid) or refund in Paystack, then mark it as handled."
          padded={false}
        >
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {i.needsReview.map((p: any) => {
              const reg = registrationsByUid.get(p.userId);
              return (
                <li key={`${p.userId}-${p.id}`} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden />
                      {reg?.fullName || p.email || p.userId}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {naira(paymentRecordAmount(p))} · {reviewReasonText[p.reviewReason] || "Amount didn't match"} · {relativeTime(toDateMs(p.verifiedAt))}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">Ref {p.reference || p.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/admin/students?student=${encodeURIComponent(p.userId)}`}
                      className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                    >
                      Open student
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => markPaymentReviewed(p)}>
                      Mark as handled
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <Panel
        title="Recent payments"
        description="The latest confirmed payments."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Name, email or reference" className="w-full sm:w-64" />}
        padded={false}
      >
        {paymentRecordsLoading && paymentRecords.length === 0 ? (
          <Spinner label="Loading payments" />
        ) : paymentRecordsError ? (
          <p className="px-5 py-6 text-sm text-red-600">{paymentRecordsError}</p>
        ) : history.length === 0 ? (
          <EmptyHint icon={<CreditCard className="h-5 w-5" />} title="No payments yet" />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((p: any) => {
              const reg = registrationsByUid.get(p.userId);
              return (
                <li key={`${p.userId}-${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {reg?.fullName || p.email || "Unknown student"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {p.kind === "topup" ? "Top-up" : "First payment"} · {Number(p.weeks || 0)} wk{Number(p.weeks) === 1 ? "" : "s"}
                      {p.paystack?.channel ? ` · ${p.paystack.channel}` : ""} · {relativeTime(toDateMs(p.verifiedAt) || Number(p.timestamp || 0))}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{naira(paymentRecordAmount(p))}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </AdminPage>
  );
};

export default PaymentsPage;
