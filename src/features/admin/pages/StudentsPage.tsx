/* Students: search, filters and a detail panel with everything about one student. */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Sheet,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import type { RegistrationEntry } from "../../../../services/registrationStore";
import { Button, cn } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { toDateMs, paymentRecordAmount } from "../lib";
import {
  AdminPage,
  Drawer,
  EmptyHint,
  InfoRow,
  OverflowMenu,
  Panel,
  Pill,
  SearchInput,
  Segmented,
  Spinner,
  naira,
  relativeTime,
} from "../ui";

type StatusFilter = "all" | "paid" | "pending" | "new";

const DAY = 86_400_000;

const whatsappLink = (phone: string) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
};

export const StatusPill: React.FC<{ reg: RegistrationEntry }> = ({ reg }) => {
  const pending = (reg as any).pendingPayment;
  if (reg.status === "Complete") {
    return pending ? <Pill tone="orange">Paid · top-up started</Pill> : <Pill tone="success">Paid</Pill>;
  }
  return pending ? <Pill tone="orange">Checkout started</Pill> : <Pill>Waiting to pay</Pill>;
};

const weeksLabel = (reg: any) => {
  const total = Number(reg.courseDurationWeeks || 0);
  const paid = reg.status === "Complete" ? Number(reg.weeksToCommit || 0) : 0;
  return total ? `${paid} / ${total} wks` : `${paid} wks`;
};

