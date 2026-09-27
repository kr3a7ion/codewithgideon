/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin automations.
 *
 *   - adminCheckPayment (callable, admins only): asks Paystack about one
 *     reference and credits it through the same code path as the webhook.
 *     Replaces "check the Paystack dashboard, then approve by hand".
 *   - reconcilePendingPayments (every 30 min): does the same for every
 *     checkout a student started but that never reached verify/webhook, and
 *     clears checkouts that Paystack says were never paid after 24 hours.
 *   - sendClassReminders (every 15 min): posts a cohort announcement about
 *     an hour before each published class. Students see it in the app and on
 *     the website.
 *
 * Status for the admin Today page is written to automation/{job}
 * (admin-read-only). Sent reminders are recorded in automationReminders so
 * a class is only announced once (and again if it is rescheduled).
 */
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {db} from "./admin.js";
import {
  PAYSTACK_SECRET_KEY,
  PaymentError,
  fetchPaystackTransaction,
  fulfilPayment,
  isValidReference,
  safeString,
} from "./payments.js";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const TIME_ZONE = "Africa/Lagos";

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in test/automation.test.mjs)
// ---------------------------------------------------------------------------

export type PendingDecision = "fulfil" | "clear" | "wait";

/**
 * What to do with a checkout a student started.
 * - Paystack says success -> credit it.
 * - Failed, abandoned, reversed or unknown to Paystack -> clear after 24 h
 *   (the student may still be retrying before then).
 * - Still in progress -> wait, but give up after 3 days.
 */
export const decidePending = (input: {
  ageMs: number;
  paystackStatus: string;
}): PendingDecision => {
  const status = String(input.paystackStatus || "").toLowerCase();
  if (status === "success") return "fulfil";
  const dead = ["failed", "abandoned", "reversed", "not_found"];
  if (dead.includes(status)) return input.ageMs >= DAY ? "clear" : "wait";
  return input.ageMs >= 3 * DAY ? "clear" : "wait";
};

export const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
};

/** Reminders go out when a class starts within the next 75 minutes. */
export const REMINDER_LEAD_MS = 75 * MINUTE;

export const isReminderDue = (
  session: {isPublished?: boolean; startsAt?: any},
  nowMs: number,
): boolean => {
  if (session.isPublished === false) return false;
  const start = toMillis(session.startsAt);
  if (!start) return false;
  return start > nowMs && start - nowMs <= REMINDER_LEAD_MS;
};

export const formatClassTime = (ms: number): string =>
  new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  }).format(new Date(ms));

export const reminderMessage = (session: {
  title?: string;
  week?: number;
  startsAt?: any;
}): {title: string; body: string} => {
  const start = toMillis(session.startsAt);
  const week = Number(session.week || 0);
  const name = safeString(session.title) || "Your class";
  const label = week > 0 ? `Week ${week}: ${name}` : name;
  return {
    title: "Class starting soon",
    body:
      `${label} starts at ${formatClassTime(start)} (WAT). ` +
      "Open Classes in the app or on the website to join.",
  };
};

export const reminderId = (
  cohortId: string,
  sessionId: string,
  startMs: number,
): string =>
  `${cohortId}__${sessionId}__${startMs}`.replace(/[^\w-]/g, "_").slice(0, 400);

// ---------------------------------------------------------------------------
// Shared: check one reference with Paystack and credit it if paid
// ---------------------------------------------------------------------------

export type CheckOutcome =
  | "credited"
  | "already_credited"
  | "needs_review"
  | "not_paid"
  | "not_found"
  | "error";

type CheckResult = {
  outcome: CheckOutcome;
  paystackStatus: string;
  weeks: number;
  message: string;
};

const clearPendingIfMatches = async (uid: string, reference: string) => {
  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const pendingRef = safeString(snap.data()?.pendingPayment?.reference);
    if (snap.exists && pendingRef && pendingRef === reference) {
      t.update(userRef, {
        pendingPayment: FieldValue.delete(),
        updatedAt: Date.now(),
      });
    }
  });
};

