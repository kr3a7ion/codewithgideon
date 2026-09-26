/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Paystack payments.
 *
 * The server is the only place that decides how many weeks a payment buys,
 * which course price applies and which cohort a student joins. Clients only
 * send the Paystack reference (plus optional hints that are never trusted
 * for money or access).
 *
 * The public function names and URLs are unchanged so the web app and the
 * mobile APK that is already installed keep working:
 *   - initializePaystackPayment (HTTP, used by mobile)
 *   - verifyPaystackPayment     (HTTP, used by web + mobile)
 *   - paystackWebhook           (HTTP, called by Paystack)
 */
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {FieldValue} from "firebase-admin/firestore";
import axios from "axios";
import cors from "cors";
import * as crypto from "crypto";
import {adminAuth, db} from "./admin.js";

const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");

// ---------------------------------------------------------------------------
// CORS: browsers may only call these endpoints from the site itself.
// Native apps send no Origin header and are unaffected.
// ---------------------------------------------------------------------------
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/([a-z0-9-]+\.)*codewithgideon\.com$/i,
  /^https:\/\/codewithgideon(--[a-z0-9-]+)?\.(web\.app|firebaseapp\.com)$/i,
  /^http:\/\/localhost(:\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/i,
];

const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
    return callback(null, allowed);
  },
});

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
type PaymentKind = "initial" | "topup";

type CourseTruth = {
  courseId: string | null;
  pathId: string | null;
  title: string;
  maxWeeks: number;
  weeklyRate: number; // naira per week
  source: "course" | "pinned";
};

type CohortRef = {
  cohortId: string;
  cohortKey: string;
  cohortLabel: string;
};

type FulfilResult = {
  alreadyProcessed: boolean;
  status: "success" | "needs_review";
  safeWeeks: number;
  maxWeeks: number;
  kind: PaymentKind;
  reviewReason: string;
  uid: string;
};

/** Error whose message is safe to show to students. */
class PaymentError extends Error {
  httpStatus: number;
  code: string;

