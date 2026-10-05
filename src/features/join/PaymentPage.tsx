import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import { ArrowRight, Check, ChevronLeft, Clock3, Copy, Download, Lock, MessageSquare, RefreshCw, Smartphone } from "lucide-react";
import type { View } from "../../app/views";
import { useApp } from "../../app/AppContext";
import { auth } from "../../../services/firebase";
import { registrationStore, type CourseDoc, type SessionDoc } from "../../../services/registrationStore";
import { mbtn, WhatsAppIcon } from "../../marketing/ui";
import { upcomingCohortLabel, useContactLinks } from "../../marketing/useContactLinks";
import { cn } from "../../ui";
import { Card, IconTile, Notice, naira, plural, Spinner } from "../shared/ui";
import { ClassHero } from "../learn/ui";
import { sessionInfo } from "../learn/time";
import { usePayments } from "../learn/usePayments";
import { BottomBar, JoinLayout } from "./JoinLayout";
import { FormCard, JoinTitle, OrderSummary, WeeksPicker } from "./ui";

/**
 * What the details page (or the dashboard, for a top-up) hands to checkout.
 * After a refresh the route rebuilds it from the student's profile.
 */
export type PaymentHandoff = {
  uid: string;
  email: string;
  /** Path title (legacy label, still used by the payment function). */
  path: string;
  pathId?: string;
  courseId?: string;
  courseTitle?: string;
  fullName?: string;
  phone?: string;
  weeksToCommit: number | string;
  /** A checkout that may have finished while the page was closed. */
  reference?: string;
  /** Weeks already paid for (top-ups). */
  originalWeeks?: number;
  isTopUp?: boolean;
  cohortId?: string;
  cohortLabel?: string;
  cohortKey?: string;
  courseDurationWeeks?: number;
  weeklyRate?: number;
  /** Set by the Add weeks dialog: open Paystack as soon as the page is ready. */
  autoStart?: string;
};

// Auto-start tokens already used, so going back to this page doesn't open
// Paystack a second time.
const autoStarted = new Set<string>();

type Incoming = PaymentHandoff | { selectedPath?: string; userData?: PaymentHandoff } | null | undefined;

type Phase = "idle" | "processing" | "verifying" | "success" | "failed" | "review";

const FUNCTION_URL = import.meta.env.VITE_VERIFY_PAYSTACK_URL as string;
const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const parsePricePerWeek = (label: string, fallback = 0) => {
  const s = String(label || "").toLowerCase();
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return s.includes("k") ? num * 1000 : num;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Every checkout attempt gets a fresh Paystack reference. Re-using one after
// the pop-up was closed makes Paystack reject it as a duplicate.
const newReference = () =>
  `CWG_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .toUpperCase()}`;

/** "08030000000" -> "0803 000 0000"; anything else is shown as typed. */
const formatPhone = (raw: string) => {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return String(raw || "");
};

const weekRange = (from: number, to: number) => (from >= to ? `Week ${to}` : `Weeks ${from} to ${to}`);

const startErrorMessage = (err: any) => {
  const raw = String(err?.message || err || "").trim();
  const lower = raw.toLowerCase();
  if (lower.includes("vite_") || lower.includes("public_key") || lower.includes("verify_paystack") || lower.includes("missing"))
    return "Checkout isn't available right now. Please try again shortly or message us on WhatsApp.";
  if (lower.includes("signed-in user") || lower.includes("login session") || lower.includes("session is not ready"))
    return "Your sign-in needs a quick refresh. Log in again, then pay.";
  if (lower.includes("student profile")) return "Please finish your details before paying.";
  if (lower.includes("network") || lower.includes("offline")) return "We couldn't reach the server. Check your connection and try again.";
  return raw || "Checkout didn't open. Please try again.";
};

/** The next live or upcoming class, for the "You're in" screen. */
const nextClass = (sessions: SessionDoc[]) => {
  const now = Date.now();
  return (
    sessions
      .map((s) => ({ s, i: sessionInfo(s, now) }))
      .filter((x) => x.i.hasTime && x.i.phase !== "ended")
      .sort((a, b) => a.i.startMs - b.i.startMs)[0]?.s || null
  );
};

const CopyReference: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked: the reference is still visible to copy by hand.
        }
      }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white px-2 py-1 font-mono text-[13px] font-semibold text-blue-900 ring-1 ring-line hover:ring-blue-900 dark:bg-slate-900 dark:text-white dark:ring-line-dark"
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden /> : <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      <span className="sr-only">{copied ? "Copied" : "Copy reference"}</span>
    </button>
  );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={cn("flex items-center justify-between gap-4 border-t border-line py-3 dark:border-line-dark sm:grid sm:grid-cols-[108px_minmax(0,1fr)] sm:justify-start", className)}>
    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
    <dd className="min-w-0 break-words text-right text-[15px] font-semibold text-blue-900 dark:text-white sm:text-left">{children}</dd>
  </div>
);