const checkAndCredit = async (params: {
  reference: string;
  uid?: string;
  secret: string;
  source: "admin" | "reconcile";
}): Promise<CheckResult> => {
  let paystackStatus = "";
  try {
    const txn = await fetchPaystackTransaction(params.reference, params.secret);
    paystackStatus = safeString(txn.status).toLowerCase();
  } catch (err) {
    if (err instanceof PaymentError && err.code === "paystack_not_found") {
      return {
        outcome: "not_found",
        paystackStatus: "not_found",
        weeks: 0,
        message: "Paystack has no payment with this reference.",
      };
    }
    throw err;
  }

  if (paystackStatus !== "success") {
    return {
      outcome: "not_paid",
      paystackStatus,
      weeks: 0,
      message: `Not paid on Paystack (status: ${paystackStatus || "unknown"}).`,
    };
  }

  const result = await fulfilPayment({
    reference: params.reference,
    secret: params.secret,
    source: params.source,
    requestedUid: params.uid || undefined,
  });

  if (result.alreadyProcessed) {
    await clearPendingIfMatches(result.uid, params.reference);
  }

  if (result.status === "needs_review") {
    return {
      outcome: "needs_review",
      paystackStatus,
      weeks: result.safeWeeks,
      message:
        "Paid, but the amount doesn't match the course price. " +
        "Review it in Payments.",
    };
  }
  return {
    outcome: result.alreadyProcessed ? "already_credited" : "credited",
    paystackStatus,
    weeks: result.safeWeeks,
    message: result.alreadyProcessed ?
      "Already credited." :
      `Credited ${result.safeWeeks} week${result.safeWeeks === 1 ? "" : "s"}.`,
  };
};

// ---------------------------------------------------------------------------
// Callable: admin clicks "Check with Paystack"
// ---------------------------------------------------------------------------

export const adminCheckPayment = onCall(
  {secrets: [PAYSTACK_SECRET_KEY]},
  async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError("unauthenticated", "Sign in as an admin.");
    }
    const adminDoc = await db.collection("admins").doc(callerUid).get();
    if (!adminDoc.exists) {
      throw new HttpsError("permission-denied", "Admins only.");
    }

    const reference = safeString(request.data?.reference);
    const uid = safeString(request.data?.uid);
    if (!isValidReference(reference)) {
      throw new HttpsError("invalid-argument", "A valid reference is required.");
    }

    const secret = PAYSTACK_SECRET_KEY.value();
    if (!secret) {
      throw new HttpsError("failed-precondition", "Paystack isn't configured.");
    }

    try {
      const result = await checkAndCredit({
        reference,
        uid,
        secret,
        source: "admin",
      });
      logger.info("Admin payment check", {reference, uid, callerUid, ...result});
      return {ok: true, ...result};
    } catch (err) {
      if (err instanceof PaymentError) {
        return {
          ok: false,
          outcome: "error",
          paystackStatus: "",
          weeks: 0,
          code: err.code,
          message: err.message,
        };
      }
      logger.error("adminCheckPayment failed", err);
      throw new HttpsError("internal", "Couldn't reach Paystack. Try again.");
    }
  },
);

// ---------------------------------------------------------------------------
// Scheduled: reconcile checkouts that never reached verify or the webhook
// ---------------------------------------------------------------------------

