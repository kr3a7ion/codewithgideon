/* Students: search and filters; each student opens their own page. */
import React, { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Download, Sheet, UserPlus, Users } from "lucide-react";
import type { RegistrationEntry } from "../../../../services/registrationStore";
import { Button } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { AddStudentDialog } from "../parts/AddStudentDialog";
import { whatsappLink } from "../lib";
import { useAdminInsights } from "../insights";

export { whatsappLink };
import { AdminPage, EmptyHint, Panel, Pill, SearchInput, Segmented, Spinner, relativeTime } from "../ui";

type StatusFilter = "all" | "paid" | "pending" | "new" | "running-out";

const DAY = 86_400_000;


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
  const insights = useAdminInsights();
  const runningOut = useMemo(() => new Map(insights.weeksRunningOut.map((x) => [x.reg.uid, x])), [insights.weeksRunningOut]);
  const counts = useMemo(
    () => ({
      all: registrations.length,
      paid: registrations.filter((r) => r.status === "Complete").length,
      pending: registrations.filter((r) => r.status !== "Complete").length,
      new: registrations.filter((r) => now - Number(r.timestamp || 0) < 7 * DAY).length,
      runningOut: runningOut.size,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registrations, runningOut],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations
      .filter((r) => {
        if (status === "paid") return r.status === "Complete";
        if (status === "pending") return r.status !== "Complete";
        if (status === "new") return now - Number(r.timestamp || 0) < 7 * DAY;
        if (status === "running-out") return runningOut.has(r.uid);
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
  }, [registrations, status, pathFilter, search, runningOut]);

  /** WhatsApp nudge for a student whose paid weeks are about to run out. */
  const remindLink = (r: any) => {
    const x = runningOut.get(r.uid);
    const wa = whatsappLink(r.phone);
    if (!x || !wa) return "";
    const first = String(r.fullName || "").split(" ")[0];
    const text = `Hi ${first}, it's Gideon. Your next class (week ${x.nextWeek}) is coming up, and you've paid up to week ${x.paid}. Add weeks here so you don't miss it: https://codewithgideon.com/student/payment?mode=topup`;
    return `${wa}?text=${encodeURIComponent(text)}`;
  };

  const [adding, setAdding] = useState(false);
  const open = (uid: string) => navigate(`/admin/students/${encodeURIComponent(uid)}`);

  // Old links (?student=uid) open the student's page.
  if (selectedUid) return <Navigate to={`/admin/students/${encodeURIComponent(selectedUid)}`} replace />;

  return (
    <AdminPage
      title="Students"
      description="Everyone who has signed up. Tap a student to see their progress, payments and notes."
      actions={
        <>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAdding(true)}>
            Add student
          </Button>
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
            ...(counts.runningOut || status === "running-out" ? [{ value: "running-out" as StatusFilter, label: "Weeks running out", count: counts.runningOut }] : []),
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
                    onClick={() => open(r.uid)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          open(r.uid);
                        }}
                        className="text-left"
                      >
                        <span className="block font-semibold text-slate-900 dark:text-white">{r.fullName}</span>
                        <span className="block text-xs text-slate-500">{r.email}</span>
                        {status === "running-out" && remindLink(r) ? (
                          <a
                            href={remindLink(r)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                          >
                            Remind on WhatsApp
                          </a>
                        ) : null}
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
                    onClick={() => open(r.uid)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">{r.fullName}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {status === "running-out" && runningOut.get(r.uid)
                          ? `Paid to week ${runningOut.get(r.uid)!.paid} · next class is week ${runningOut.get(r.uid)!.nextWeek}`
                          : r.path}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusPill reg={r} />
                        <span className="text-xs text-slate-500">{weeksLabel(r)}</span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  </button>
                  {status === "running-out" && remindLink(r) ? (
                    <a
                      href={remindLink(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="-mt-1 mb-3 ml-4 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      Remind on WhatsApp
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <AddStudentDialog open={adding} onClose={() => setAdding(false)} />
    </AdminPage>
  );
};

export default StudentsPage;