/** Centred status screen (confirming, checking, success). */
const StatusFrame: React.FC<{
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  focusRef: React.RefObject<HTMLDivElement>;
  body?: React.ReactNode;
}> = ({ icon, title, children, focusRef, body }) => (
  <JoinLayout width="medium">
    <div ref={focusRef} tabIndex={-1} className="space-y-6 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:space-y-8">
      <div className="space-y-4 text-center sm:space-y-5">
        <div className="flex justify-center">{icon}</div>
        <JoinTitle title={title} center>
          {children}
        </JoinTitle>
      </div>
      {body}
    </div>
  </JoinLayout>
);

const SuccessIcon = () => (
  <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-white sm:h-[72px] sm:w-[72px]">
    <Check className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2.5} />
  </span>
);

/**
 * Join step 3 (/student/payment): review the order and pay with Paystack.
 * Also used for adding weeks later. Paying never grants access by itself:
 * the payment function verifies with Paystack and credits the weeks, and
 * this page shows the result.
 */
const PaymentPage: React.FC<{
  onNavigate: (view: View, data?: unknown) => void;
  selectedPath: string;
  userData: Incoming;
  onPaymentSuccess?: (newTotalWeeks: number) => void;
  /** UI preview only (npm run preview:ui): start on a given screen. */
  preview?: { phase: Phase; failedStage?: "start" | "verify"; reference?: string };
}> = ({ onNavigate, selectedPath, userData, onPaymentSuccess, preview }) => {
  const navigate = useNavigate();
  const { studentProfile } = useApp();
  const { whatsapp, apk, nextCohortDate } = useContactLinks();
  const nextCohort = upcomingCohortLabel(nextCohortDate);

  const normalized = useMemo(() => {
    const any = userData as any;
    if (any?.userData?.uid) return { selectedPath: any.selectedPath || selectedPath, data: any.userData as PaymentHandoff };
    if (any?.uid) return { selectedPath, data: any as PaymentHandoff };
    return { selectedPath, data: null };
  }, [userData, selectedPath]);

  const safePath = normalized.selectedPath || selectedPath;
  // Never null: an empty object renders the "missing" state instead of crashing.
  const u = (normalized.data || {}) as PaymentHandoff;
  const authUid = auth.currentUser?.uid || "";
  const isTopUp = !!u.isTopUp;

  const [phase, setPhase] = useState<Phase>(preview?.phase || "idle");
  // "start": checkout never opened, safe to try again.
  // "verify": the student may already have paid, so we re-check instead of
  // letting them pay twice.
  const [failedStage, setFailedStage] = useState<"start" | "verify">(preview?.failedStage || "start");
  const [lastReference, setLastReference] = useState(preview?.reference || "");
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState<{ kind: "initial" | "topup"; fromWeek: number; toWeek: number; courseTitle: string } | null>(null);
  const [firstClass, setFirstClass] = useState<{ loading: boolean; session: SessionDoc | null }>({ loading: true, session: null });
  const inFlightRef = useRef(false);
  const focusRef = useRef<HTMLDivElement>(null);

  // A payment Paystack received that the admin is still checking. While
  // there is one, we never show a way to pay again.
  const payments = usePayments(u.uid && authUid === u.uid ? u.uid : null);

  // ---- cohort (per path) ----
  const [fallbackCohort, setFallbackCohort] = useState<{ cohortId: string; cohortLabel: string; cohortKey: string } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!u?.uid) return;
      if (u.cohortId && u.cohortLabel && u.cohortKey) return;
      try {
        const pathId = u.pathId || (await registrationStore.resolvePathId(safePath));
        const active = pathId ? await registrationStore.getActiveCohortForPathId(pathId) : await registrationStore.getActiveCohortForPath(safePath);
        if (alive) setFallbackCohort({ cohortId: active.cohortId, cohortLabel: active.label, cohortKey: active.cohortKey });
      } catch (err) {
        console.warn("loadCohortForPath failed:", err);
        if (alive) setFallbackCohort({ cohortId: "CWG-DEFAULT", cohortLabel: "Current cohort", cohortKey: "CWG-DEFAULT" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [u?.uid, u.cohortId, u.cohortLabel, u.cohortKey, u.pathId, safePath]);

  const cohortLabel = u.cohortLabel || fallbackCohort?.cohortLabel || "Current cohort";
  const cohortId = u.cohortId || fallbackCohort?.cohortId || "CWG-DEFAULT";
  const cohortKey = u.cohortKey || fallbackCohort?.cohortKey || "CWG-DEFAULT";

  // ---- course price and length (truth: weeks + pricePerWeek) ----
  const [courseMaxWeeks, setCourseMaxWeeks] = useState<number>(Number(u?.courseDurationWeeks) || 0);
  const [weeklyRate, setWeeklyRate] = useState<number>(Number(u?.weeklyRate) || 0);
  const [courseTitle, setCourseTitle] = useState<string>(u?.courseTitle || "");
  const [configLoading, setConfigLoading] = useState(!(u?.courseDurationWeeks && u?.weeklyRate));
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setConfigError("");
      if (!u?.uid) return setConfigLoading(false);
      const haveConfig = !!(u.courseDurationWeeks && u.weeklyRate);
      if (haveConfig) {
        setCourseMaxWeeks(Number(u.courseDurationWeeks));
        setWeeklyRate(Number(u.weeklyRate));
        if (u.courseTitle) {
          setCourseTitle(u.courseTitle);
          setConfigLoading(false);
          return;
        }
      }
      if (!haveConfig) setConfigLoading(true);
      try {
        const list: CourseDoc[] = await registrationStore.getCourses();
        const active = (list || []).filter((c) => (c as any).isActive !== false);
        const found: any = active.find((c: any) => {
          if (u.courseId) return String(c.id) === String(u.courseId);
          if (u.pathId && c.pathId) return String(c.pathId) === String(u.pathId);
          return String(c.title || "").trim().toLowerCase() === String(safePath).trim().toLowerCase();
        });
        if (!alive) return;
        if (found?.title) setCourseTitle(String(found.title));
        if (haveConfig) return;
        if (found) {
          const w = Number(found.weeks);
          const p = Number(found.pricePerWeek);
          const weeks = Number.isFinite(w) && w > 0 ? Math.floor(w) : parseWeeksFromDuration(found.duration, 4);
          const rate = Number.isFinite(p) && p > 0 ? Math.floor(p) : parsePricePerWeek(found.priceLabel || "", 0);
          if (rate > 0 && weeks > 0) {
            setCourseMaxWeeks(weeks);
            setWeeklyRate(rate);
          } else {
            setConfigError("The course price isn't available right now. Please message us on WhatsApp before paying.");
          }
        } else {
          setConfigError("We couldn't match this order to an open course. Please message us on WhatsApp before paying.");
        }
      } catch (e) {
        console.error("Failed to load course config:", e);
        if (alive && !haveConfig) setConfigError("We couldn't load the current price. Refresh the page or message us on WhatsApp.");
      } finally {
        if (alive) setConfigLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [safePath, u?.uid, u.courseDurationWeeks, u.weeklyRate, u.courseId, u.pathId, u.courseTitle]);

  const displayCourse = courseTitle || u.path || safePath;

  // ---- weeks and price ----
  const requestedWeeks = useMemo(() => {
    const w = typeof u.weeksToCommit === "string" ? parseInt(u.weeksToCommit, 10) : Number(u.weeksToCommit);
    return Number.isFinite(w) && w > 0 ? w : 1;
  }, [u.weeksToCommit]);
  const originalWeeks = Math.max(0, Number(u.originalWeeks) || 0);
  const maxAllowedWeeks = isTopUp ? Math.max(0, courseMaxWeeks - originalWeeks) : Math.max(0, courseMaxWeeks);
  // Top-ups can change the number of weeks here; first payments use the
  // number chosen on the details page.
  const [topUpChoice, setTopUpChoice] = useState<number | null>(null);
  const chosenWeeks = maxAllowedWeeks <= 0 ? 0 : clamp(isTopUp && topUpChoice ? topUpChoice : requestedWeeks, 1, maxAllowedWeeks);
  const basePrice = weeklyRate * chosenWeeks;
  const totalPrice = basePrice;
  // Paystack's "pass fees to customer" is set in the Paystack dashboard, so
  // the app only sends the course amount. Paystack shows its fee at checkout.
  const totalPriceKobo = totalPrice * 100;
  const basePriceKobo = basePrice * 100;
  const newTotalWeeks = isTopUp ? originalWeeks + chosenWeeks : chosenWeeks;

  // Reference for the next checkout attempt (replaced on every attempt).
  const referenceRef = useRef(newReference());
  const resumeReference = String(u.reference || "").trim();

  const paystackMetadata = useMemo(
    () => ({
      custom_fields: [
        { display_name: "Product", variable_name: "product", value: "CodeWithGideon" },
        { display_name: "UID", variable_name: "uid", value: u.uid },
        { display_name: "Kind", variable_name: "kind", value: isTopUp ? "topup" : "initial" },
        { display_name: "Weeks", variable_name: "weeks", value: String(chosenWeeks) },
        { display_name: "Path", variable_name: "path", value: safePath },
        { display_name: "PathId", variable_name: "pathId", value: String(u.pathId || "") },
        { display_name: "CourseId", variable_name: "courseId", value: String(u.courseId || "") },
        { display_name: "CohortKey", variable_name: "cohortKey", value: String(cohortKey || "") },
      ],
      uid: u.uid,
      kind: isTopUp ? "topup" : "initial",
      weeks: chosenWeeks,
      path: safePath,
      pathId: u.pathId || null,
      courseId: u.courseId || null,
      cohortId,
      cohortLabel,
      cohortKey,
      expectedAmountKobo: totalPriceKobo,
      baseAmountKobo: basePriceKobo,
      app: "codewithgideon-web",
      ts: Date.now(),
    }),
    [u.uid, isTopUp, chosenWeeks, safePath, u.pathId, u.courseId, cohortId, cohortLabel, cohortKey, totalPriceKobo, basePriceKobo],
  );

  const initializePayment = usePaystackPayment({
    reference: referenceRef.current,
    email: u.email,
    amount: totalPriceKobo,
    publicKey: PUBLIC_KEY,
    metadata: paystackMetadata as any,
    channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"] as any,
  });

  // Someone who already paid (e.g. an old hand-off after the webhook
  // credited them) must not be offered the first payment again.
  const alreadyEnrolled = !isTopUp && studentProfile?.status === "Complete" && phase !== "success";
  const accountMismatch = !!u.uid && !!authUid && authUid !== u.uid;

  const disablePay =
    phase === "processing" ||
    phase === "verifying" ||
    configLoading ||
    !!configError ||
    courseMaxWeeks <= 0 ||
    weeklyRate <= 0 ||
    totalPrice <= 0 ||
    chosenWeeks <= 0 ||
    !PUBLIC_KEY ||
    !FUNCTION_URL ||
    !u?.uid ||
    !authUid ||
    accountMismatch ||
    alreadyEnrolled ||
    !!payments.reviewPayment ||
    payments.loading ||
    (isTopUp && maxAllowedWeeks <= 0);

  const succeed = () => {
    setDone({
      kind: isTopUp ? "topup" : "initial",
      fromWeek: isTopUp ? originalWeeks + 1 : 1,
      toWeek: newTotalWeeks,
      courseTitle: displayCourse,
    });
    setPhase("success");
    onPaymentSuccess?.(newTotalWeeks);
    try {
      localStorage.removeItem("cwg_registration_handoff");
    } catch {
      // ignore
    }
  };

  const verifyAndFinalize = async (paystackRef: string, options: { quiet?: boolean } = {}) => {
    const quiet = !!options.quiet;
    try {
      if (!FUNCTION_URL) throw new Error("Missing VITE_VERIFY_PAYSTACK_URL");
      setLastReference(paystackRef);
      if (!quiet) {
        setPhase("verifying");
        setErrorMsg("");
      }
      // The server is idempotent per reference, so checking again is always safe.
      const idToken = await auth.currentUser?.getIdToken().catch(() => "");
      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        // `weeks` is a hint only; the server credits what was actually paid.
        body: JSON.stringify({ reference: paystackRef, uid: u.uid, weeks: chosenWeeks }),
      });
      const raw = await resp.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        console.error("Payment verification returned non-JSON:", { status: resp.status, body: raw.slice(0, 250), reference: paystackRef });
        throw new Error("We couldn't reach the payment check just now. Please try again in a moment.");
      }
      if (json?.needsReview) {
        setPhase("review");
        setErrorMsg(json?.error || "");
        return;
      }
      if (!resp.ok || !json?.ok) {
        if (quiet) return;
        throw new Error(json?.error || "We couldn't confirm this payment yet. Please check again in a moment.");
      }
      succeed();
    } catch (err: any) {
      console.error("Verification failed:", err);
      if (quiet) return;
      setFailedStage("verify");
      setPhase("failed");
      setErrorMsg(String(err?.message || "").trim() || "We couldn't confirm this payment yet. Please check again in a moment.");
    } finally {
      if (!quiet) inFlightRef.current = false;
    }
  };

  // Recover payments where the student paid but the page closed before we
  // confirmed it. Quiet: an unpaid reference just leaves the page as it is.
  useEffect(() => {
    if (!resumeReference || !u?.uid || !FUNCTION_URL) return;
    void verifyAndFinalize(resumeReference, { quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeReference, u?.uid]);

  const handlePayment = async () => {
    try {
      if (disablePay || inFlightRef.current) return;
      inFlightRef.current = true;
      setPhase("processing");
      setErrorMsg("");

      const currentAuthUid = auth.currentUser?.uid || "";
      if (!currentAuthUid) throw new Error("Your login session is not ready. Please sign in again.");
      if (currentAuthUid !== u.uid) throw new Error("Signed-in user does not match this payment session.");
      const profile = await registrationStore.getUserProfile(currentAuthUid);
      if (!profile) throw new Error("Your student profile is missing. Please complete registration first.");

      const attemptReference = newReference();
      referenceRef.current = attemptReference;
      setLastReference(attemptReference);

      // Informational only, so the admin can see checkouts in progress.
      // Access is granted by the payment function, never by this field.
      await registrationStore.setPendingPayment(currentAuthUid, {
        kind: isTopUp ? "topup" : "initial",
        weeks: chosenWeeks,
        amount: totalPrice,
        baseAmount: basePrice,
        weeklyRate,
        reference: attemptReference,
      });

      initializePayment({
        config: { email: u.email, amount: totalPriceKobo, reference: attemptReference, metadata: paystackMetadata as any },
        onSuccess: async (res: any) => {
          const r = String(res?.reference || "").trim() || attemptReference;
          await verifyAndFinalize(r);
        },
        onClose: async () => {
          setPhase("idle");
          inFlightRef.current = false;
          // Closed without paying: remove the notice so it doesn't linger.
          // If a bank transfer completes later, the webhook still credits it.
          try {
            const latest = await registrationStore.getUserProfile(currentAuthUid);
            if (latest?.pendingPayment?.reference === attemptReference) await registrationStore.clearPendingPayment(currentAuthUid);
          } catch (clearErr) {
            console.warn("Could not clear pending payment:", clearErr);
          }
        },
      });
    } catch (e: any) {
      console.error("Payment init failed:", e);
      setFailedStage("start");
      setPhase("failed");
      setErrorMsg(startErrorMessage(e));
      inFlightRef.current = false;
    }
  };

  // Coming from the Add weeks dialog: the student already pressed "Pay".
  useEffect(() => {
    const token = String(u.autoStart || "");
    if (!token || autoStarted.has(token) || disablePay || phase !== "idle") return;
    autoStarted.add(token);
    void handlePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u.autoStart, disablePay, phase]);

  // Move focus and scroll to the top when the screen changes, so screen
  // readers and phone users land on the new message.
  const screen = phase === "processing" ? "idle" : phase === "failed" && failedStage === "start" ? "idle" : phase;
  useEffect(() => {
    if (screen === "idle") return;
    window.scrollTo({ top: 0 });
    focusRef.current?.focus();
  }, [screen]);

  // After a payment, show the first class the student can now join.
  const profileComplete = studentProfile?.status === "Complete";
  useEffect(() => {
    if (phase !== "success" || !studentProfile || !profileComplete) return;
    let alive = true;
    registrationStore
      .getUnlockedSessionsForStudent(studentProfile)
      .then((list) => alive && setFirstClass({ loading: false, session: nextClass(list || []) }))
      .catch(() => alive && setFirstClass({ loading: false, session: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, profileComplete, studentProfile?.weeksToCommit, studentProfile?.cohortKey]);

  const fullName = String(u.fullName || studentProfile?.fullName || "").trim();
  const firstName = fullName.split(/\s+/)[0] || "";
  const phone = formatPhone(String(u.phone || studentProfile?.phone || ""));
  const whatsappButton = (
    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={mbtn({ kind: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
      <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
    </a>
  );
  const dashboardButton = (kind: "learn" | "secondary" = "learn") => (
    <button type="button" onClick={() => onNavigate("student-dashboard")} className={mbtn({ kind, size: "lg", className: "w-full sm:w-auto" })}>
      Go to my dashboard {kind === "learn" ? <ArrowRight className="h-5 w-5" aria-hidden /> : null}
    </button>
  );

  // -------------------------------------------------------------------------
  // Missing order (opened directly, or details not filled in yet)
  // -------------------------------------------------------------------------
  if (!u?.uid || !u?.email) {
    return (
      <JoinLayout width="narrow">
        <Card className="space-y-5 p-6 sm:p-8">
          <IconTile icon={Lock} size="lg" tone="paper" />
          <JoinTitle title="Let's find your order">Fill in your details and choose your weeks first, then you can pay here.</JoinTitle>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => onNavigate("continue-registration")} className={mbtn({ kind: "learn", size: "lg" })}>
              Go to your details <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => onNavigate("student-dashboard")} className={mbtn({ kind: "secondary", size: "lg" })}>
              My dashboard
            </button>
          </div>
        </Card>
      </JoinLayout>
    );
  }

  // -------------------------------------------------------------------------
  // Success
  // -------------------------------------------------------------------------
  const doneView =
    done ||
    (preview?.phase === "success"
      ? { kind: isTopUp ? ("topup" as const) : ("initial" as const), fromWeek: isTopUp ? originalWeeks + 1 : 1, toWeek: newTotalWeeks, courseTitle: displayCourse }
      : null);
  if (phase === "success" && doneView) {
    const done = doneView;
    const paidNow = profileComplete ? Math.max(done.toWeek, Number(studentProfile?.weeksToCommit) || 0) : done.toWeek;
    const total = courseMaxWeeks || Number(studentProfile?.courseDurationWeeks) || paidNow;
    const receipt = <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">Your receipt is saved under Payments.</p>;

    if (done.kind === "topup") {
      return (
        <StatusFrame
          focusRef={focusRef}
          icon={<SuccessIcon />}
          title="Weeks added"
          body={
            <div className="space-y-5">
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={() => navigate("/student/classes")} className={mbtn({ kind: "learn", size: "lg" })}>
                  See my classes <ArrowRight className="h-5 w-5" aria-hidden />
                </button>
                {dashboardButton("secondary")}
              </div>
              {receipt}
            </div>
          }
        >
          {weekRange(done.fromWeek, paidNow)} {done.fromWeek >= paidNow ? "is" : "are"} unlocked. You now have {paidNow} of {plural(total, "week")}.
        </StatusFrame>
      );
    }

    return (
      <StatusFrame
        focusRef={focusRef}
        icon={<SuccessIcon />}
        title={firstName ? `You're in, ${firstName}!` : "You're in!"}
        body={
          <div className="space-y-5 sm:space-y-6">
            {firstClass.loading && profileComplete ? (
              <div className="h-[220px] animate-pulse rounded-3xl bg-teal-600/20" aria-hidden />
            ) : (
              <ClassHero
                kind={firstClass.session ? "class" : "empty"}
                session={firstClass.session}
                totalWeeks={total}
                courseTitle={done.courseTitle}
                emptyTitle="Your first class is being scheduled"
                emptyNote={
                  nextCohort
                    ? `Classes start ${nextCohort}. The date and join link will show in your dashboard and the app.`
                    : "Gideon is putting the dates in. They'll show in your dashboard and the app."
                }
              />
            )}
            <div className={cn("grid gap-4", apk && "sm:grid-cols-2")}>
              {apk ? (
                <Card className="flex flex-col gap-3 p-5">
                  <IconTile icon={Smartphone} size="sm" />
                  <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Get the app</h2>
                  <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                    Join classes, watch recordings and chat with your mentor on your phone.
                  </p>
                  <a href={apk} className={mbtn({ kind: "secondary", size: "sm", className: "self-start" })}>
                    Download for Android <Download className="h-4 w-4" aria-hidden />
                  </a>
                </Card>
              ) : null}
              <Card className="flex flex-col gap-3 p-5">
                <IconTile icon={MessageSquare} size="sm" />
                <h2 className="font-display text-lg font-semibold text-blue-900 dark:text-white">Say hi to Gideon</h2>
                <p className="flex-1 text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">
                  Stuck on something? Ask in Mentor chat. Replies come to the app and your dashboard.
                </p>
                <button type="button" onClick={() => navigate("/student/chat")} className={mbtn({ kind: "secondary", size: "sm", className: "self-start" })}>
                  Open mentor chat <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </Card>
            </div>
            <div className="flex justify-center">{dashboardButton()}</div>
            {receipt}
          </div>
        }
      >
        Payment confirmed. {weekRange(1, paidNow)} of {done.courseTitle} {paidNow === 1 ? "is" : "are"} unlocked.
      </StatusFrame>
    );
  }

  // -------------------------------------------------------------------------
  // Confirming with Paystack
  // -------------------------------------------------------------------------
  if (phase === "verifying") {
    return (
      <StatusFrame
        focusRef={focusRef}
        icon={
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300" aria-hidden>
            <Spinner className="h-7 w-7 border-[3px]" />
          </span>
        }
        title="Confirming your payment"
        body={
          <Card className="mx-auto max-w-[520px] space-y-3 p-5 text-center sm:p-6" aria-live="polite">
            <p className="text-[15px] font-semibold text-blue-900 dark:text-white">Please keep this page open.</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">It usually takes a few seconds. Reference:</p>
            <div className="flex justify-center">
              <CopyReference value={lastReference} />
            </div>
          </Card>
        }
      >
        Paystack has your payment. We're checking it now.
      </StatusFrame>
    );
  }

  // -------------------------------------------------------------------------
  // Received, being checked by the admin (no way to pay again)
  // -------------------------------------------------------------------------
  const review = phase === "review" || (!!payments.reviewPayment && phase !== "failed");
  if (review) {
    const ref = payments.reviewPayment?.reference || lastReference;
    const amount = payments.reviewPayment?.amountKobo ? payments.reviewPayment.amountKobo / 100 : totalPrice;
    return (
      <StatusFrame
        focusRef={focusRef}
        icon={
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper text-blue-900 ring-1 ring-line dark:bg-slate-800 dark:text-white dark:ring-line-dark" aria-hidden>
            <Clock3 className="h-8 w-8" />
          </span>
        }
        title="We're confirming your payment"
        body={
          <div className="mx-auto max-w-[560px] space-y-5">
            <Notice tone="review" title="You don't need to pay again" role="status">
              {amount > 0 ? `Paystack received ${naira(amount)}. ` : "Paystack received your payment. "}
              Gideon is checking it, and your weeks unlock as soon as it's confirmed. This is usually the same day.
              {ref ? (
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  Reference <CopyReference value={ref} />
                </span>
              ) : null}
            </Notice>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {dashboardButton()}
              {whatsappButton}
            </div>
          </div>
        }
      >
        Your payment arrived and is being checked before your classes unlock.
      </StatusFrame>
    );
  }

  // -------------------------------------------------------------------------
  // Paid (maybe) but not confirmed yet: check again, never pay again
  // -------------------------------------------------------------------------
  if (phase === "failed" && failedStage === "verify") {
    return (
      <StatusFrame
        focusRef={focusRef}
        icon={
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" aria-hidden>
            <RefreshCw className="h-8 w-8" />
          </span>
        }
        title="We couldn't confirm your payment yet"
        body={
          <div className="mx-auto max-w-[560px] space-y-5">
            <Notice tone="pending" title="If you were charged, please don't pay again">
              {errorMsg ? <span className="block">{errorMsg}</span> : null}
              Your weeks unlock automatically once Paystack confirms the payment. Keep this reference in case you need help:
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <CopyReference value={lastReference} />
              </span>
            </Notice>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => void verifyAndFinalize(lastReference)}
                disabled={!lastReference}
                className={mbtn({ kind: "learn", size: "lg", className: "w-full sm:w-auto" })}
              >
                <RefreshCw className="h-5 w-5" aria-hidden /> Check again
              </button>
              {whatsappButton}
            </div>
            <div className="text-center">
              <button type="button" onClick={() => onNavigate("student-dashboard")} className="text-[15px] font-bold text-blue-900 hover:underline dark:text-white">
                I'll check later from my dashboard
              </button>
            </div>
          </div>
        }
      >
        This can take a minute, especially for bank transfers.
      </StatusFrame>
    );
  }

  // -------------------------------------------------------------------------
  // Nothing left to buy
  // -------------------------------------------------------------------------
  if (alreadyEnrolled || (isTopUp && !configLoading && courseMaxWeeks > 0 && maxAllowedWeeks <= 0)) {
    return (
      <StatusFrame
        focusRef={focusRef}
        icon={<SuccessIcon />}
        title={alreadyEnrolled ? "You're already in" : "You have every week"}
        body={<div className="flex justify-center">{dashboardButton()}</div>}
      >
        {alreadyEnrolled
          ? "Your payment is confirmed, so there's nothing to pay here. Your classes are in your dashboard."
          : `You've unlocked all ${courseMaxWeeks} weeks of ${displayCourse}. There's nothing more to pay.`}
      </StatusFrame>
    );
  }

  // -------------------------------------------------------------------------
  // Review and pay / Add weeks
  // -------------------------------------------------------------------------
  const processing = phase === "processing";
  const cohortLine = isTopUp
    ? cohortLabel
    : [cohortLabel, nextCohort ? `starts ${nextCohort}` : ""].filter(Boolean).join(" · ");
  const warnings = [
    accountMismatch ? "You're signed in with a different account from this order. Log out and sign in with the right account to pay." : "",
    !PUBLIC_KEY || !FUNCTION_URL ? "Checkout is temporarily unavailable. Please message us on WhatsApp so we can help you pay." : "",
    configLoading ? "" : configError,
  ].filter(Boolean);
  const startError = phase === "failed" && failedStage === "start" ? errorMsg : "";

  const summary = (
    <OrderSummary
      courseTitle={displayCourse}
      cohortLine={cohortLine}
      weeks={chosenWeeks}
      rate={weeklyRate}
      loading={configLoading}
      eyebrow={isTopUp ? "Adding weeks" : "Your order"}
    />
  );
  const payLabel = processing ? "Opening Paystack…" : startError ? "Try again" : `Pay ${naira(totalPrice)}`;
  const note = isTopUp
    ? "Paystack opens in a secure pop-up. Your new weeks unlock as soon as the payment is confirmed."
    : "Paystack opens in a secure pop-up. Your weeks unlock as soon as the payment is confirmed.";
  const backLink = (
    <button
      type="button"
      onClick={() => onNavigate(isTopUp ? "student-dashboard" : "continue-registration")}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-900 hover:underline dark:text-white"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden /> {isTopUp ? "Back to my dashboard" : "Back to your details"}
    </button>
  );

  return (
    <JoinLayout
      step={isTopUp ? undefined : 3}
      aside={
        <>
          {summary}
          <button type="button" onClick={() => void handlePayment()} disabled={disablePay} className={mbtn({ kind: "learn", size: "lg", full: true })}>
            {processing ? <Spinner /> : null}
            {payLabel}
            {processing ? null : <Lock className="h-[18px] w-[18px]" aria-hidden />}
          </button>
          <p className="px-1 text-sm font-medium leading-[22px] text-slate-500 dark:text-slate-400">
            {note} If it doesn't open, allow pop-ups for this site.
          </p>
          <div className="px-1">{backLink}</div>
        </>
      }
      bottomBar={
        <BottomBar label={isTopUp ? `${plural(chosenWeeks, "week")} · due today` : "Due today"} amount={naira(totalPrice)}>
          <button type="button" onClick={() => void handlePayment()} disabled={disablePay} className={mbtn({ kind: "learn", size: "lg" })}>
            {processing ? <Spinner /> : null}
            {processing ? "Opening…" : startError ? "Try again" : "Pay now"}
            {processing ? null : <Lock className="h-[18px] w-[18px]" aria-hidden />}
          </button>
        </BottomBar>
      }
    >
      <JoinTitle title={isTopUp ? "Add weeks" : "Review and pay"}>
        {isTopUp
          ? `Unlock more of ${displayCourse}. Same cohort, same mentor.`
          : "Check everything looks right, then pay with Paystack."}
      </JoinTitle>

      {startError ? (
        <Notice tone="error" title="Checkout didn't open">
          {startError} Nothing was charged.
        </Notice>
      ) : null}
      {warnings.map((w) => (
        <Notice key={w} tone="pending">
          {w}
        </Notice>
      ))}

      {isTopUp ? (
        <FormCard
          title="How many weeks?"
          titleId="topup-weeks"
          description={originalWeeks > 0 ? `You have ${weekRange(1, originalWeeks).toLowerCase()} of ${courseMaxWeeks}.` : undefined}
        >
          {configLoading ? (
            <div className="h-14 animate-pulse rounded-[14px] bg-paper dark:bg-slate-800" />
          ) : (
            <WeeksPicker
              value={chosenWeeks}
              max={maxAllowedWeeks}
              onChange={setTopUpChoice}
              startWeek={originalWeeks + 1}
              totalWeeks={courseMaxWeeks}
              quickPicks={[1, 2, maxAllowedWeeks]}
            />
          )}
        </FormCard>
      ) : null}

      <div className="lg:hidden">{summary}</div>

      {isTopUp ? null : (
        <Card as="section" aria-labelledby="pay-details-title" className="p-5 sm:p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 id="pay-details-title" className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
              Your details
            </h2>
            <button type="button" onClick={() => onNavigate("continue-registration")} className="text-[15px] font-bold text-teal-700 hover:underline dark:text-teal-300">
              Edit<span className="sr-only"> your details</span>
            </button>
          </div>
          <dl className="-mb-3">
            <DetailRow label="Name">{fullName || "—"}</DetailRow>
            <DetailRow label="Email">{u.email}</DetailRow>
            <DetailRow label="WhatsApp">{phone || "—"}</DetailRow>
            <DetailRow label="Course" className="hidden sm:grid">
              {displayCourse}
            </DetailRow>
            <DetailRow label="Weeks" className="hidden sm:grid">
              {plural(chosenWeeks, "week")}
              {courseMaxWeeks ? ` (${weekRange(1, chosenWeeks).toLowerCase()} of ${courseMaxWeeks})` : ""}
            </DetailRow>
          </dl>
        </Card>
      )}

      <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300 lg:hidden">{note}</p>

      {isTopUp ? null : (
        <Card as="section" aria-labelledby="pay-next-title" className="hidden p-5 sm:block sm:p-6">
          <h2 id="pay-next-title" className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
            What happens next
          </h2>
          <ol className="mt-4 space-y-4">
            {[
              ["Pay securely with Paystack", "Card, bank transfer or USSD. Paystack shows its small fee before you confirm."],
              ["Your weeks unlock straight away", "Classes, recordings, resources and mentor chat open as soon as the payment is confirmed."],
              [
                "Join your first class",
                nextCohort
                  ? `Classes start ${nextCohort}. The join link appears in your dashboard and the app.`
                  : "The join link appears in your dashboard and the app before each class.",
              ],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[15px] font-bold leading-[22px] text-blue-900 dark:text-white">{title}</p>
                  <p className="text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="lg:hidden">{backLink}</div>
    </JoinLayout>
  );
};

export default PaymentPage;
