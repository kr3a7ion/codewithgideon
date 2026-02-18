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

        const body = req.body || {};
        const reference = body.reference;
        const uid = body.uid;
        const expectedAmountRaw = body.expectedAmount;
        const weeks = body.weeks;
        const kind = body.kind; // "initial" | "topup"
        const cohortId = body.cohortId;
        const cohortLabel = body.cohortLabel;
        const path = body.path; // ✅ IMPORTANT for duration cap

        if (!reference || !uid) {
          res
            .status(400)
            .json({ok: false, error: "Missing reference or uid"});
          return;
        }

        const expectedAmountKobo =
          expectedAmountRaw === undefined || expectedAmountRaw === null ?
            null :
            Number(expectedAmountRaw);

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

        const verifyUrl =
          "https://api.paystack.co/transaction/verify/" +
          encodeURIComponent(String(reference));

        const paystackResp = await axios.get(verifyUrl, {
          headers: {Authorization: "Bearer " + secret},
        });

        const ok = paystackResp.data && paystackResp.data.status;
        const data = paystackResp.data && paystackResp.data.data;

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

        const userRef = admin.firestore().doc("users/" + String(uid));
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          res.status(404).json({ok: false, error: "User not found"});
          return;
        }

        const userData = userSnap.data() || {};
        const originalWeeks = Number(userData.weeksToCommit || 0) || 0;

        // ✅ Parse requested weeks (still untrusted)
        const requestedWeeks =
          Number.isFinite(Number(weeks)) && Number(weeks) > 0 ?
            Number(weeks) :
            1;

        // ✅ Get course max weeks from pinned OR Firestore
        let maxWeeks = 4;
        const normalizedPath = String(path || userData.path || "")
          .trim()
          .toLowerCase();

        // 1) pinned
        if (PINNED_MAX_WEEKS[normalizedPath]) {
          maxWeeks = PINNED_MAX_WEEKS[normalizedPath];
        } else {
          // 2) Firestore courses lookup by title
          if (normalizedPath) {
            const coursesSnap = await admin
              .firestore()
              .collection("courses")
              .get();
            const found = coursesSnap.docs.find((d) => {
              const t = String(d.data()?.title || "")
                .trim()
                .toLowerCase();
              return t === normalizedPath;
            });

            if (found) {
              maxWeeks = parseWeeksFromDuration(
                String(found.data()?.duration || "4"),
                4,
              );
            }
          }
        }

        // ✅ Enforce cap
        // initial: 1..maxWeeks
        // topup: 1..(maxWeeks - originalWeeks)  (at least 1)
        const maxAllowed =
          kind === "topup" ?
            Math.max(1, maxWeeks - originalWeeks) :
            Math.max(1, maxWeeks);

        const safeWeeks = clamp(requestedWeeks, 1, maxAllowed);

        const updates: Record<string, unknown> = {
          status: "Complete",
          pendingPayment: admin.firestore.FieldValue.delete(),
          path: String(path || userData.path || ""), // ✅ keep path consistent
        };

        if (kind === "topup") {
          updates.weeksToCommit =
            admin.firestore.FieldValue.increment(safeWeeks);
        } else {
          updates.weeksToCommit = safeWeeks;
        }

        if (cohortId) updates.cohortId = String(cohortId);
        if (cohortLabel) updates.cohortLabel = String(cohortLabel);

        await userRef.update(updates);

        await admin
          .firestore()
          .collection("users/" + String(uid) + "/payments")
          .add({
            reference: String(reference),
            amountKobo,
            email: (data.customer && data.customer.email) || null,
            weeks: safeWeeks, // ✅ store enforced weeks
            kind: kind || "initial",
            cohortId: cohortId || null,
            cohortLabel: cohortLabel || null,
            path: String(path || userData.path || ""),
            maxWeeks,
            verifiedAt: Date.now(),
            paystack: {
              id: data.id || null,
              status: data.status || null,
              currency: data.currency || null,
              paidAt: data.paid_at || null,
              channel: data.channel || null,
            },
          });

        res.json({ok: true, safeWeeks, maxWeeks});
      } catch (e: unknown) {
        const err = e as { response?: { data?: unknown }; message?: string };
        const axiosData = err.response?.data;

        console.error("verifyPaystackPayment error:", err);

        res.status(500).json({
          ok: false,
          error: "Server verification failed",
          details: axiosData || err.message || String(err),
        });
      }
    });
  },
);
