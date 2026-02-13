import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";

admin.initializeApp();

const corsHandler = cors({origin: true});

export const verifyPaystackPayment = onRequest(
  {secrets: ["PAYSTACK_SECRET_KEY"]},
  (req, res) => {
    corsHandler(req, res, async () => {
      // ✅ Handle preflight
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
        const kind = body.kind;
        const cohortId = body.cohortId;
        const cohortLabel = body.cohortLabel;

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

        const safeWeeks =
          Number.isFinite(Number(weeks)) && Number(weeks) > 0 ?
            Number(weeks) :
            1;

        const updates: Record<string, unknown> = {
          status: "Complete",
          pendingPayment: admin.firestore.FieldValue.delete(),
        };

        if (kind === "topup") {
          updates.weeksToCommit =
            admin.firestore.FieldValue.increment(safeWeeks);
        } else {
          updates.weeksToCommit = safeWeeks;
        }

        if (cohortId) {
          updates.cohortId = String(cohortId);
        }
        if (cohortLabel) {
          updates.cohortLabel = String(cohortLabel);
        }

        await userRef.update(updates);

        await admin
          .firestore()
          .collection("users/" + String(uid) + "/payments")
          .add({
            reference: String(reference),
            amountKobo: amountKobo,
            email: (data.customer && data.customer.email) || null,
            weeks: safeWeeks,
            kind: kind || "initial",
            cohortId: cohortId || null,
            cohortLabel: cohortLabel || null,
            verifiedAt: Date.now(),
            paystack: {
              id: data.id || null,
              status: data.status || null,
              currency: data.currency || null,
              paidAt: data.paid_at || null,
              channel: data.channel || null,
            },
          });

        res.json({ok: true});
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