  /**
   * @param {number} httpStatus HTTP status to return.
   * @param {string} code Machine-readable error code.
   * @param {string} publicMessage Message safe to show to students.
   */
  constructor(httpStatus: number, code: string, publicMessage: string) {
    super(publicMessage);
    this.name = "PaymentError";
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

const MAX_COURSE_WEEKS = 52;

// Last-resort fallback only, used when a legacy student has no course doc.
const PINNED_COURSES: Record<string, {weeks: number; rate: number}> = {
  "flutter & mobile app development": {weeks: 12, rate: 10000},
  "web development & wordpress": {weeks: 8, rate: 10000},
  "ai-assisted development": {weeks: 4, rate: 10000},
};

const safeString = (value: unknown): string => String(value ?? "").trim();

const toPositiveInt = (value: unknown): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidReference = (value: string): boolean =>
  /^[A-Za-z0-9_.=-]{6,100}$/.test(value);

const pathKey = (title: string): string =>
  safeString(title)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseWeeksFromDuration = (duration: string): number => {
  const n = parseInt(safeString(duration).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const parsePricePerWeek = (label: string): number => {
  const s = safeString(label).toLowerCase();
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return s.includes("k") ? num * 1000 : num;
};

const parseMetadata = (meta: unknown): Record<string, any> => {
  if (!meta) return {};
  if (typeof meta === "object") return meta as Record<string, any>;
  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (err) {
      logger.warn("Paystack metadata is not valid JSON");
    }
  }
  return {};
};

/** Top-level metadata wins; custom_fields fill any gaps. */
const readMetadata = (raw: unknown): Record<string, any> => {
  const meta = parseMetadata(raw);
  const fields = Array.isArray(meta.custom_fields) ? meta.custom_fields : [];
  const fromFields: Record<string, any> = {};
  for (const field of fields) {
    const key = safeString(field?.variable_name);
    if (key) fromFields[key] = field?.value;
  }
  return {...fromFields, ...meta};
};

const safeEqualHex = (a: string, b: string): boolean => {
  const left = Buffer.from(safeString(a), "utf8");
  const right = Buffer.from(safeString(b), "utf8");
  if (left.length === 0 || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

/** Returns the uid from a Firebase ID token, "" if none, or throws. */
const readAuthUid = async (authorization: unknown): Promise<string> => {
  const header = safeString(authorization);
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  const token = header.slice(7).trim();
  if (!token) return "";
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    throw new PaymentError(
      401,
      "invalid_token",
      "Your login session has expired. Please sign in again.",
    );
  }
};

// ---------------------------------------------------------------------------
// Course + cohort truth (always read from Firestore, never from the client)
// ---------------------------------------------------------------------------
const courseFromDoc = (id: string, data: any): CourseTruth | null => {
  if (!data) return null;
  const weeksField = toPositiveInt(data.weeks);
  const maxWeeks = Math.min(
    MAX_COURSE_WEEKS,
    weeksField || parseWeeksFromDuration(safeString(data.duration)),
  );
  const weeklyRate =
    toPositiveInt(data.pricePerWeek) ||
    parsePricePerWeek(safeString(data.priceLabel));
  if (!(maxWeeks > 0) || !(weeklyRate > 0)) return null;
  return {
    courseId: id,
    pathId: safeString(data.pathId) || null,
    title: safeString(data.title),
    maxWeeks,
    weeklyRate,
    source: "course",
  };
};

const resolveCourseTruth = async (input: {
  courseId: string;
  pathId: string;
  pathTitle: string;
}): Promise<CourseTruth | null> => {
  const courses = db.collection("courses");

  if (input.courseId) {
    const snap = await courses.doc(input.courseId).get();
    const found = snap.exists ? courseFromDoc(snap.id, snap.data()) : null;
    if (found) return found;
  }

  if (input.pathId) {
    const snap = await courses.where("pathId", "==", input.pathId).get();
    const candidates = snap.docs
      .filter((d) => d.data()?.isActive !== false)
      .sort(
        (a, b) =>
          Number(a.data()?.createdAt || 0) - Number(b.data()?.createdAt || 0),
      );
    for (const d of candidates) {
      const found = courseFromDoc(d.id, d.data());
      if (found) return found;
    }
  }

  if (input.pathTitle) {
    const snap = await courses
      .where("title", "==", input.pathTitle)
      .limit(5)
      .get();
    for (const d of snap.docs) {
      const found = courseFromDoc(d.id, d.data());
      if (found) return found;
    }

    const pinned = PINNED_COURSES[input.pathTitle.toLowerCase()];
    if (pinned) {
      return {
        courseId: null,
        pathId: input.pathId || null,
        title: input.pathTitle,
        maxWeeks: pinned.weeks,
        weeklyRate: pinned.rate,
        source: "pinned",
      };
    }
  }

  return null;
};

const resolveActiveCohort = async (
  pathId: string,
  pathTitle: string,
): Promise<CohortRef | null> => {
  const ids = [pathId, pathKey(pathTitle)].filter(Boolean);
  for (const id of ids) {
    const snap = await db.collection("activeCohorts").doc(id).get();
    if (!snap.exists) continue;
    const data = snap.data() || {};
    const cohortId = safeString(data.cohortId);
    const seasonKey = safeString(data.seasonKey);
    const cohortKey =
      safeString(data.cohortKey) ||
      (cohortId && seasonKey ? `${cohortId.toUpperCase()}-${seasonKey}` : "");
    if (!cohortKey) continue;
    return {
      cohortId: cohortId || cohortKey,
      cohortKey,
      cohortLabel: safeString(data.label) || cohortKey,
    };
  }
  return null;
};

// ---------------------------------------------------------------------------
// Paystack API
// ---------------------------------------------------------------------------
const fetchPaystackTransaction = async (
  reference: string,
  secret: string,
): Promise<any> => {
  try {
    const resp = await axios.get(
      "https://api.paystack.co/transaction/verify/" +
        encodeURIComponent(reference),
      {
        headers: {Authorization: "Bearer " + secret},
        timeout: 15000,
      },
    );
    if (!resp.data?.status || !resp.data?.data) {
      throw new PaymentError(
        400,
        "paystack_invalid",
        "We couldn't find this payment on Paystack yet. Please try again.",
      );
    }
    return resp.data.data;
  } catch (err: any) {
    if (err instanceof PaymentError) throw err;
    const status = Number(err?.response?.status || 0);
    if (status === 400 || status === 404) {
      throw new PaymentError(
        404,
        "paystack_not_found",
        "We couldn't find this payment on Paystack. Check the reference.",
      );
    }
    logger.error("Paystack verify request failed", {
      reference,
      status,
      data: err?.response?.data || null,
      message: err?.message,
    });
    throw new PaymentError(
      502,
      "paystack_unreachable",
      "We couldn't reach Paystack to confirm your payment. Please retry.",
    );
  }
};

// ---------------------------------------------------------------------------
// Credit calculation (pure, unit-tested in test/payments.test.mjs)
// ---------------------------------------------------------------------------
export const computeCredit = (input: {
  hasCourse: boolean;
  amountKobo: number;
  weeklyRate: number;
  maxWeeks: number;
  currentWeeks: number;
  kind: PaymentKind;
  requestedWeeks: number;
}): {safeWeeks: number; affordableWeeks: number; reviewReason: string} => {
  if (!input.hasCourse || !(input.weeklyRate > 0) || !(input.maxWeeks > 0)) {
    return {safeWeeks: 0, affordableWeeks: 0, reviewReason: "course_not_configured"};
  }
  // Weeks are bought with the money actually paid, never with the number the
  // client asked for. Gateway fees on top of the base price are ignored.
  const affordableWeeks = Math.floor(input.amountKobo / (input.weeklyRate * 100));
  const cap = input.kind === "topup" ?
    Math.max(0, input.maxWeeks - input.currentWeeks) :
    input.maxWeeks;
  const wanted = input.requestedWeeks > 0 ? input.requestedWeeks : affordableWeeks;
  const safeWeeks = Math.max(0, Math.min(wanted, affordableWeeks, cap));
  let reviewReason = "";
  if (affordableWeeks < 1) reviewReason = "amount_below_one_week";
  else if (cap < 1) reviewReason = "course_already_paid";
  else if (safeWeeks < 1) reviewReason = "no_weeks_credited";
  return {safeWeeks, affordableWeeks, reviewReason};
};

// ---------------------------------------------------------------------------
// Fulfilment (shared by verify + webhook). Idempotent per reference.
// ---------------------------------------------------------------------------
const fulfilPayment = async (params: {
  reference: string;
  secret: string;
  source: "verify" | "webhook";
  requestedUid?: string;
  authUid?: string;
  hintWeeks?: unknown;
}): Promise<FulfilResult> => {
  const {reference, secret} = params;
  const txn = await fetchPaystackTransaction(reference, secret);

  if (safeString(txn.status) !== "success") {
    throw new PaymentError(
      400,
      "not_successful",
      "This payment hasn't been completed yet.",
    );
  }
  if (safeString(txn.currency || "NGN").toUpperCase() !== "NGN") {
    throw new PaymentError(400, "bad_currency", "Unsupported currency.");
  }

  const meta = readMetadata(txn.metadata);
  const uid = safeString(meta.uid || meta.userId);
  if (!uid) {
    throw new PaymentError(
      400,
      "missing_uid",
      "This payment isn't linked to a student account. " +
        "Contact support with your payment reference.",
    );
  }
  if (params.requestedUid && params.requestedUid !== uid) {
    throw new PaymentError(
      403,
      "uid_mismatch",
      "This payment belongs to a different account.",
    );
  }
  if (params.authUid && params.authUid !== uid) {
    throw new PaymentError(
      403,
      "auth_mismatch",
      "This payment belongs to a different account.",
    );
  }

  const amountKobo = Math.floor(Number(txn.amount));
  if (!(amountKobo > 0)) {
    throw new PaymentError(400, "bad_amount", "Invalid payment amount.");
  }

  const userRef = db.collection("users").doc(uid);
  const paymentRef = userRef.collection("payments").doc(reference);
  const lockRef = db.collection("paymentReferences").doc(reference);

  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new PaymentError(
      404,
      "user_not_found",
      "We couldn't find your student profile. Contact support.",
    );
  }
  const user = userSnap.data() || {};

  const course = await resolveCourseTruth({
    courseId: safeString(user.courseId) || safeString(meta.courseId),
    pathId: safeString(user.pathId) || safeString(meta.pathId),
    pathTitle: safeString(user.path) || safeString(meta.path),
  });
  const activeCohort = await resolveActiveCohort(
    course?.pathId || safeString(user.pathId),
    safeString(user.path) || course?.title || "",
  );

  return db.runTransaction(async (t) => {
    const [uSnap, pSnap, lSnap] = await Promise.all([
      t.get(userRef),
      t.get(paymentRef),
      t.get(lockRef),
    ]);

    const lockUid = safeString(lSnap.data()?.uid);
    if (lSnap.exists && lockUid && lockUid !== uid) {
      throw new PaymentError(
        409,
        "reference_used",
        "This payment reference has already been used.",
      );
    }

    if (pSnap.exists) {
      const prev = pSnap.data() || {};
      return {
        alreadyProcessed: true,
        status: prev.status === "needs_review" ? "needs_review" : "success",
        safeWeeks: Number(prev.weeks || 0) || 0,
        maxWeeks: Number(prev.maxWeeks || 0) || 0,
        kind: prev.kind === "topup" ? "topup" : "initial",
        reviewReason: safeString(prev.reviewReason),
        uid,
      } as FulfilResult;
    }

    const u = uSnap.data() || {};
    const currentWeeks = Math.max(0, Math.floor(Number(u.weeksToCommit || 0)));
    const isEnrolled = safeString(u.status) === "Complete";
    // Kind comes from the student's state, not from the client.
    const kind: PaymentKind = isEnrolled ? "topup" : "initial";
    const requestedKind =
      safeString(meta.kind).toLowerCase() === "topup" ? "topup" : "initial";
    const requestedWeeks =
      toPositiveInt(meta.weeks) || toPositiveInt(params.hintWeeks);

    const maxWeeks = course?.maxWeeks || 0;
    const weeklyRate = course?.weeklyRate || 0;
    const {safeWeeks, affordableWeeks, reviewReason} = computeCredit({
      hasCourse: !!course,
      amountKobo,
      weeklyRate,
      maxWeeks,
      currentWeeks,
      kind,
      requestedWeeks,
    });

    const status: FulfilResult["status"] =
      reviewReason ? "needs_review" : "success";
    const baseAmount = safeWeeks * weeklyRate;
    const nowMs = Date.now();
    const pendingReference = safeString(u.pendingPayment?.reference);
    const clearsPending = !pendingReference || pendingReference === reference;

    const existingCohort: CohortRef | null = safeString(u.cohortKey) ?
      {
        cohortId: safeString(u.cohortId) || safeString(u.cohortKey),
        cohortKey: safeString(u.cohortKey),
        cohortLabel: safeString(u.cohortLabel) || safeString(u.cohortKey),
      } :
      null;
    // New students join the cohort that is active when they pay.
    // Top-ups keep the student in the cohort they are already in.
    const cohort =
      kind === "initial" ?
        activeCohort || existingCohort :
        existingCohort || activeCohort;

    t.set(paymentRef, {
      reference,
      uid,
      status,
      reviewReason: reviewReason || null,
      source: params.source,
      kind,
      requestedKind,
      weeks: safeWeeks,
      requestedWeeks: requestedWeeks || null,
      affordableWeeks,
      maxWeeks,
      weeklyRate,
      baseAmount,
      amountKobo,
      chargedAmountKobo: amountKobo,
      baseAmountKobo: baseAmount * 100,
      gatewayFeeKobo: Number.isFinite(Number(txn.fees)) ?
        Number(txn.fees) :
        null,
      email: safeString(txn.customer?.email) || null,
      path: safeString(u.path) || course?.title || "",
      pathId: course?.pathId || safeString(u.pathId) || null,
      courseId: course?.courseId || safeString(u.courseId) || null,
      courseSource: course?.source || null,
      cohortId: cohort?.cohortId || null,
      cohortLabel: cohort?.cohortLabel || null,
      cohortKey: cohort?.cohortKey || null,
      verifiedAt: FieldValue.serverTimestamp(),
      timestamp: nowMs,
      paystack: {
        id: txn.id || null,
        status: txn.status || null,
        currency: txn.currency || null,
        paidAt: txn.paid_at || null,
        channel: txn.channel || null,
        metadata: meta,
      },
    });

    t.set(lockRef, {
      uid,
      reference,
      status,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (status === "success" && course) {
      const updates: Record<string, any> = {
        status: "Complete",
        updatedAt: nowMs,
        weeklyRate,
        courseDurationWeeks: maxWeeks,
      };
      if (kind === "initial") {
        updates.weeksToCommit = safeWeeks;
        updates.totalPrice = baseAmount;
      } else {
        updates.weeksToCommit = FieldValue.increment(safeWeeks);
        updates.totalPrice = FieldValue.increment(baseAmount);
      }
      if (course.courseId) updates.courseId = course.courseId;
      if (course.pathId) updates.pathId = course.pathId;
      if (cohort) {
        updates.cohortId = cohort.cohortId;
        updates.cohortKey = cohort.cohortKey;
        updates.cohortLabel = cohort.cohortLabel;
      }
      if (clearsPending) updates.pendingPayment = FieldValue.delete();
      t.update(userRef, updates);
    } else if (clearsPending && u.pendingPayment) {
      t.update(userRef, {
        pendingPayment: FieldValue.delete(),
        updatedAt: nowMs,
      });
    }

    return {
      alreadyProcessed: false,
      status,
      safeWeeks,
      maxWeeks,
      kind,
      reviewReason,
      uid,
    } as FulfilResult;
  });
};

const reviewMessage = (reason: string): string => {
  switch (reason) {
  case "course_already_paid":
    return "Your payment was received, but you've already paid for the " +
      "full course. We'll review it and contact you about a refund.";
  case "amount_below_one_week":
    return "Your payment was received, but it's less than one week's fee. " +
      "We'll review it and contact you.";
  default:
    return "Your payment was received and is being reviewed. " +
      "Your classes will unlock once it's confirmed.";
  }
};

const sendError = (res: any, err: unknown, context: string) => {
  if (err instanceof PaymentError) {
    res.status(err.httpStatus).json({
      ok: false,
      code: err.code,
      error: err.message,
    });
    return;
  }
  logger.error(context, err);
  res.status(500).json({
    ok: false,
    code: "internal",
    error:
      "We couldn't complete this right now. It's safe to try again - " +
      "you won't be charged twice.",
  });
};

// ---------------------------------------------------------------------------
// HTTP: initialise (mobile)
// ---------------------------------------------------------------------------
export const initializePaystackPayment = onRequest(
  {secrets: [PAYSTACK_SECRET_KEY]},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }
      if (req.method !== "POST") {
        res.status(405).json({ok: false, error: "Method not allowed"});
        return;
      }

      try {
        const body = req.body || {};
        const clientMeta =
          body.metadata && typeof body.metadata === "object" ?
            (body.metadata as Record<string, any>) :
            {};
        const email = safeString(body.email).toLowerCase();
        const reference = safeString(body.reference);
        const callbackUrl = safeString(body.callbackUrl);
        const uid = safeString(clientMeta.uid);
        const authUid = await readAuthUid(req.headers.authorization);

        if (!uid) {
          throw new PaymentError(400, "missing_uid", "Sign in to pay.");
        }
        if (authUid && authUid !== uid) {
          throw new PaymentError(403, "auth_mismatch", "Sign in again to pay.");
        }
        if (!email || !isValidEmail(email)) {
          throw new PaymentError(400, "bad_email", "A valid email is required.");
        }
        if (!isValidReference(reference)) {
          throw new PaymentError(400, "bad_reference", "Invalid reference.");
        }

        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
          throw new PaymentError(
            404,
            "user_not_found",
            "Complete your registration before paying.",
          );
        }
        const user = userSnap.data() || {};
        // Without a login token, the email must match the student profile so
        // nobody can create pending payments on another student's account.
        if (!authUid && safeString(user.email).toLowerCase() !== email) {
          throw new PaymentError(
            403,
            "email_mismatch",
            "Use the email on your student profile to pay.",
          );
        }

        const course = await resolveCourseTruth({
          courseId: safeString(user.courseId),
          pathId: safeString(user.pathId),
          pathTitle: safeString(user.path),
        });
        if (!course) {
          throw new PaymentError(
            400,
            "course_not_configured",
            "This course isn't open for payment yet. Please contact support.",
          );
        }

        const kind: PaymentKind =
          safeString(user.status) === "Complete" ? "topup" : "initial";
        const currentWeeks = Math.max(
          0,
          Math.floor(Number(user.weeksToCommit || 0)),
        );
        const cap =
          kind === "topup" ?
            Math.max(0, course.maxWeeks - currentWeeks) :
            course.maxWeeks;
        if (cap < 1) {
          throw new PaymentError(
            400,
            "course_already_paid",
            "You've already paid for the full course.",
          );
        }
        const weeks = Math.max(
          1,
          Math.min(toPositiveInt(clientMeta.weeks) || 1, cap),
        );
        const baseAmount = weeks * course.weeklyRate;
        const amountKobo = baseAmount * 100;

        const clientAmount = Math.floor(Number(body.amount));
        if (clientAmount !== amountKobo) {
          logger.info("initializePaystackPayment: using server amount", {
            uid,
            clientAmount,
            amountKobo,
          });
        }

        const metadata = {
          uid,
          kind,
          weeks,
          courseId: course.courseId,
          pathId: course.pathId,
          path: safeString(user.path) || course.title,
          weeklyRate: course.weeklyRate,
          baseAmountKobo: amountKobo,
          expectedAmountKobo: amountKobo,
          app: safeString(clientMeta.app) || "unknown",
          custom_fields: [
            {
              display_name: "Product",
              variable_name: "product",
              value: "CodeWithGideon",
            },
            {display_name: "UID", variable_name: "uid", value: uid},
            {display_name: "Kind", variable_name: "kind", value: kind},
            {display_name: "Weeks", variable_name: "weeks", value: String(weeks)},
            {
              display_name: "Course",
              variable_name: "course",
              value: course.title,
            },
          ],
        };

        const secret = PAYSTACK_SECRET_KEY.value();
        if (!secret) {
          logger.error("PAYSTACK_SECRET_KEY is not set");
          throw new PaymentError(500, "config", "Payments are unavailable.");
        }

        let initData: any = null;
        try {
          const initResp = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
              email,
              amount: amountKobo,
              reference,
              currency: "NGN",
              callback_url: callbackUrl || undefined,
              metadata,
              channels: [
                "card",
                "bank",
                "ussd",
                "qr",
                "mobile_money",
                "bank_transfer",
              ],
            },
            {
              headers: {
                "Authorization": "Bearer " + secret,
                "Content-Type": "application/json",
              },
              timeout: 15000,
            },
          );
          initData = initResp.data?.status ? initResp.data.data : null;
        } catch (err: any) {
          logger.error("Paystack initialize failed", {
            uid,
            reference,
            status: err?.response?.status || null,
            data: err?.response?.data || null,
          });
        }
        if (!initData?.authorization_url) {
          throw new PaymentError(
            502,
            "paystack_init_failed",
            "We couldn't start the payment. Please try again.",
          );
        }

        await userRef.update({
          pendingPayment: {
            kind,
            status: "Pending",
            weeks,
            amount: baseAmount,
            baseAmount,
            weeklyRate: course.weeklyRate,
            reference,
            createdAt: Date.now(),
          },
          updatedAt: Date.now(),
        });

        res.json({
          ok: true,
          data: {
            authorization_url: initData.authorization_url,
            access_code: initData.access_code,
            reference: initData.reference || reference,
          },
          kind,
          weeks,
          amountKobo,
        });
      } catch (err) {
        sendError(res, err, "initializePaystackPayment error");
      }
    });
  },
);

