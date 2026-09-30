/**
 * Content for the public "Learn · Work · Hire" site.
 *
 * One brand, two doors: Learn (live cohorts) and Hire (websites for
 * businesses). Work is the proof for both. Designs live in Figma:
 * https://www.figma.com/design/ANyVyXq9PfmTz1kxppwlJJ
 */

export const SITE_URL = "https://codewithgideon.com";

/** Gideon's business WhatsApp (international format, digits only). */
export const WHATSAPP_NUMBER = "2349056277492";
export const WHATSAPP_DISPLAY = "+234 905 627 7492";

export const WHATSAPP_MESSAGES = {
  hire: "Hi Gideon, I'd like a website for my business.",
  call: "Hi Gideon, I'd like to book a quick call.",
  general: "Hi Gideon, I have a question.",
} as const;

export const whatsappLink = (text: string = WHATSAPP_MESSAGES.hire) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

const env = import.meta.env as Record<string, string | undefined>;

/**
 * Where the demo sites live. Point demos.codewithgideon.com at the Netlify
 * site (see DEPLOY_RUNBOOK.md), or set VITE_DEMOS_BASE_URL to another host.
 */
export const DEMOS_BASE_URL = (env.VITE_DEMOS_BASE_URL || "https://demos.codewithgideon.com").replace(/\/+$/, "");

/** Optional free-call link (Cal.com or Calendly). Falls back to WhatsApp. */
export const BOOKING_URL = (env.VITE_BOOKING_URL || "").trim();

export const bookCallHref = () => BOOKING_URL || whatsappLink(WHATSAPP_MESSAGES.call);

export type WorkSlug = "itura" | "adire";

