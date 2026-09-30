/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Website enquiries from the /hire page.
 *
 * The contact form needs an email; business owners in Nigeria mostly want a
 * WhatsApp reply, so this form asks for a WhatsApp number instead. Enquiries
 * land in `contactMessages` next to contact-form messages, so they show up
 * in Admin → Inbox → Website messages with a "Reply on WhatsApp" button.
 */
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "./admin.js";
import {enforceRateLimit, normalizeSpaces} from "./rateLimit.js";

export const HIRE_NEEDS: Record<string, string> = {
  landing: "Landing page",
  booking: "Booking site",
  other: "Something else",
};

export const HIRE_BUDGETS: Record<string, string> = {
  "under-100k": "Under ₦100,000",
  "100k-200k": "₦100,000 – ₦200,000",
  "200k-400k": "₦200,000 – ₦400,000",
  "over-400k": "Over ₦400,000",
  "not-sure": "Not sure yet",
};

/**
 * Digits-only international number, or null. Accepts Nigerian local
 * numbers (0803…, 803…), +234/00234 forms and other 10–15 digit numbers.
 */
export const normalizeWhatsApp = (raw: unknown): string | null => {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = `234${d.slice(1)}`;
  else if (d.length === 10 && /^[789]/.test(d)) d = `234${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
};

export type HireEnquiry = {
  name: string;
  businessName: string;
  whatsapp: string;
  need: string;
  needLabel: string;
  budget: string;
  budgetLabel: string;
  details: string;
  utm: Record<string, string>;
  page: string;
  message: string;
};

const clip = (value: unknown, max: number) =>
  normalizeSpaces(String(value ?? "")).slice(0, max);

/** Validates and cleans the form. Throws a message for the visitor. */
export const buildHireEnquiry = (data: Record<string, unknown>): HireEnquiry => {
  const name = clip(data.name, 80);
  const businessName = clip(data.businessName, 120);
  const whatsapp = normalizeWhatsApp(data.whatsapp);
  const need = String(data.need ?? "");
  const budget = String(data.budget ?? "");
  const details = String(data.details ?? "").trim().slice(0, 1000);

  if (name.length < 2) throw new Error("Enter your name.");
  if (businessName.length < 2) throw new Error("Enter your business name.");
  if (!whatsapp) throw new Error("Enter a valid WhatsApp number.");
  // Own keys only, so "constructor" or "__proto__" can't slip through.
  if (!Object.prototype.hasOwnProperty.call(HIRE_NEEDS, need)) throw new Error("Choose what you need.");
  if (!Object.prototype.hasOwnProperty.call(HIRE_BUDGETS, budget)) throw new Error("Choose a budget range.");

  const utm: Record<string, string> = {};
  const rawUtm = (data.utm && typeof data.utm === "object") ? data.utm as Record<string, unknown> : {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = clip(rawUtm[key], 80);
    if (v) utm[key] = v;
  }
  const page = clip(data.page, 120);

  const lines = [
    `Business: ${businessName}`,
    `Needs: ${HIRE_NEEDS[need]}`,
    `Budget: ${HIRE_BUDGETS[budget]}`,
    `WhatsApp: +${whatsapp}`,
  ];
  if (details) lines.push("", details);
  if (utm.utm_source || utm.utm_campaign) {
    lines.push("", `Came from: ${[utm.utm_source, utm.utm_campaign].filter(Boolean).join(" / ")}`);
  }

  return {
    name,
    businessName,
    whatsapp,
    need,
    needLabel: HIRE_NEEDS[need],
    budget,
    budgetLabel: HIRE_BUDGETS[budget],
    details,
    utm,
    page,
    message: lines.join("\n"),
  };
};

/** The caller's IP from the Google front end (first X-Forwarded-For hop). */
export const clientIp = (req: {headers?: Record<string, unknown>; ip?: string} | undefined): string => {
  const fwd = req?.headers?.["x-forwarded-for"];
  const first = String(Array.isArray(fwd) ? fwd[0] : fwd || "").split(",")[0].trim();
  return first || String(req?.ip || "");
};

export const sendHireEnquiry = onCall(
  {region: "us-central1"},
  async (request) => {
    const data = (request.data || {}) as Record<string, unknown>;

    // Honeypot: people never see this field. Pretend it worked.
    if (String(data.website ?? "").trim()) {
      logger.warn("Hire enquiry honeypot tripped");
      return {success: true};
    }

    let enquiry: HireEnquiry;
    try {
      enquiry = buildHireEnquiry(data);
    } catch (e: any) {
      throw new HttpsError("invalid-argument", String(e?.message || "Please check the form."));
    }

    // Per number and per network, so changing the typed number doesn't help.
    await enforceRateLimit("hire", enquiry.whatsapp, 5, 60 * 60 * 1000);
    await enforceRateLimit("hire-ip", clientIp(request.rawRequest), 10, 60 * 60 * 1000);

    try {
      const ref = await db.collection("contactMessages").add({
        name: enquiry.name,
        email: "",
        message: enquiry.message,
        topic: "Website enquiry",
        category: "hire",
        source: "web-hire-form",
        status: "new",
        whatsapp: enquiry.whatsapp,
        businessName: enquiry.businessName,
        need: enquiry.need,
        budget: enquiry.budget,
        details: enquiry.details,
        utm: enquiry.utm,
        page: enquiry.page,
        createdAt: FieldValue.serverTimestamp(),
        auth: {uid: request.auth?.uid || null},
      });
      logger.info("Hire enquiry saved", {docId: ref.id, need: enquiry.need});
      return {success: true};
    } catch (error) {
      logger.error("Failed to save hire enquiry", error);
      throw new HttpsError("internal", "Could not send your enquiry right now. Please try WhatsApp.");
    }
  },
);
