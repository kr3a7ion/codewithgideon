import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

export const verifyPaystackPayment = onRequest(
  { secrets: ["PAYSTACK_SECRET_KEY"] },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ ok: false, error: "Method not allowed" });
        return;
      }

      const { reference, uid, expectedAmount, weeks, kind, cohortId, cohortLabel } = req.body || {};

      if (!reference || !uid) {
        res.status(400).json({ ok: false, error: "Missing reference or uid" });
        return;
      }

      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        res.status(500).json({ ok: false, error: "Paystack secret missing" });
        return;
      }

      // 1) Verify with Paystack
      const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
      const paystackResp = await axios.get(verifyUrl, {
        headers: { Authorization: `Bearer ${secret}` },
      });

      const data = paystackResp.data?.data;

      if (!paystackResp.data?.status || !data) {
        res.status(400).json({ ok: false, error: "Invalid Paystack response" });
        return;
      }

      const status = data.status; // "success"
      const amountKobo = data.amount; // integer in kobo
      const paidEmail = data.customer?.email;

      if (status !== "success") {
        res.status(400).json({ ok: false, error: "Payment not successful" });
        return;
      }

      // 2) Optional: match amount (kobo) if you pass expectedAmount
      // expectedAmount should be in KOBO from client: totalPrice * 100
      if (typeof expectedAmount === "number" && amountKobo !== expectedAmount) {
        res.status(400).json({ ok: false, error: "Amount mismatch" });
        return;
      }

      // 3) Update Firestore (Admin SDK bypasses rules)
      const userRef = admin.firestore().doc(`users/${uid}`);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        res.status(404).json({ ok: false, error: "User not found" });
        return;
      }

      const w = Number(weeks || 1);
      const safeWeeks = Number.isFinite(w) && w > 0 ? w : 1;

      // If initial payment: set weeksToCommit to safeWeeks
      // If topup: increment
      const updates: any = {
        status: "Complete",
        pendingPayment: admin.firestore.FieldValue.delete(),
      };

      if (kind === "topup") {
        updates.weeksToCommit = admin.firestore.FieldValue.increment(safeWeeks);
      } else {
        updates.weeksToCommit = safeWeeks;
      }

      // Optionally store cohort on user doc (if supplied)
      if (cohortId) updates.cohortId = String(cohortId);
      if (cohortLabel) updates.cohortLabel = String(cohortLabel);

      await userRef.update(updates);

      // Save payment record
      await admin.firestore().collection(`users/${uid}/payments`).add({
        reference,
        amountKobo,
        email: paidEmail || null,
        weeks: safeWeeks,
        kind: kind || "initial",
        cohortId: cohortId || null,
        cohortLabel: cohortLabel || null,
        verifiedAt: Date.now(),
      });

      res.json({ ok: true });
    } catch (e: any) {
      console.error("verifyPaystackPayment error:", e?.response?.data || e);
      res.status(500).json({ ok: false, error: "Server verification failed" });
    }
  }
);