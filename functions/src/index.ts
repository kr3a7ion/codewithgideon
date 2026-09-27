/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {FieldValue} from "firebase-admin/firestore";
import * as crypto from "crypto";
import {db} from "./admin.js";

// Payments live in their own module; names and URLs are unchanged.
export {
  initializePaystackPayment,
  verifyPaystackPayment,
  paystackWebhook,
} from "./payments.js";

// Admin automations: one-click payment check, background reconcile of
// unfinished checkouts, and class reminders.
export {
  adminCheckPayment,
  reconcilePendingPayments,
  sendClassReminders,
} from "./automation.js";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

type MentorRequestPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  clientMessageId?: unknown;
  contextType?: unknown;
  sessionId?: unknown;
  sessionTitle?: unknown;
  pathTitle?: unknown;
  cohortKey?: unknown;
  cohortId?: unknown;
  cohortLabel?: unknown;
  studentPhone?: unknown;
};

type MentorThreadStatus = "new" | "read" | "resolved";

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const normalizeSpaces = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const buildMentorThreadId = (studentUid: string): string => {
  const sanitize = (value: string) =>
    value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `mentor_${sanitize(studentUid)}`;
};

const hashRateLimitKey = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 48);

const enforceRateLimit = async (
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

    await enforceRateLimit("contact", email, 5, 60 * 60 * 1000);

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

export const sendMentorRequest = onCall(
  {
    region: "us-central1",
    // Keep App Check optional until the mobile app has it enabled everywhere.
    // enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to contact a mentor.",
      );
    }

    const data = (request.data || {}) as MentorRequestPayload;

    const name = normalizeSpaces(String(data.name ?? ""));
    const email = normalizeSpaces(String(data.email ?? "")).toLowerCase();
    const message = normalizeSpaces(String(data.message ?? ""));
    const clientMessageId = normalizeSpaces(String(data.clientMessageId ?? ""));
    const contextType = normalizeSpaces(String(data.contextType ?? "")).toLowerCase();
    const sessionId = normalizeSpaces(String(data.sessionId ?? ""));
    const sessionTitle = normalizeSpaces(String(data.sessionTitle ?? ""));
    const pathTitle = normalizeSpaces(String(data.pathTitle ?? ""));
    const cohortKey = normalizeSpaces(String(data.cohortKey ?? ""));
    const cohortId = normalizeSpaces(String(data.cohortId ?? ""));
    const cohortLabel = normalizeSpaces(String(data.cohortLabel ?? ""));
    const studentPhone = normalizeSpaces(String(data.studentPhone ?? ""));

    if (!name || name.length < 2) {
      throw new HttpsError(
        "invalid-argument",
        "A valid student name is required.",
      );
    }
    if (!email || !isValidEmail(email)) {
      throw new HttpsError("invalid-argument", "A valid email is required.");
    }
    if (!message || message.length < 5) {
      throw new HttpsError(
        "invalid-argument",
        "Message must be at least 5 characters.",
      );
    }
    if (message.length > 3000) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }
    if (!sessionId) {
      throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    await enforceRateLimit("mentor", request.auth.uid, 20, 10 * 60 * 1000);

    const sourceSuffix =
      contextType === "recorded" ?
        "recorded" :
        contextType === "web" || contextType === "general" ?
          "web" :
          "live";
    const sourceLabel =
      sourceSuffix === "web" ?
        "web-student-chat" :
        `mobile-ask-mentor:${sourceSuffix}`;
    const channelLabel = sourceSuffix === "web" ? "web_chat" : "mobile_chat";

    try {
      const now = FieldValue.serverTimestamp();
      const threadId = buildMentorThreadId(request.auth.uid);
      const threadRef = db.collection("mentorThreads").doc(threadId);
      const messageRef = clientMessageId ?
        threadRef.collection("messages").doc(clientMessageId) :
        threadRef.collection("messages").doc();

      const basePayload: Record<string, unknown> = {
        studentUid: request.auth.uid,
        studentName: name,
        studentEmail: email,
        studentPhone,
        status: "new" satisfies MentorThreadStatus,
        channel: channelLabel,
        threadType: "student_mentor_chat",
        source: sourceLabel,
        contextType: sourceSuffix,
        sessionId,
        sessionTitle,
        pathTitle,
        cohortKey,
        cohortId,
        cohortLabel,
        lastContext: {
          contextType: sourceSuffix,
          sessionId,
          sessionTitle,
          pathTitle,
          cohortKey,
          cohortId,
          cohortLabel,
        },
        lastMessage: message,
        lastMessagePreview: message,
        lastMessageAt: now,
        lastMessageId: messageRef.id,
        lastMessageSenderType: "user",
        lastMessageSenderName: name,
        lastMessageSenderEmail: email,
        updatedAt: now,
        auth: {
          uid: request.auth.uid,
        },
        appCheck: {
          appId: request.app?.appId || null,
        },
      };

      await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(threadRef);
        transaction.set(threadRef, {
          ...basePayload,
          ...(existing.exists ? {} : {createdAt: now}),
        }, {merge: true});
        transaction.set(messageRef, {
          body: message,
          message,
          senderType: "user",
          senderRole: "user",
          senderName: name,
          senderEmail: email,
          source: sourceLabel,
          channel: channelLabel,
          contextType: sourceSuffix,
          sessionId,
          sessionTitle,
          pathTitle,
          cohortKey,
          cohortId,
          cohortLabel,
          createdAt: now,
          ...(clientMessageId ? {clientMessageId} : {}),
        });
      });

      logger.info("Mentor request saved", {
        docId: threadRef.id,
        uid: request.auth.uid,
        sessionId,
        contextType: sourceSuffix,
        hasAppCheck: !!request.app,
      });

      return {
        success: true,
        conversationId: threadRef.id,
        messageId: messageRef.id,
      };
    } catch (error) {
      logger.error("Failed to save mentor request", error);
      throw new HttpsError(
        "internal",
        "Could not send mentor request right now. Please try again.",
      );
    }
  },
);

