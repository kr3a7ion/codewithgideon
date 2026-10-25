/* One student: profile, course progress, classes watched, payments, chat and
   private notes, with every action an admin needs in one place. */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  PlayCircle,
  Trash2,
  UserCheck,
  UserX,
  Zap,
} from "lucide-react";
import { registrationStore, type RegistrationEntry, type SessionDoc } from "../../../../services/registrationStore";
import { adminStudents } from "../../../../services/adminStudents";
import { Button, Field, cn, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { paymentRecordAmount, toDateMs } from "../lib";
import { CreditWeeksDialog, type CreditPreset } from "../parts/CreditWeeksDialog";
import { MoveStudentDialog } from "../parts/MoveStudentDialog";
import { DeleteStudentDialog } from "../parts/DeleteStudentDialog";
import { AdminPage, EmptyHint, InfoRow, OverflowMenu, Panel, Pill, Spinner, naira, relativeTime } from "../ui";
import { StatusPill, whatsappLink } from "./StudentsPage";

type Progress = Record<string, { position: number; duration: number; completed: boolean }>;

const methodLabel: Record<string, string> = { transfer: "Bank transfer", cash: "Cash", free: "Free weeks", paystack: "Paystack" };

const dateShort = (ms: number) =>
  ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** Profile card with inline edit of name and phone. */
const ProfileCard: React.FC<{ reg: RegistrationEntry; onSaved: () => Promise<void> }> = ({ reg, onSaved }) => {
  const { notify } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(reg.fullName || "");
  const [phone, setPhone] = useState(reg.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const r: any = reg;
  const wa = whatsappLink(reg.phone);

  useEffect(() => {
    setName(reg.fullName || "");
    setPhone(reg.phone || "");
  }, [reg.fullName, reg.phone]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adminStudents.updateProfile(reg.uid, { fullName: name, phone });
      await onSaved();
      setEditing(false);
      notify("success", "Profile updated.");
    } catch (err: any) {
      setError(err?.message || "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Contact"
      actions={
        !editing ? (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
          </button>
        ) : null
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <Field label="Full name" htmlFor="sd-name">
            <input id="sd-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor="sd-phone">
            <input id="sd-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </Field>
          <p className="text-xs text-slate-500">The email is their sign-in, so it can't be changed here.</p>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <a href={`mailto:${reg.email}`} className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-900 dark:text-slate-200">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden /> <span className="truncate">{reg.email}</span>
            </a>
            {reg.phone ? (
              <a href={`tel:${reg.phone}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-900 dark:text-slate-200">
                <Phone className="h-4 w-4 text-slate-400" aria-hidden /> {reg.phone}
              </a>
            ) : (
              <p className="text-sm text-slate-500">No phone number</p>
            )}
          </div>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
              Message on WhatsApp
            </a>
          ) : null}
          {r.ageRange && r.ageRange !== "Not given" ? (
            <p className="text-xs text-slate-500">{[r.ageRange, r.gender].filter((v: string) => v && v !== "Not given").join(" · ")}</p>
          ) : null}
        </div>
      )}
    </Panel>
  );
};

/** Private notes, saved to adminNotes/{uid}. Students never see them. */
const NotesCard: React.FC<{ uid: string }> = ({ uid }) => {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [meta, setMeta] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    adminStudents
      .getNotes(uid)
      .then((n) => {
        if (!live) return;
        setText(n.text);
        setSaved(n.text);
        setMeta(n.updatedAt ? `Saved ${relativeTime(n.updatedAt)}` : "");
      })
      .catch(() => live && setError("Couldn't load notes."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [uid]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await adminStudents.saveNotes(uid, text);
      setSaved(text);
      setMeta("Saved just now");
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Private notes" description="Only admins see these.">
      {loading ? (
        <Spinner label="Loading notes" className="py-4" />
      ) : (
        <div className="space-y-2">
          <label htmlFor="sd-notes" className="sr-only">Private notes</label>
          <textarea
            id="sd-notes"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            placeholder="e.g. Paid week 1 in cash, prefers evening classes"
            className={inputClass}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">{error || meta}</span>
            <Button size="sm" variant="secondary" onClick={save} loading={saving} disabled={text === saved}>
              {text === saved && saved ? <><Check className="h-4 w-4" aria-hidden /> Saved</> : "Save notes"}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
};

const StudentDetailPage: React.FC = () => {
  const { uid = "" } = useParams();
  const navigate = useNavigate();
  const {
    registrations,
    loading,
    studentPayments,
    fetchStudentPayments,
    fetchRegistrations,
    checkPaymentWithPaystack,
    checkingRefs,
    paymentChecks,
    handleToggleStatus,
    confirmAction,
    inboxMessages,
    notify,
  } = useAdmin();
  const reg = registrations.find((r) => r.uid === uid) || null;
  const r: any = reg || {};
  const [credit, setCredit] = useState<CreditPreset | null>(null);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sessions, setSessions] = useState<SessionDoc[] | null>(null);
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    if (uid) fetchStudentPayments(uid);
    adminStudents.getProgress(uid).then(setProgress).catch(() => setProgress({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    let live = true;
    if (!r.cohortKey) {
      setSessions([]);
      return;
    }
    setSessions(null);
    registrationStore
      .getCohortSessions(r.cohortKey)
      .then((list: SessionDoc[]) => live && setSessions(list.filter((s) => s.isPublished !== false)))
      .catch(() => live && setSessions([]));
    return () => {
      live = false;
    };
  }, [r.cohortKey]);

  const paidWeeks = r.status === "Complete" ? Number(r.weeksToCommit || 0) : 0;
  const totalWeeks = Number(r.courseDurationWeeks || 0) || Math.max(paidWeeks, ...((sessions || []).map((s) => s.week)), 0);
  const now = Date.now();

  const classStats = useMemo(() => {
    const list = sessions || [];
    const held = list.filter((s) => toDateMs(s.startsAt) < now);
    const withRec = held.filter((s) => s.recordingUrl && s.week <= paidWeeks);
    const watched = withRec.filter((s) => progress[s.id]?.completed).length;
    const next = list.filter((s) => toDateMs(s.startsAt) >= now).sort((a, b) => toDateMs(a.startsAt) - toDateMs(b.startsAt))[0];
    return { held: held.length, recordings: withRec.length, watched, next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, progress, paidWeeks]);

  if (!reg) {
    return (
      <AdminPage title="Student">
        {loading ? (
          <Spinner label="Loading student" />
        ) : (
          <Panel>
            <EmptyHint title="Student not found" action={<Link to="/admin/students" className="font-semibold text-teal-700 hover:underline">Back to students</Link>}>
              They may have been deleted.
            </EmptyHint>
          </Panel>
        )}
      </AdminPage>
    );
  }

  const payments = studentPayments[uid];
  const pending = r.pendingPayment;
  const check = pending?.reference ? paymentChecks[pending.reference] : undefined;
  const chat: any = inboxMessages.find((m: any) => m.id === `mentor_${uid}` || m.studentUid === uid);
  const chatLink = chat ? `/admin/inbox?tab=students&thread=${encodeURIComponent(chat.id)}` : "/admin/inbox?tab=students";
  const enrolled = reg.status === "Complete";

  const removeAccess = async () => {
    const ok = await confirmAction({
      title: "Remove access?",
      message: `${reg.fullName} will lose access to classes and recordings until they pay again. Their payment history is kept.`,
      confirmLabel: "Remove access",
      tone: "warning",
    });
    if (!ok) return;
    await handleToggleStatus(reg.uid, reg.status as any);
    notify("success", `${reg.fullName} no longer has access.`);
  };

  return (
    <AdminPage
      title={reg.fullName || "Student"}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <StatusPill reg={reg} />
          <span>Joined {dateShort(Number(reg.timestamp || 0))}</span>
        </span>
      }
      actions={
        <>
          <Button size="sm" variant={enrolled ? "secondary" : "primary"} leftIcon={<UserCheck className="h-4 w-4" />} onClick={() => setCredit({})}>
            {enrolled ? "Add weeks" : "Confirm payment"}
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<MessageSquare className="h-4 w-4" />} onClick={() => navigate(chatLink)}>
            {chat ? "Open chat" : "Inbox"}
          </Button>
          <OverflowMenu
            label="More actions"
            items={[
              { label: "Move cohort or course", icon: <ArrowRightLeft className="h-4 w-4" />, onSelect: () => setMoving(true) },
              ...(enrolled ? [{ label: "Remove access", icon: <UserX className="h-4 w-4" />, onSelect: removeAccess }] : []),
              { label: "Delete student", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setDeleting(true) },
            ]}
          />
        </>
      }
    >
      <Link to="/admin/students" className="-mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-900 dark:text-slate-300">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All students
      </Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-5">
          {pending ? (
            <section className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-500/30 dark:bg-orange-500/10">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                {pending.kind === "topup" ? "Top-up" : "First payment"} started {relativeTime(toDateMs(pending.createdAt))}
              </p>
              <p className="mt-0.5 text-sm text-orange-800/80 dark:text-orange-200/80">
                {pending.weeks} week{Number(pending.weeks) === 1 ? "" : "s"} · {naira(Number(pending.amount || 0))} · ref {pending.reference}
              </p>
              {check ? <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{check.message}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" leftIcon={<Zap className="h-4 w-4" />} loading={!!checkingRefs[pending.reference]} onClick={() => checkPaymentWithPaystack(reg.uid, pending.reference)}>
                  Check with Paystack
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCredit({
                      weeks: Number(pending.weeks || 1),
                      amount: Number(pending.amount || 0),
                      method: "paystack",
                      reference: pending.reference,
                      context: "Only do this after you've seen the payment succeed in your Paystack dashboard.",
                    })
                  }
                >
                  Credit this checkout
                </Button>
              </div>
            </section>
          ) : null}

          <Panel title="Course" description={reg.path || "No course"}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Cohort", r.cohortLabel || "Not placed"],
                ["Weeks paid", totalWeeks ? `${paidWeeks} of ${totalWeeks}` : String(paidWeeks)],
                ["Paid so far", naira(enrolled ? Number(reg.totalPrice || 0) : 0)],
                ["Recordings watched", classStats.recordings ? `${classStats.watched} of ${classStats.recordings}` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold text-slate-500">{k}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-blue-900 dark:text-white">{v}</p>
                </div>
              ))}
            </div>
            {totalWeeks ? (
              <div className="mt-4">
                <div className="flex gap-1" aria-label={`${paidWeeks} of ${totalWeeks} weeks paid`}>
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <span
                      key={i}
                      title={`Week ${i + 1}${i < paidWeeks ? " · paid" : ""}`}
                      className={cn("h-2.5 flex-1 rounded-full", i < paidWeeks ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700")}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {paidWeeks >= totalWeeks
                    ? "Whole course paid."
                    : enrolled
                      ? `${totalWeeks - paidWeeks} week${totalWeeks - paidWeeks === 1 ? "" : "s"} left to pay.`
                      : "Hasn't paid yet."}
                  {classStats.next ? ` Next class: week ${classStats.next.week}, ${dateShort(toDateMs(classStats.next.startsAt))}.` : ""}
                </p>
              </div>
            ) : null}
            {enrolled && !r.cohortKey ? (
              <p className="mt-3 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:bg-orange-500/10 dark:text-orange-100">
                Paid but not in a cohort, so they can't see any classes.{" "}
                <button type="button" onClick={() => setMoving(true)} className="font-semibold underline">Place them in a cohort</button>
              </p>
            ) : null}
          </Panel>

          <Panel title="Classes and recordings" description={r.cohortLabel ? `From ${r.cohortLabel}` : undefined} padded={false}>
            {sessions === null ? (
              <Spinner label="Loading classes" />
            ) : sessions.length === 0 ? (
              <EmptyHint icon={<PlayCircle className="h-5 w-5" />} title={r.cohortKey ? "No classes in this cohort yet" : "Not in a cohort yet"} />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...sessions]
                  .sort((a, b) => a.week - b.week || toDateMs(a.startsAt) - toDateMs(b.startsAt))
                  .map((s) => {
                    const at = toDateMs(s.startsAt);
                    const locked = s.week > paidWeeks;
                    const p = progress[s.id];
                    const pct = p && p.duration ? Math.min(100, Math.round((p.position / p.duration) * 100)) : 0;
                    let state: React.ReactNode;
                    if (at >= now) state = <Pill tone="navy">Upcoming</Pill>;
                    else if (locked) state = <Pill>Not paid</Pill>;
                    else if (!s.recordingUrl) state = <Pill tone="orange">No recording</Pill>;
                    else if (p?.completed) state = <Pill tone="success"><Check className="h-3 w-3" aria-hidden /> Watched</Pill>;
                    else if (pct > 0) state = <Pill tone="teal">{pct}% watched</Pill>;
                    else state = <Pill>Not watched</Pill>;
                    return (
                      <li key={s.id} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", locked && at < now && "opacity-60")}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {s.week}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                          <p className="text-xs text-slate-500">{dateShort(at)}</p>
                        </div>
                        {state}
                      </li>
                    );
                  })}
              </ul>
            )}
          </Panel>

          <Panel title="Payments" padded={false}>
            {!payments ? (
              <Spinner label="Loading payments" />
            ) : payments.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {p.kind === "topup" ? "Top-up" : "First payment"} · {Number(p.weeks || 0)} wk{Number(p.weeks) === 1 ? "" : "s"}
                        {p.method ? ` · ${methodLabel[p.method] || p.method}` : p.paystack?.channel ? ` · ${String(p.paystack.channel).replace(/_/g, " ")}` : ""}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {dateShort(toDateMs(p.verifiedAt) || Number(p.timestamp || 0))} · {p.reference || p.id}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{naira(paymentRecordAmount(p))}</p>
                      {p.status === "needs_review" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCredit({
                              amount: paymentRecordAmount(p),
                              weeks: Math.max(1, Number(p.affordableWeeks || 0) || 1),
                              method: "paystack",
                              reference: p.id,
                              resolveExisting: true,
                            })
                          }
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Needs review · credit
                        </button>
                      ) : p.resolution === "refunded" ? (
                        <Pill>Refunded</Pill>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <ProfileCard reg={reg} onSaved={fetchRegistrations} />
          <Panel title="Chat">
            {chat ? (
              <div className="space-y-2">
                <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-200">“{chat.lastMessage || chat.message || "…"}”</p>
                <p className="text-xs text-slate-500">
                  {chat.lastMessageSenderType === "admin" ? "You replied" : "From the student"} {relativeTime(toDateMs(chat.lastMessageAt || chat.updatedAt))}
                </p>
                <Link to={chatLink} className="inline-block text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">Open chat</Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
            )}
          </Panel>
          <NotesCard uid={uid} />
          <Panel title="Account">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow label="Signed up">{dateShort(Number(reg.timestamp || 0))}</InfoRow>
              <InfoRow label="Last change">{r.updatedAt ? relativeTime(toDateMs(r.updatedAt)) : "—"}</InfoRow>
            </div>
          </Panel>
        </div>
      </div>

      <CreditWeeksDialog open={!!credit} onClose={() => setCredit(null)} reg={reg} preset={credit || undefined} />
      <MoveStudentDialog open={moving} onClose={() => setMoving(false)} reg={reg} />
      <DeleteStudentDialog open={deleting} onClose={() => setDeleting(false)} reg={reg} onDeleted={() => navigate("/admin/students", { replace: true })} />
    </AdminPage>
  );
};

export default StudentDetailPage;
