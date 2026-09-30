import * as crypto from "crypto";
import {HttpsError} from "firebase-functions/v2/https";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "./admin.js";

export const normalizeSpaces = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

export const hashRateLimitKey = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 48);

export const enforceRateLimit = async (
  scope: string,
  rawKey: string,
  maxRequests: number,
  windowMs: number,
): Promise<void> => {
  const cleanKey = normalizeSpaces(rawKey).toLowerCase();
  if (!cleanKey) return;

  const nowMs = Date.now();
  const keyHash = hashRateLimitKey(`${scope}:${cleanKey}`);
  const ref = db.collection("functionRateLimits").doc(`${scope}_${keyHash}`);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const previousWindowStart = Number(data.windowStartMs || 0);
    const previousCount = Number(data.count || 0);
    const resetWindow =
      !previousWindowStart || nowMs - previousWindowStart >= windowMs;
    const windowStartMs = resetWindow ? nowMs : previousWindowStart;
    const nextCount = resetWindow ? 1 : previousCount + 1;

    if (nextCount > maxRequests) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many requests. Please wait a bit and try again.",
      );
    }

    transaction.set(ref, {
      scope,
      keyHash,
      count: nextCount,
      maxRequests,
      windowMs,
      windowStartMs,
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
  });
};