export const reconcilePendingPayments = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: TIME_ZONE,
    secrets: [PAYSTACK_SECRET_KEY],
    retryCount: 0,
  },
  async () => {
    const secret = PAYSTACK_SECRET_KEY.value();
    if (!secret) {
      logger.error("PAYSTACK_SECRET_KEY is not set");
      return;
    }

    const now = Date.now();
    const counts = {
      checked: 0,
      credited: 0,
      needsReview: 0,
      cleared: 0,
      waiting: 0,
      errors: 0,
    };

    const snap = await db
      .collection("users")
      .where("pendingPayment.status", "==", "Pending")
      .limit(200)
      .get();

    for (const userDoc of snap.docs) {
      const pending = userDoc.data()?.pendingPayment || {};
      const reference = safeString(pending.reference);
      const ageMs = now - toMillis(pending.createdAt);
      // Give students time to finish paying; the webhook usually wins.
      if (!isValidReference(reference) || ageMs < 10 * MINUTE) {
        counts.waiting += 1;
        continue;
      }

      counts.checked += 1;
      try {
        const result = await checkAndCredit({
          reference,
          uid: userDoc.id,
          secret,
          source: "reconcile",
        });

        if (result.outcome === "credited") counts.credited += 1;
        else if (result.outcome === "needs_review") counts.needsReview += 1;
        else if (result.outcome === "already_credited") counts.cleared += 1;
        else {
          const decision = decidePending({
            ageMs,
            paystackStatus: result.paystackStatus,
          });
          if (decision === "clear") {
            await clearPendingIfMatches(userDoc.id, reference);
            counts.cleared += 1;
          } else {
            counts.waiting += 1;
          }
        }
      } catch (err) {
        counts.errors += 1;
        logger.warn("Reconcile failed for a checkout", {
          uid: userDoc.id,
          reference,
          message: (err as any)?.message,
        });
      }
    }

    await db.collection("automation").doc("payments").set({
      lastRunAt: FieldValue.serverTimestamp(),
      ...counts,
    }, {merge: true});
    logger.info("Pending payments reconciled", counts);
  },
);

// ---------------------------------------------------------------------------
// Scheduled: class reminders
// ---------------------------------------------------------------------------

export const sendClassReminders = onSchedule(
  {schedule: "every 15 minutes", timeZone: TIME_ZONE, retryCount: 0},
  async () => {
    const now = Date.now();
    let sent = 0;

    // Recent cohorts only: classes for a cohort run for weeks after it
    // stops taking new students, so this doesn't filter on "active".
    const cohortsSnap = await db
      .collection("cohorts")
      .where("createdAt", ">", now - 400 * DAY)
      .get();

    for (const cohortDoc of cohortsSnap.docs) {
      const cohortId = cohortDoc.id;
      const cohortLabel =
        safeString(cohortDoc.data()?.label) || cohortId;

      const sessionsSnap = await cohortDoc.ref
        .collection("sessions")
        .where("startsAt", ">", Timestamp.fromMillis(now))
        .where("startsAt", "<=", Timestamp.fromMillis(now + REMINDER_LEAD_MS))
        .get();

      for (const sessionDoc of sessionsSnap.docs) {
        const session = sessionDoc.data() || {};
        if (!isReminderDue(session, now)) continue;

        const startMs = toMillis(session.startsAt);
        const markerRef = db
          .collection("automationReminders")
          .doc(reminderId(cohortId, sessionDoc.id, startMs));
        const messageRef = cohortDoc.ref.collection("messages").doc();
        const {title, body} = reminderMessage(session);

        const created = await db.runTransaction(async (t) => {
          const marker = await t.get(markerRef);
          if (marker.exists) return false;
          t.set(markerRef, {
            cohortId,
            sessionId: sessionDoc.id,
            startsAt: session.startsAt,
            messageId: messageRef.id,
            sentAt: FieldValue.serverTimestamp(),
          });
          // Same shape as admin announcements (validCohortMessage).
          t.set(messageRef, {
            cohortId,
            cohortLabel,
            title,
            body,
            ctaLabel: "",
            ctaUrl: "",
            sentBy: "automation",
            sentAt: FieldValue.serverTimestamp(),
            createdAt: Date.now(),
            status: "sent",
          });
          return true;
        });
        if (created) sent += 1;
      }
    }

    await db.collection("automation").doc("classReminders").set({
      lastRunAt: FieldValue.serverTimestamp(),
      lastSent: sent,
      ...(sent > 0 ? {totalSent: FieldValue.increment(sent)} : {}),
    }, {merge: true});
    if (sent) logger.info("Class reminders sent", {sent});
  },
);
