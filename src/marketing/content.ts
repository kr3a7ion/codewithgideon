/**
 * Content for the public site: Learn (live cohorts), Hire (websites, apps and
 * systems) and the Portfolio as proof for both. Portfolio projects and Hire
 * packages live in Firestore (see catalog.ts); this file keeps the rest. Designs live in Figma:
 * https://www.figma.com/design/ANyVyXq9PfmTz1kxppwlJJ
 */

export const SITE_URL = "https://codewithgideon.com";

/**
 * WhatsApp: every button uses the "WhatsApp link" from Admin → Settings
 * (config/app.whatsappUrl), read through useContactLinks(). It's a WhatsApp
 * Business message link, which carries its own preset message, so pages
 * don't add per-button text.
 */
const env = import.meta.env as Record<string, string | undefined>;

/** Optional free-call link (Cal.com or Calendly). Falls back to WhatsApp. */
export const BOOKING_URL = (env.VITE_BOOKING_URL || "").trim();

// ---------------------------------------------------------------------------
// Hire
// ---------------------------------------------------------------------------

export type HireNeed = "landing" | "booking" | "mobile-app" | "web-app" | "other";

export const HIRE_NEEDS: { value: HireNeed; label: string }[] = [
  { value: "landing", label: "Landing page" },
  { value: "booking", label: "Booking site" },
  { value: "mobile-app", label: "Mobile app" },
  { value: "web-app", label: "Web app / system" },
  { value: "other", label: "Something else" },
];

export const HIRE_BUDGETS = [
  { value: "under-100k", label: "Under ₦100,000" },
  { value: "100k-200k", label: "₦100,000 – ₦200,000" },
  { value: "200k-400k", label: "₦200,000 – ₦400,000" },
  { value: "over-400k", label: "Over ₦400,000" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const HIRE_TERMS = [
  "60% to start, 40% before go-live",
  "Domain and hosting in your name",
  "Designed in Figma before the build",
];

export const PROCESS = [
  { title: "Chat", body: "Tell me about your business on WhatsApp. I'll reply with a plan and a fixed price." },
  { title: "Design", body: "I design your site in Figma and share the link. You comment, I adjust, and the build starts once you approve the design." },
  { title: "Build", body: "I build it to work fast on phones, then test every button, booking step and payment." },
  { title: "Launch", body: "Your site goes live on a domain in your name. The final 40% is due before go-live." },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export type Faq = { q: string; a: string };

export const LEARN_FAQ: Faq[] = [
  { q: "Do I need any experience?", a: "No. Beginner tracks start from zero. Intermediate tracks expect basic variables, loops and functions in any language." },
  { q: "Are classes recorded?", a: "Yes. Every live class is recorded and added to your dashboard after it ends, so you can catch up any time while you're an active learner." },
  { q: "What if I miss a class?", a: "Watch the recording, then ask your mentor or the student community about anything that wasn't clear." },
  { q: "Where do classes happen?", a: "Live and online. Each class has a join link in your student dashboard and in the CodeWithGideon app." },
];

export const JOIN_FAQ: Faq[] = [
  { q: "How do payments work?", a: "You pay by the week. Choose how many weeks to unlock and pay the weekly rate shown at sign-up, by card, transfer or USSD through Paystack." },
  { q: "Can I add more weeks later?", a: "Yes. Top up from your dashboard whenever you're ready for the next weeks." },
  { q: "Which path should I pick?", a: "Flutter and Web Development both start from zero: pick Flutter for mobile apps and Web for websites. AI-Assisted Development suits people who already code. Still unsure? Message Gideon on WhatsApp." },
  { q: "What's the refund policy?", a: "It's on the Refund Policy page, linked at the bottom of every page." },
];

export const HIRE_FAQ: Faq[] = [
  { q: "How much does a website or app cost?", a: "₦90,000 for a WhatsApp-first landing page and ₦180,000 for a booking website. Care after launch is ₦15,000 a month." },
  { q: "How long does it take?", a: "About 5 days for a landing page and 10 to 14 days for a booking site, counted from when you approve the design." },
  { q: "How do I pay?", a: "60% to start and 40% before the site goes live." },
  { q: "Who owns the domain and hosting?", a: "You do. Both are registered in your name, so you can move them any time." },
  { q: "Are Ìtura and Adire real businesses?", a: "No. They're sample projects that show exactly what you'd get. Open the live demos and try a booking yourself." },
  { q: "What if I need something different?", a: "Pick “Something else” in the form or message me on WhatsApp. You'll get a plan and a fixed quote." },
];
