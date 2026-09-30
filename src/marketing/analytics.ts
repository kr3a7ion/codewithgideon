/**
 * Google Analytics 4 through Firebase Analytics.
 *
 * Uses the existing VITE_FIREBASE_MEASUREMENT_ID, so there is nothing new to
 * configure. Page views come from GA4's enhanced measurement ("Page changes
 * based on browser history events", on by default), which also keeps the
 * utm_* tags on outreach links such as
 * ?utm_source=whatsapp&utm_campaign=leadscout. This module adds the events
 * that matter: which door people pick, demo opens, WhatsApp taps and leads.
 *
 * Analytics loads after the page is idle and never blocks rendering. Admin
 * and student pages are not tracked.
 */
import type { Analytics } from "firebase/analytics";

type Params = Record<string, string | number | boolean | undefined>;

let loading: Promise<Analytics | null> | null = null;
const queue: [string, Params][] = [];

const enabled = () =>
  typeof window !== "undefined" &&
  Boolean((import.meta.env as Record<string, string | undefined>).VITE_FIREBASE_MEASUREMENT_ID) &&
  !/^\/(admin|student)(\/|$)/.test(window.location.pathname);

function load(): Promise<Analytics | null> {
  if (!loading) {
    loading = (async () => {
      try {
        const [{ getAnalytics, isSupported, logEvent }, { app }] = await Promise.all([
          import("firebase/analytics"),
          import("../../services/firebase"),
        ]);
        if (!(await isSupported())) return null;
        const analytics = getAnalytics(app);
        for (const [name, params] of queue.splice(0)) logEvent(analytics, name, params);
        return analytics;
      } catch {
        return null;
      }
    })();
  }
  return loading;
}

const UTM_KEY = "cwg_utm";

/** Keep the first utm_* tags of the visit so an enquiry can say where it came from. */
function rememberUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 80);
    }
    if (Object.keys(utm).length && !sessionStorage.getItem(UTM_KEY)) sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    /* storage blocked: fine */
  }
}

export function getUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Start analytics once the browser is idle. Safe to call more than once. */
export function initAnalytics() {
  if (typeof window !== "undefined") rememberUtm();
  if (!enabled()) return;
  const start = () => void load();
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 4000 });
  else window.setTimeout(start, 1500);
}

/** Log a GA4 event. Queued until analytics has loaded; a no-op without it. */
export function track(name: string, params: Params = {}) {
  if (!enabled()) return;
  if (!loading) {
    queue.push([name, params]);
    void load();
    return;
  }
  void loading.then(async (analytics) => {
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, name, params);
  });
}

/** Where on the page a click happened, for event params. */
export type CtaLocation = "nav" | "hero" | "work" | "packages" | "cohorts" | "about" | "footer" | "case_study" | "hire" | "band" | "menu" | "faq";

export const trackCta = (cta: string, location: CtaLocation) => track("cta_click", { cta, location });
export const trackWhatsApp = (location: CtaLocation) => track("whatsapp_click", { location });
export const trackDemo = (project: string, location: CtaLocation) => track("demo_open", { project, location });