export type WorkEntry = {
  slug: WorkSlug;
  name: string;
  type: string;
  result: string;
  demoPath: string;
  images: {
    card: string;
    cover: string;
    cover960: string;
    og: string;
    desktop: string;
    mobile: string;
    alt: string;
  };
  brief: string;
  features: string[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  builtWith: string[];
  pkg: {
    name: string;
    price: string;
    timeline: string;
    note?: string;
    includes: string[];
    need: HireNeed;
  };
  learn: { href: string; label: string };
};

const images = (slug: WorkSlug, alt: string) => ({
  card: `/work/${slug}-card.webp`,
  cover: `/work/${slug}-cover.webp`,
  cover960: `/work/${slug}-cover-960.webp`,
  og: `/work/${slug}-og.jpg`,
  desktop: `/work/${slug}-desktop.webp`,
  mobile: `/work/${slug}-mobile.webp`,
  alt,
});

const WEB_COHORT = "/courses/web-development-wordpress";

export const WORK: WorkEntry[] = [
  {
    slug: "itura",
    name: "Ìtura Suites",
    type: "Shortlet booking website",
    result:
      "Guests pick dates on a live calendar, pay a 30% deposit and get their door code on WhatsApp.",
    demoPath: "itura/",
    images: images("itura", "Ìtura Suites booking website on a laptop and a phone"),
    brief:
      "Abuja shortlet hosts lose bookings, and pay platform fees, when guests can only enquire by phone or through Airbnb. Ìtura shows how a host can take direct bookings with a deposit.",
    features: [
      "A homepage with the apartments, amenities, location and FAQs",
      "A live availability calendar where booked nights can't be selected",
      "A price that updates as you go: nights, cleaning fee, total and 30% deposit",
      "Checkout by bank transfer, card or USSD (Paystack on a live site)",
      "A WhatsApp confirmation with the booking reference",
      "A layout that works as a phone app and as a desktop page",
    ],
    stepsTitle: "How a guest books",
    steps: [
      { title: "Pick dates", body: "Choose check-in and check-out on the live calendar. Booked nights can't be picked." },
      { title: "Pay the 30% deposit", body: "By bank transfer, card or USSD. The total and the deposit update as you go." },
      { title: "Get the door code on WhatsApp", body: "A WhatsApp message confirms the booking with its reference and the door code." },
    ],
    builtWith: ["React", "TypeScript", "Tailwind CSS", "Designed in Figma first"],
    pkg: {
      name: "Direct-booking website",
      price: "₦180,000",
      timeline: "10–14 days",
      includes: [
        "A site like this with your own apartments, photos and prices",
        "Deposits by transfer, card or USSD through Paystack",
        "The domain and hosting in your name",
      ],
      need: "booking",
    },
    learn: { href: WEB_COHORT, label: "Web development cohort" },
  },
  {
    slug: "adire",
    name: "Adire Hair Studio",
    type: "Salon booking website",
    result:
      "Clients choose a style, stylist and time slot, then hold it with a ₦5,000 deposit or book on WhatsApp.",
    demoPath: "adire/",
    images: images("adire", "Adire Hair Studio booking website on a laptop and a phone"),
    brief:
      "Busy salons handle bookings in WhatsApp chats and lose slots to no-shows. Adire shows styles and prices up front, and uses a small deposit to hold each slot.",
    features: [
      "Styles and prices for 13 services",
      "Multi-service booking, with the total time and price added up",
      "A choice of stylist",
      "Real time slots that respect opening hours and how long each style takes",
      "A ₦5,000 deposit, or book on WhatsApp and pay at the salon",
      "Hours and directions",
    ],
    stepsTitle: "How a client books",
    steps: [
      { title: "Choose a style", body: "Browse the services with prices and times. Add more than one and the totals add up." },
      { title: "Pick a stylist and time", body: "Only real free slots show, based on opening hours and how long each style takes." },
      { title: "Pay the deposit, or confirm on WhatsApp", body: "Hold the slot with ₦5,000, or send the booking on WhatsApp and pay at the salon." },
    ],
    builtWith: ["React", "TypeScript", "Tailwind CSS", "Designed in Figma first"],
    pkg: {
      name: "Booking website",
      price: "₦180,000",
      timeline: "10–14 days",
      note: "A WhatsApp-first landing page without booking is ₦90,000.",
      includes: [
        "A site like this with your own services, stylists and prices",
        "Deposits by transfer, card or USSD through Paystack",
        "The domain and hosting in your name",
      ],
      need: "booking",
    },
    learn: { href: WEB_COHORT, label: "Web development cohort" },
  },
];

export const findWork = (slug?: string) => WORK.find((w) => w.slug === slug);

export const demoUrl = (w: WorkEntry) => `${DEMOS_BASE_URL}/${w.demoPath}`;

// ---------------------------------------------------------------------------
// Hire
// ---------------------------------------------------------------------------

export type HireNeed = "landing" | "booking" | "other";

export const HIRE_NEEDS: { value: HireNeed; label: string }[] = [
  { value: "landing", label: "Landing page" },
  { value: "booking", label: "Booking site" },
  { value: "other", label: "Something else" },
];

export const HIRE_BUDGETS = [
  { value: "under-100k", label: "Under ₦100,000" },
  { value: "100k-200k", label: "₦100,000 – ₦200,000" },
  { value: "200k-400k", label: "₦200,000 – ₦400,000" },
  { value: "over-400k", label: "Over ₦400,000" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export type Package = {
  id: "landing" | "booking" | "care";
  name: string;
  description: string;
  price: string;
  priceNote: string;
  timeline: string;
  includes: string[];
  featured?: boolean;
  badge?: string;
  cta: string;
};

export const PACKAGES: Package[] = [
  {
    id: "landing",
    name: "WhatsApp-first landing page",
    description: "One fast page that sends every visitor straight to your WhatsApp.",
    price: "₦90,000",
    priceNote: "one-off",
    timeline: "5 days",
    includes: [
      "Your services, prices, photos and location",
      "A WhatsApp button on every section",
      "Built for phones first, quick on slow networks",
    ],
    cta: "Choose this",
  },
  {
    id: "booking",
    name: "Direct-booking website",
    description: "Customers pick a date or slot, pay a deposit and get confirmed on WhatsApp.",
    price: "₦180,000",
    priceNote: "one-off",
    timeline: "10–14 days",
    includes: [
      "Everything in the landing page",
      "A live calendar or real time slots",
      "Deposits by transfer, card or USSD (Paystack)",
      "A WhatsApp confirmation with a booking reference",
    ],
    featured: true,
    badge: "Like Ìtura and Adire",
    cta: "Start a booking site",
  },
  {
    id: "care",
    name: "Care plan",
    description: "I look after the site after launch so it keeps working and stays up to date.",
    price: "₦15,000",
    priceNote: "per month",
    timeline: "Ongoing",
    includes: ["Hosting and domain admin", "Updates to keep the site running", "Small edits to text, prices and photos"],
    cta: "Add after launch",
  },
];

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
  { q: "How do payments work?", a: "You pay by the week. Choose how many weeks to unlock and pay the weekly rate shown at sign-up. Paystack may add a small gateway charge." },
  { q: "What if I miss a class?", a: "Watch the recording, then ask your mentor or the student community about anything that wasn't clear." },
];

export const HIRE_FAQ: Faq[] = [
  { q: "How much does a website cost?", a: "₦90,000 for a WhatsApp-first landing page and ₦180,000 for a booking website. Care after launch is ₦15,000 a month." },
  { q: "How long does it take?", a: "About 5 days for a landing page and 10 to 14 days for a booking site, counted from when you approve the design." },
  { q: "How do I pay?", a: "60% to start and 40% before the site goes live." },
  { q: "Who owns the domain and hosting?", a: "You do. Both are registered in your name, so you can move them any time." },
  { q: "Are Ìtura and Adire real businesses?", a: "No. They're sample projects that show exactly what you'd get. Open the live demos and try a booking yourself." },
  { q: "What if I need something different?", a: "Pick “Something else” in the form or message me on WhatsApp. You'll get a plan and a fixed quote." },
];