const StudentPanel: React.FC<{ reg: RegistrationEntry | null; onClose: () => void }> = ({ reg, onClose }) => {
  const {
    studentPayments,
    fetchStudentPayments,
    checkPaymentWithPaystack,
    checkingRefs,
    paymentChecks,
    handleToggleStatus,
    handleDelete,
    confirmAction,
    inboxMessages,
    notify,
  } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (reg?.uid) fetchStudentPayments(reg.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg?.uid]);

  if (!reg) return <Drawer open={false} onClose={onClose} title="" />;

  const pending = (reg as any).pendingPayment;
  const payments = studentPayments[reg.uid];
  const chat = inboxMessages.find(
    (m: any) => m.id === `mentor_${reg.uid}` || m.studentUid === reg.uid,
  );
  const check = pending?.reference ? paymentChecks[pending.reference] : undefined;
  const wa = whatsappLink(reg.phone);

  const toggleStatus = async () => {
    const toPaid = reg.status !== "Complete";
    const ok = await confirmAction({
      title: toPaid ? "Mark as paid without a payment?" : "Mark as not paid?",
      message: toPaid
        ? "This gives the student access to their paid weeks without a Paystack payment. Use it for cash or bank transfers you've confirmed yourself."
        : "The student loses access to classes until they pay again.",
      confirmLabel: toPaid ? "Mark as paid" : "Mark as not paid",
      tone: "warning",
    });
    if (!ok) return;
    await handleToggleStatus(reg.uid, reg.status as any);
    notify("success", `${reg.fullName} updated.`);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={reg.fullName || "Student"}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <StatusPill reg={reg} />
          <span>Joined {relativeTime(Number(reg.timestamp || 0))}</span>
        </span>
      }
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<MessageSquare className="h-4 w-4" />}
            onClick={() => navigate(chat ? `/admin/inbox?tab=students&thread=${encodeURIComponent(chat.id)}` : "/admin/inbox?tab=students")}
          >
            {chat ? "Open chat" : "Inbox"}
          </Button>
          <div className="ml-auto">
            <OverflowMenu
              items={[
                reg.status === "Complete"
                  ? { label: "Mark as not paid", icon: <UserX className="h-4 w-4" />, onSelect: toggleStatus }
                  : { label: "Mark as paid manually", icon: <UserCheck className="h-4 w-4" />, onSelect: toggleStatus },
                {
                  label: "Delete student",
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onSelect: async () => {
                    await handleDelete(reg.uid);
                    onClose();
                  },
                },
              ]}
            />
          </div>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Contact</h3>
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${reg.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Mail className="h-4 w-4" aria-hidden /> {reg.email}
            </a>
            {reg.phone ? (
              <a href={`tel:${reg.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <Phone className="h-4 w-4" aria-hidden /> {reg.phone}
              </a>
            ) : null}
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
                WhatsApp
              </a>
            ) : null}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Enrolment</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <InfoRow label="Course">{reg.path || "—"}</InfoRow>
            <InfoRow label="Cohort">{(reg as any).cohortLabel || "Not placed yet"}</InfoRow>
            <InfoRow label="Weeks paid">{weeksLabel(reg)}</InfoRow>
            <InfoRow label="Paid so far">{reg.status === "Complete" ? naira(Number(reg.totalPrice || 0)) : naira(0)}</InfoRow>
            {(reg as any).ageRange || (reg as any).gender ? (
              <InfoRow label="About">{[(reg as any).ageRange, (reg as any).gender].filter(Boolean).join(" · ")}</InfoRow>
            ) : null}
          </div>
        </section>

        {pending ? (
          <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/30 dark:bg-orange-500/10">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              {pending.kind === "topup" ? "Top-up" : "First payment"} started {relativeTime(toDateMs(pending.createdAt))}
            </p>
            <p className="mt-0.5 text-sm text-orange-800/80 dark:text-orange-200/80">
              {pending.weeks} week{Number(pending.weeks) === 1 ? "" : "s"} · {naira(Number(pending.amount || 0))} · ref {pending.reference}
            </p>
            {check ? (
              <p className={cn("mt-2 text-sm font-semibold", check.outcome === "credited" || check.outcome === "already_credited" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200")}>
                {check.message}
              </p>
            ) : null}
            <Button
              size="sm"
              className="mt-3"
              leftIcon={<Zap className="h-4 w-4" />}
              loading={!!checkingRefs[pending.reference]}
              onClick={() => checkPaymentWithPaystack(reg.uid, pending.reference)}
            >
              Check with Paystack
            </Button>
          </section>
        ) : null}

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Payments</h3>
          {!payments ? (
            <Spinner label="Loading payments" className="py-4" />
          ) : payments.length === 0 ? (
            <p className="py-2 text-sm text-slate-500 dark:text-slate-400">No confirmed payments yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {p.kind === "topup" ? "Top-up" : "First payment"} · {Number(p.weeks || 0)} wk{Number(p.weeks) === 1 ? "" : "s"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{new Date(toDateMs(p.verifiedAt) || Number(p.timestamp || 0)).toLocaleString()} · {p.reference || p.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{naira(paymentRecordAmount(p))}</p>
                    {p.status === "needs_review" ? <Pill tone="danger">Needs review</Pill> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
};

const StudentsPage: React.FC = () => {
  const {
    registrations,
    loading,
    paths,
    handleExportCSV,
    handleSyncToSheets,
    isSyncing,
    webhookUrl,
  } = useAdmin();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const status = (params.get("status") as StatusFilter) || "all";
  const selectedUid = params.get("student") || "";
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState("all");

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key !== "student" });
  };

  const now = Date.now();
  const counts = useMemo(
    () => ({
      all: registrations.length,
      paid: registrations.filter((r) => r.status === "Complete").length,
      pending: registrations.filter((r) => r.status !== "Complete").length,
      new: registrations.filter((r) => now - Number(r.timestamp || 0) < 7 * DAY).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registrations],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations
      .filter((r) => {
        if (status === "paid") return r.status === "Complete";
        if (status === "pending") return r.status !== "Complete";
        if (status === "new") return now - Number(r.timestamp || 0) < 7 * DAY;
        return true;
      })
      .filter((r) => pathFilter === "all" || String((r as any).pathId || "") === pathFilter || r.path === pathFilter)
      .filter((r) =>
        !q ||
        [r.fullName, r.email, r.phone, r.path, (r as any).cohortLabel]
          .some((v) => String(v || "").toLowerCase().includes(q)),
      )
      .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrations, status, pathFilter, search]);

  const selected = registrations.find((r) => r.uid === selectedUid) || null;

  return (
    <AdminPage
      title="Students"
      description="Everyone who has signed up. Tap a student to see their payments, cohort and contact details."
      actions={
        <>
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sheet className="h-4 w-4" />}
            loading={isSyncing}
            onClick={() => (webhookUrl ? handleSyncToSheets() : navigate("/admin/settings#integrations"))}
          >
            {webhookUrl ? "Sync to Sheets" : "Set up Sheets"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<StatusFilter>
          label="Filter students"
          value={status}
          onChange={(v) => setParam("status", v === "all" ? "" : v)}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "paid", label: "Paid", count: counts.paid },
            { value: "pending", label: "Waiting to pay", count: counts.pending },
            { value: "new", label: "New this week", count: counts.new },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="students-path">Course</label>
          <select
            id="students-path"
            value={pathFilter}
            onChange={(e) => setPathFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">All courses</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Name, email or phone" className="sm:w-64" />
        </div>
      </div>

      <Panel padded={false}>
        {loading && registrations.length === 0 ? (
          <Spinner label="Loading students" />
        ) : rows.length === 0 ? (
          <EmptyHint icon={<Users className="h-5 w-5" />} title="No students match">
            Try another filter or search.
          </EmptyHint>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-3 py-3">Course & cohort</th>
                  <th className="px-3 py-3">Weeks</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr
                    key={r.uid}
                    onClick={() => setParam("student", r.uid)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setParam("student", r.uid);
                        }}
                        className="text-left"
                      >
                        <span className="block font-semibold text-slate-900 dark:text-white">{r.fullName}</span>
                        <span className="block text-xs text-slate-500">{r.email}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block text-slate-700 dark:text-slate-200">{r.path}</span>
                      <span className="block text-xs text-slate-500">{(r as any).cohortLabel || "No cohort yet"}</span>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-700 dark:text-slate-200">{weeksLabel(r)}</td>
                    <td className="px-3 py-3"><StatusPill reg={r} /></td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">{relativeTime(Number(r.timestamp || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phone list */}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {rows.map((r) => (
                <li key={r.uid}>
                  <button
                    type="button"
                    onClick={() => setParam("student", r.uid)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">{r.fullName}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{r.path}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusPill reg={r} />
                        <span className="text-xs text-slate-500">{weeksLabel(r)}</span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <StudentPanel reg={selected} onClose={() => setParam("student", "")} />
    </AdminPage>
  );
};

export default StudentsPage;
