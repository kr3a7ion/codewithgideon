import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type SiteConfig = {
  contactHeading: string;
  contactSubheading: string;
  contactIntroTitle: string;
  contactIntroText: string;
  contactEmail: string;
  instagramUrl: string;
  instagramHandle: string;
  tiktokUrl: string;
  tiktokHandle: string;
  whatsappUrl: string;
  responseTime: string;
  supportTopics: string[];
  homepageCtaLabel: string;
  homepageCtaHref: string;
  apkDownloadUrl: string;
  apkDownloadLabel: string;
  apkDownloadSubLabel: string;
  /** YYYY-MM-DD shown on the home page as "next cohort starts …". Empty = "Enrolling now". */
  nextCohortDate: string;
};

export const defaultSiteConfig: SiteConfig = {
  contactHeading: "Contact Us",
  contactSubheading: "We'd love to hear from you.",
  contactIntroTitle: "Get in Touch",
  contactIntroText:
    "If you have questions about weekly billing, enrollment, or the CodeWithGideon app, feel free to reach out. We typically respond within 24 hours.",
  contactEmail: "codewithgideon.learn@gmail.com",
  instagramUrl: "https://www.instagram.com/c0dewithgideon",
  instagramHandle: "@c0dewithgideon",
  tiktokUrl: "https://www.tiktok.com/@codewithgideon",
  tiktokHandle: "@codewithgideon",
  whatsappUrl: "https://wa.me/message/NMQR2ZKNJTZBL1",
  responseTime: "Typically within 24 hours",
  supportTopics: ["Enrollment", "Billing", "App Access"],
  homepageCtaLabel: "Start Your Journey",
  homepageCtaHref: "#courses",
  apkDownloadUrl: "",
  apkDownloadLabel: "Download APK",
  apkDownloadSubLabel: "Direct Install",
  nextCohortDate: "",
};

const normalizeTopics = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((topic) => String(topic || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return defaultSiteConfig.supportTopics;
};

const textValue = (value: unknown, fallback: string) => {
  const text = String(value || "").trim();
  return text || fallback;
};

export const mergeSiteConfig = (data?: Record<string, unknown>): SiteConfig => {
  const raw = data || {};

  return {
    contactHeading: textValue(
      raw.contactHeading,
      defaultSiteConfig.contactHeading,
    ),
    contactSubheading: textValue(
      raw.contactSubheading,
      defaultSiteConfig.contactSubheading,
    ),
    contactIntroTitle: textValue(
      raw.contactIntroTitle,
      defaultSiteConfig.contactIntroTitle,
    ),
    contactIntroText: textValue(
      raw.contactIntroText,
      defaultSiteConfig.contactIntroText,
    ),
    contactEmail: textValue(raw.contactEmail, defaultSiteConfig.contactEmail),
    instagramUrl: textValue(raw.instagramUrl, defaultSiteConfig.instagramUrl),
    instagramHandle: textValue(
      raw.instagramHandle,
      defaultSiteConfig.instagramHandle,
    ),
    tiktokUrl: textValue(raw.tiktokUrl, defaultSiteConfig.tiktokUrl),
    tiktokHandle: textValue(raw.tiktokHandle, defaultSiteConfig.tiktokHandle),
    whatsappUrl: textValue(raw.whatsappUrl, defaultSiteConfig.whatsappUrl),
    responseTime: textValue(raw.responseTime, defaultSiteConfig.responseTime),
    supportTopics: normalizeTopics(raw.supportTopics),
    homepageCtaLabel: textValue(
      raw.homepageCtaLabel,
      defaultSiteConfig.homepageCtaLabel,
    ),
    homepageCtaHref: textValue(
      raw.homepageCtaHref,
      defaultSiteConfig.homepageCtaHref,
    ),
    apkDownloadUrl: textValue(
      raw.apkDownloadUrl,
      defaultSiteConfig.apkDownloadUrl,
    ),
    apkDownloadLabel: textValue(
      raw.apkDownloadLabel,
      defaultSiteConfig.apkDownloadLabel,
    ),
    apkDownloadSubLabel: textValue(
      raw.apkDownloadSubLabel,
      defaultSiteConfig.apkDownloadSubLabel,
    ),
    nextCohortDate: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.nextCohortDate || "").trim())
      ? String(raw.nextCohortDate).trim()
      : "",
  };
};

export const getSiteConfig = async (): Promise<SiteConfig> => {
  const snap = await getDoc(doc(db, "config", "app"));
  if (!snap.exists()) return defaultSiteConfig;
  return mergeSiteConfig(snap.data() as Record<string, unknown>);
};

export const saveSiteConfig = async (config: SiteConfig): Promise<void> => {
  const clean = mergeSiteConfig(config as unknown as Record<string, unknown>);

  await setDoc(
    doc(db, "config", "app"),
    {
      ...clean,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};
