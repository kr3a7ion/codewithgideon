/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";

admin.initializeApp();
const corsHandler = cors({origin: true});

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

        const secret = process.env.PAYSTACK_SECRET_KEY;
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

        const db = admin.firestore();
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
