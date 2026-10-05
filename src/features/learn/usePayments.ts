import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { toMs } from "./lib";

/**
 * A payment as the student sees it, from users/{uid}/payments. These are
 * written only by the payment functions (and marked "reviewed" by the admin),
 * so they are the source of truth for "is a payment being checked?".
 */
export type PaymentRecord = {
  id: string;
  reference: string;
  /** success: weeks credited. needs_review: money received, admin is checking. reviewed: admin handled it. */
  status: "success" | "needs_review" | "reviewed" | string;
  kind: "initial" | "topup";
  weeks: number;
  requestedWeeks: number;
  weeklyRate: number;
  /** Course amount in naira (without the Paystack fee). */
  baseAmount: number;
  /** What Paystack charged, in kobo (includes the fee when passed on). */
  amountKobo: number;
  path: string;
  cohortLabel: string;
  channel: string;
  email: string;
  paidAtMs: number;
};

const channelLabels: Record<string, string> = {
  card: "Card",
  bank: "Bank",
  bank_transfer: "Bank transfer",
  ussd: "USSD",
  qr: "QR",
  mobile_money: "Mobile money",
  apple_pay: "Apple Pay",
};

export const channelLabel = (c: string) => channelLabels[String(c || "").toLowerCase()] || (c ? c.replace(/_/g, " ") : "Paystack");

const toRecord = (id: string, d: any): PaymentRecord => {
  const paidAt = toMs(d?.paystack?.paidAt) || toMs(d?.verifiedAt) || Number(d?.timestamp) || 0;
  return {
    id,
    reference: String(d?.reference || id),
    status: String(d?.status || ""),
    kind: d?.kind === "topup" ? "topup" : "initial",
    weeks: Math.max(0, Math.floor(Number(d?.weeks) || 0)),
    requestedWeeks: Math.max(0, Math.floor(Number(d?.requestedWeeks) || 0)),
    weeklyRate: Number(d?.weeklyRate) || 0,
    baseAmount: Number(d?.baseAmount) || 0,
    amountKobo: Number(d?.chargedAmountKobo ?? d?.amountKobo) || 0,
    path: String(d?.path || ""),
    cohortLabel: String(d?.cohortLabel || ""),
    channel: String(d?.paystack?.channel || ""),
    email: String(d?.email || ""),
    paidAtMs: paidAt,
  };
};

/**
 * Live list of the student's payments, newest first, plus the payment that
 * is waiting for the admin (if any). While one is waiting, the app must not
 * offer another way to pay.
 */
export const usePayments = (uid: string | null | undefined) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(!!uid);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "users", uid, "payments"),
      (snap: any) => {
        const list: PaymentRecord[] = (snap?.docs || []).map((d: any) => toRecord(d.id, d.data()));
        list.sort((a, b) => b.paidAtMs - a.paidAtMs);
        setPayments(list);
        setError("");
        setLoading(false);
      },
      (err: any) => {
        console.warn("payments listener failed:", err);
        setError("We couldn't load your payments right now.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  const reviewPayment = useMemo(() => payments.find((p) => p.status === "needs_review") || null, [payments]);
  const receipts = useMemo(() => payments.filter((p) => p.status === "success" || p.status === "reviewed"), [payments]);

  return { payments, receipts, reviewPayment, loading, error };
};
