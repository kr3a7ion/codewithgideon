/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";
import {logger} from "firebase-functions";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import * as crypto from "crypto";

const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");

admin.initializeApp();

const db = getFirestore();
const corsHandler = cors({origin: true});

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const normalizeSpaces = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

export const sendContactMessage = onCall(
  {
    region: "us-central1",
    // Uncomment this after App Check is set up on your web app:
    // enforceAppCheck: true,
  },
  async (request) => {
    const data = (request.data || {}) as ContactPayload;

    const name = normalizeSpaces(String(data.name ?? ""));
    const email = normalizeSpaces(String(data.email ?? "")).toLowerCase();
    const message = normalizeSpaces(String(data.message ?? ""));

    if (!name) {
      throw new HttpsError("invalid-argument", "Name is required.");
    }
    if (name.length < 2) {
      throw new HttpsError(
        "invalid-argument",
        "Name must be at least 2 characters.",
      );
    }

    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }
    if (!isValidEmail(email)) {
      throw new HttpsError("invalid-argument", "A valid email is required.");
    }

    if (!message) {
      throw new HttpsError("invalid-argument", "Message is required.");
    }
    if (message.length < 10) {
      throw new HttpsError(
        "invalid-argument",
        "Message must be at least 10 characters.",
      );
    }
    if (message.length > 3000) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }

    try {
      const docRef = await db.collection("contactMessages").add({
        name,
        email,
        message,
        status: "new",
        source: "web-contact-form",
        createdAt: FieldValue.serverTimestamp(),
        auth: {
          uid: request.auth?.uid || null,
        },
        appCheck: {
          appId: request.app?.appId || null,
        },
      });

      logger.info("Contact message saved", {
        docId: docRef.id,
        email,
        hasAuth: !!request.auth,
        hasAppCheck: !!request.app,
      });

      return {
        success: true,
        message: "Message sent successfully.",
      };
    } catch (error) {
      logger.error("Failed to save contact message", error);
      throw new HttpsError(
        "internal",
        "Could not send message right now. Please try again.",
      );
    }
  },
);

const parseWeeksFromDuration = (duration: string, fallback = 4) => {
  const n = parseInt(String(duration || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const PINNED_MAX_WEEKS: Record<string, number> = {
  "flutter & mobile app development": 12,
  "web development & wordpress": 8,
  "ai-assisted development": 4,
};

type VerifyBody = {
  reference?: string;
  uid?: string;
  expectedAmount?: number | string;

  weeks?: number | string;
  kind?: "initial" | "topup";

  path?: string;
  pathId?: string;
  courseId?: string;

  cohortId?: string;
  cohortLabel?: string;
  cohortKey?: string;

  // optional metadata hints
  courseMaxWeeks?: number | string;
  weeklyRate?: number | string;
};

type InitializeBody = {
  email?: string;
  amount?: number | string;
  reference?: string;
  callbackUrl?: string;
  currency?: string;
  plan?: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * Returns a trimmed string for any input. Null/undefined become "".
 */
function safeString(x: unknown): string {
  return String(x ?? "").trim();
}

/**
 * Paystack metadata can be object or stringified JSON sometimes.
 * Returns a plain object or null.
 */
function parseMetadata(meta: unknown): Record<string, any> | null {
  if (!meta) return null;

  if (typeof meta === "object") {
    return meta as Record<string, any>;
  }

  if (typeof meta === "string") {
    try {
      const j = JSON.parse(meta);
      if (j && typeof j === "object") return j as Record<string, any>;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("parseMetadata: invalid JSON metadata string");
    }
  }

  return null;
}

export const initializePaystackPayment = onRequest(
  {secrets: ["PAYSTACK_SECRET_KEY"]},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      try {
        if (req.method !== "POST") {
          res.status(405).json({ok: false, error: "Method not allowed"});
          return;
        }

        const body = (req.body || {}) as InitializeBody;
        const email = safeString(body.email).toLowerCase();
        const reference = safeString(body.reference);
        const callbackUrl = safeString(body.callbackUrl);
        const currency = safeString(body.currency) || "NGN";
        const plan = safeString(body.plan);
        const amount = Number(body.amount);
        const metadata =
          body.metadata && typeof body.metadata === "object" ?
            body.metadata :
            undefined;

        if (!email || !isValidEmail(email)) {
          res.status(400).json({ok: false, error: "Valid email is required"});
          return;
        }

        if (!reference) {
          res.status(400).json({ok: false, error: "Reference is required"});
          return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          res
            .status(400)
            .json({ok: false, error: "Valid amount is required"});
          return;
        }

        const secret = PAYSTACK_SECRET_KEY.value();
        if (!secret) {
          res.status(500).json({ok: false, error: "Paystack secret missing"});
          return;
        }

        const initResp = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email,
            amount,
            reference,
            currency,
            callback_url: callbackUrl || undefined,
            plan: plan || undefined,
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
          },
        );

        if (!initResp.data?.status || !initResp.data?.data) {
          res.status(400).json({
            ok: false,
            error: "Invalid Paystack initialization response",
            details: initResp.data || null,
          });
          return;
        }

        res.json({
          ok: true,
          data: {
            authorization_url: initResp.data.data.authorization_url,
            access_code: initResp.data.data.access_code,
            reference: initResp.data.data.reference || reference,
          },
        });
      } catch (e: any) {
        const axiosData = e?.response?.data;
        logger.error("initializePaystackPayment error", e);
        res.status(500).json({
          ok: false,
          error: "Could not initialize payment",
          details: axiosData || e?.message || String(e),
        });
      }
    });
  },
);