// ---------------------------------------------------------------------------
// HTTP: verify (web + mobile)
// ---------------------------------------------------------------------------
export const verifyPaystackPayment = onRequest(
  {secrets: [PAYSTACK_SECRET_KEY]},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }
      if (req.method !== "POST") {
        res.status(405).json({ok: false, error: "Method not allowed"});
        return;
      }

      try {
        const body = req.body || {};
        const reference = safeString(body.reference);
        if (!isValidReference(reference)) {
          throw new PaymentError(400, "bad_reference", "Invalid reference.");
        }
        const authUid = await readAuthUid(req.headers.authorization);
        const secret = PAYSTACK_SECRET_KEY.value();
        if (!secret) {
          logger.error("PAYSTACK_SECRET_KEY is not set");
          throw new PaymentError(500, "config", "Payments are unavailable.");
        }

        const result = await fulfilPayment({
          reference,
          secret,
          source: "verify",
          requestedUid: safeString(body.uid),
          authUid,
          hintWeeks: body.weeks,
        });

        logger.info("Payment verified", {reference, ...result});

        if (result.status === "needs_review") {
          res.status(202).json({
            ok: false,
            needsReview: true,
            code: result.reviewReason || "needs_review",
            error: reviewMessage(result.reviewReason),
            reference,
          });
          return;
        }

        res.json({
          ok: true,
          safeWeeks: result.safeWeeks,
          maxWeeks: result.maxWeeks,
          kind: result.kind,
          alreadyProcessed: result.alreadyProcessed,
        });
      } catch (err) {
        sendError(res, err, "verifyPaystackPayment error");
      }
    });
  },
);

