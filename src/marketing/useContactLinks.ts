import { useSiteConfig } from "../../hooks/useSiteConfig";
import { BOOKING_URL } from "./content";

/**
 * Contact links for the public site, from Admin → Settings:
 * - whatsapp: the WhatsApp link (a WhatsApp Business message link)
 * - bookCall: VITE_BOOKING_URL if set, otherwise WhatsApp
 */
export const useContactLinks = () => {
  const { config } = useSiteConfig();
  return {
    whatsapp: config.whatsappUrl,
    bookCall: BOOKING_URL || config.whatsappUrl,
    email: config.contactEmail,
    apk: config.apkDownloadUrl,
    nextCohortDate: config.nextCohortDate,
    responseTime: config.responseTime,
  };
};

/**
 * "3 Nov" for an upcoming cohort start date (YYYY-MM-DD from Admin →
 * Settings → Home page). Returns null when unset, invalid or already past,
 * so a stale date never shows on the site.
 */
export const upcomingCohortLabel = (iso: string, now: Date = new Date()): string | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  if (!m) return null;
  const start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(start.getTime()) || start.getMonth() !== Number(m[2]) - 1) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (start < today) return null;
  const sameYear = start.getFullYear() === today.getFullYear();
  return start.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
};

/** Copy text for the visitor to paste into WhatsApp. Best effort. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