export const verifyPaystackPayment = onRequest(
  {secrets: ["PAYSTACK_SECRET_KEY"]},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      try {
        if (req.method !== "POST") {
          res.status(405).json({ok: false, error: "Method not allowed"});
          return;
        }

        const body = (req.body || {}) as VerifyBody;

        const reference = safeString(body.reference);
        const uid = safeString(body.uid);

        const kind: "initial" | "topup" =
          body.kind === "topup" ? "topup" : "initial";

        const path = safeString(body.path);
        const pathId = safeString(body.pathId);
        const courseId = safeString(body.courseId);

        const cohortId = safeString(body.cohortId);
        const cohortLabel = safeString(body.cohortLabel);
        const cohortKey = safeString(body.cohortKey);

        if (!reference || !uid) {
          res
            .status(400)
            .json({ok: false, error: "Missing reference or uid"});
          return;
        }

        // expected amount (kobo) optional
        const expectedAmountKobo =
          body.expectedAmount === undefined || body.expectedAmount === null ?
            null :
            Number(body.expectedAmount);

        if (
          expectedAmountKobo !== null &&
          !Number.isFinite(expectedAmountKobo)
        ) {
          res.status(400).json({ok: false, error: "Invalid expectedAmount"});
          return;
        }

        // const secret = process.env.PAYSTACK_SECRET_KEY;
        const secret = PAYSTACK_SECRET_KEY.value();
        if (!secret) {
          res.status(500).json({ok: false, error: "Paystack secret missing"});
          return;
        }

        // 🔐 verify with Paystack
        const verifyUrl =
          "https://api.paystack.co/transaction/verify/" +
          encodeURIComponent(reference);

        const paystackResp = await axios.get(verifyUrl, {
          headers: {Authorization: "Bearer " + secret},
        });

        const ok = paystackResp.data?.status;
        const data = paystackResp.data?.data;

        if (!ok || !data) {
          res.status(400).json({
            ok: false,
            error: "Invalid Paystack response",
            paystack: paystackResp.data || null,
          });
          return;
        }

        if (data.status !== "success") {
          res.status(400).json({
            ok: false,
            error: "Payment not successful",
            paystackStatus: data.status,
          });
          return;
        }

        const amountKobo = Number(data.amount);

        if (
          expectedAmountKobo !== null &&
          Number.isFinite(expectedAmountKobo) &&
          amountKobo !== expectedAmountKobo
        ) {
          res.status(400).json({
            ok: false,
            error: "Amount mismatch",
            expected: expectedAmountKobo,
            got: amountKobo,
          });
          return;
        }

        // ✅ SECURITY (backward compatible):
        // If Paystack metadata includes uid, enforce it.
        const meta = parseMetadata(data.metadata);
        const metaUid = safeString(meta?.uid || meta?.userId);
        if (metaUid && metaUid !== uid) {
          res.status(400).json({
            ok: false,
            error: "UID mismatch (metadata does not match request uid)",
            details: {metaUid, uid},
          });
          return;
        }

        // const db = admin.firestore();
        const userRef = db.doc(`users/${uid}`);

        // ✅ idempotency lock: deterministic doc per reference
        const paymentRef = db.doc(`users/${uid}/payments/${reference}`);

        // ✅ run in transaction to avoid double-credit on retries
        const result = await db.runTransaction(async (tx) => {
          const [userSnap, paymentSnap] = await Promise.all([
            tx.get(userRef),
            tx.get(paymentRef),
          ]);

          if (!userSnap.exists) {
            throw Object.assign(new Error("User not found"), {code: 404});
          }

          // Already processed? Return existing
          if (paymentSnap.exists) {
            const prev = paymentSnap.data() || {};
            return {
              alreadyProcessed: true,
              safeWeeks: Number(prev.weeks || 0) || 0,
              maxWeeks: Number(prev.maxWeeks || 0) || 0,
            };
          }

          const userData = userSnap.data() || {};
          const originalWeeks = Number(userData.weeksToCommit || 0) || 0;

          // ✅ requested weeks (still untrusted)
          const requestedWeeks =
            Number.isFinite(Number(body.weeks)) && Number(body.weeks) > 0 ?
              Number(body.weeks) :
              1;

          // ✅ resolve maxWeeks (truth fields first)
          let maxWeeks = 4;

          // 0) client hint (only if sane)
          const hintedMax = Number(body.courseMaxWeeks);
          if (Number.isFinite(hintedMax) && hintedMax > 0 && hintedMax <= 104) {
            maxWeeks = Math.floor(hintedMax);
          } else {
            const normalizedPath = String(path || userData.path || "")
              .trim()
              .toLowerCase();

            // 1) pinned
            if (PINNED_MAX_WEEKS[normalizedPath]) {
              maxWeeks = PINNED_MAX_WEEKS[normalizedPath];
            } else {
              // 2) Firestore course lookup using tx.get ONLY
              const coursesCol = db.collection("courses");
              let found: FirebaseFirestore.QueryDocumentSnapshot | null = null;

              // Prefer courseId
              if (courseId) {
                const cSnap = await tx.get(coursesCol.doc(courseId));
                if (cSnap.exists) {
                  // doc snapshot isn't query snapshot; wrap via a flag
                  // We'll treat it as "found" via direct data below
                  const foundData = cSnap.data() as any;
                  const truthWeeks = Number(foundData?.weeks);
                  if (Number.isFinite(truthWeeks) && truthWeeks > 0) {
                    maxWeeks = Math.floor(truthWeeks);
                  } else {
                    maxWeeks = parseWeeksFromDuration(
                      String(foundData?.duration || "4"),
                      4,
                    );
                  }

                  // continue without query
                  found = null;
                }
              }

              // If we still have default and have pathId: query by pathId
              if (maxWeeks === 4 && pathId) {
                const q = coursesCol.where("pathId", "==", pathId).limit(1);
                const qs = await tx.get(q);
                if (!qs.empty) found = qs.docs[0];
              }

              // Last fallback: title match (requires exact title field)
              // NOTE: better to store titleLower in courses and query that.
              if (maxWeeks === 4 && !found && normalizedPath) {
                const q = coursesCol.where("title", "==", path).limit(1);
                const qs = await tx.get(q);
                if (!qs.empty) found = qs.docs[0];
              }

              if (found) {
                const foundData = found.data() as any;
                const truthWeeks = Number(foundData?.weeks);
                if (Number.isFinite(truthWeeks) && truthWeeks > 0) {
                  maxWeeks = Math.floor(truthWeeks);
                } else {
                  maxWeeks = parseWeeksFromDuration(
                    String(foundData?.duration || "4"),
                    4,
                  );
                }
              }
            }
          }

          // ✅ enforce cap correctly
          const remaining = Math.max(0, maxWeeks - originalWeeks);

          let safeWeeks = 0;
          if (kind === "topup") {
            if (remaining <= 0) safeWeeks = 0;
            else safeWeeks = clamp(requestedWeeks, 1, remaining);
          } else {
            safeWeeks = clamp(requestedWeeks, 1, Math.max(1, maxWeeks));
          }

          // ✅ update user (simple, no TS generics needed)
          const updates: Record<string, any> = {
            status: "Complete",
            pendingPayment: admin.firestore.FieldValue.delete(),
            path: String(path || userData.path || "").trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (pathId) updates.pathId = pathId;
          if (courseId) updates.courseId = courseId;
          if (cohortId) updates.cohortId = cohortId;
          if (cohortLabel) updates.cohortLabel = cohortLabel;
          if (cohortKey) updates.cohortKey = cohortKey;

          if (kind === "topup") {
            if (safeWeeks > 0) {
              updates.weeksToCommit =
                admin.firestore.FieldValue.increment(safeWeeks);
            }
          } else {
            updates.weeksToCommit = safeWeeks;
          }

          tx.update(userRef, updates);

          tx.set(paymentRef, {
            reference,
            uid,
            amountKobo,
            email: data?.customer?.email || null,
            weeks: safeWeeks,
            kind,

            cohortId: cohortId || null,
            cohortLabel: cohortLabel || null,
            cohortKey: cohortKey || null,

            path: String(path || userData.path || "").trim(),
            pathId: pathId || null,
            courseId: courseId || null,

            maxWeeks,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),

            paystack: {
              id: data.id || null,
              status: data.status || null,
              currency: data.currency || null,
              paidAt: data.paid_at || null,
              channel: data.channel || null,
              metadata: meta || null,
            },
          });

          return {alreadyProcessed: false, safeWeeks, maxWeeks};
        });

        res.json({
          ok: true,
          safeWeeks: result.safeWeeks,
          maxWeeks: result.maxWeeks,
          alreadyProcessed: result.alreadyProcessed,
        });
      } catch (e: any) {
        const axiosData = e?.response?.data;

        console.error("verifyPaystackPayment error:", e);

        if (e?.code === 404) {
          res.status(404).json({ok: false, error: "User not found"});
          return;
        }

        res.status(500).json({
          ok: false,
          error: "Server verification failed",
          details: axiosData || e?.message || String(e),
        });
      }
    });
  },
);