// ---------------------------------------------------------------------------
// HTTP: Paystack webhook - grants access even if the student's browser or
// app closed before verify ran.
// ---------------------------------------------------------------------------
export const paystackWebhook = onRequest(
  {secrets: [PAYSTACK_SECRET_KEY]},
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const secret = PAYSTACK_SECRET_KEY.value();
    if (!secret) {
      logger.error("PAYSTACK_SECRET_KEY is not set");
      res.status(500).send("Secret missing");
      return;
    }

    const raw: Buffer | undefined = (req as any).rawBody;
    const payload =
      raw && raw.length ? raw : Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto
      .createHmac("sha512", secret)
      .update(payload)
      .digest("hex");
    const signature = safeString(req.headers["x-paystack-signature"]);

    if (!safeEqualHex(expected, signature)) {
      logger.warn("Invalid Paystack webhook signature");
      res.status(401).send("Invalid signature");
      return;
    }

    const event = req.body || {};
    if (event.event !== "charge.success") {
      res.status(200).send("Event ignored");
      return;
    }

    const reference = safeString(event.data?.reference);
    const eventId = safeString(event.data?.id) || reference;
    if (!isValidReference(reference)) {
      res.status(200).send("Missing reference");
      return;
    }

    try {
      const result = await fulfilPayment({
        reference,
        secret,
        source: "webhook",
      });
      await db.collection("webhookEvents").doc(eventId).set({
        event: event.event,
        reference,
        uid: result.uid,
        status: result.status,
        reviewReason: result.reviewReason || null,
        alreadyProcessed: result.alreadyProcessed,
        processedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
      logger.info("Webhook payment fulfilled", {reference, ...result});
      res.status(200).send("OK");
    } catch (err) {
      if (err instanceof PaymentError && err.httpStatus < 500) {
        // Permanent problem (e.g. no uid in metadata): don't make Paystack
        // retry forever. The admin sees it in the logs.
        logger.warn("Webhook payment not fulfilled", {
          reference,
          code: err.code,
          message: err.message,
        });
        await db.collection("webhookEvents").doc(eventId).set({
          event: event.event,
          reference,
          status: "rejected",
          code: err.code,
          processedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
        res.status(200).send("Not fulfilled");
        return;
      }
      logger.error("Webhook fulfilment failed", err);
      res.status(500).send("Retry later");
    }
  },
);