export const paystackWebhook = onRequest(
  {secrets: [PAYSTACK_SECRET_KEY]},
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
      }

      const secret = PAYSTACK_SECRET_KEY.value();

      if (!secret) {
        res.status(500).send("Secret missing");
        return;
      }

      // 🔐 Verify Paystack signature
      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      const signatureHeader = req.headers["x-paystack-signature"];
      const signature =
        typeof signatureHeader === "string" ? signatureHeader : "";

      if (hash !== signature) {
        logger.error("Invalid Paystack webhook signature");
        res.status(401).send("Invalid signature");
        return;
      }

      const event = req.body;

      // Only process successful charges
      if (event?.event !== "charge.success") {
        res.status(200).send("Event ignored");
        return;
      }

      const data = event.data;

      const reference = safeString(data.reference);
      const metadata = parseMetadata(data.metadata);

      const uid = safeString(metadata?.uid || metadata?.userId);

      if (!reference || !uid) {
        logger.error("Webhook missing reference or uid", {reference, uid});
        res.status(400).send("Missing reference or uid");
        return;
      }

      // Fraud protection checks
      if (data.status !== "success") {
        logger.warn("Webhook payment not successful", {reference});
        res.status(400).send("Invalid payment status");
        return;
      }

      if (data.currency !== "NGN") {
        logger.warn("Webhook invalid currency", {reference});
        res.status(400).send("Invalid currency");
        return;
      }

      if (!data.customer?.email) {
        logger.warn("Webhook missing customer email", {reference});
        res.status(400).send("Missing email");
        return;
      }

      const eventId = safeString(event?.data?.id || event?.data?.reference);

      if (!eventId) {
        res.status(400).send("Missing event id");
        return;
      }

      const webhookRef = db.collection("webhookEvents").doc(eventId);
      const webhookSnap = await webhookRef.get();

      // Prevent duplicate webhook processing
      if (webhookSnap.exists) {
        logger.info("Duplicate webhook ignored", {eventId});
        res.status(200).send("Already processed");
        return;
      }

      await webhookRef.set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        event: event.event,
        reference,
        uid,
      });

      logger.info("Webhook payment received", {reference, uid});

      /**
       * Verify with Paystack again (defense layer)
       */
      const verifyUrl =
        "https://api.paystack.co/transaction/verify/" +
        encodeURIComponent(reference);

      const paystackResp = await axios.get(verifyUrl, {
        headers: {Authorization: "Bearer " + secret},
        timeout: 10000,
      });

      if (!paystackResp.data?.status) {
        logger.error("Webhook verification failed", {
          paystack: paystackResp.data,
        });
        res.status(400).send("Verification failed");
        return;
      }

      logger.info("Webhook verification successful", {reference});

      // NOTE:
      // Firestore updates still handled by verifyPaystackPayment
      // This webhook acts as a verification backup.

      res.status(200).send("Webhook processed");
    } catch (error) {
      logger.error("Webhook error", error);
      res.status(500).send("Webhook failure");
    }
  },
);
