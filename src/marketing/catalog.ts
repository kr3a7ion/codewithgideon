/**
 * Portfolio projects and Hire packages, edited in Admin → Portfolio and
 * Admin → Packages. The public pages read them from Firestore; until Gideon
 * imports the starter content (or if Firestore can't be reached), the
 * built-in starters below are shown instead.
 */

// ---------------------------------------------------------------------------
// Hire packages
// ---------------------------------------------------------------------------

export type PackageTrack = "website" | "app";
export type PriceMode = "fixed" | "from" | "quote";

/** What the enquiry form pre-selects for a package. Must exist in HIRE_NEEDS. */
export type PackageNeed = "landing" | "booking" | "mobile-app" | "web-app" | "other";

export type HirePackage = {
  id: string;
  track: PackageTrack;
  name: string;
  description: string;
  /** Naira. Ignored when priceMode is "quote". */
  price: number;
  priceMode: PriceMode;
  /** e.g. "one-off", "per month". */
  priceNote: string;
  timeline: string;
  includes: string[];
  featured: boolean;
  badge: string;
  cta: string;
  need: PackageNeed;
  published: boolean;
  order: number;
};

export const naira = (n: number) => `₦${Math.round(Number(n) || 0).toLocaleString("en-NG")}`;

/** "₦90,000", "From ₦300,000" or "Custom quote". */
export const packagePrice = (p: Pick<HirePackage, "price" | "priceMode">) =>
  p.priceMode === "quote" || !(p.price > 0) ? "Custom quote" : p.priceMode === "from" ? `From ${naira(p.price)}` : naira(p.price);

/** FAQ answer for "How much does it cost?", built from the live packages. */
export const priceAnswer = (packages: HirePackage[]) => {
  const parts = packages
    .filter((p) => p.track === "website")
    .map((p) => `${p.name}: ${packagePrice(p)}${p.priceMode !== "quote" && p.priceNote ? ` ${p.priceNote}` : ""}`);
  const apps = packages.some((p) => p.track === "app");
  return [parts.length ? `${parts.join(". ")}.` : "", apps ? "Apps and business systems are quoted for what you need." : ""]
    .filter(Boolean)
    .join(" ");
};

/** Swaps the price answer in an FAQ list for one built from the live packages. */
export const withLivePrices = <F extends { q: string; a: string }>(faq: F[], packages: HirePackage[]) =>
  faq.map((f) => (/^how much/i.test(f.q) ? { ...f, a: priceAnswer(packages) || f.a } : f));

export const PACKAGE_STARTERS: HirePackage[] = [
  {
    id: "landing",
    track: "website",
    name: "WhatsApp-first landing page",
    description: "One fast page that sends every visitor straight to your WhatsApp.",
    price: 90000,
    priceMode: "fixed",
    priceNote: "one-off",
    timeline: "5 days",
    includes: ["Your services, prices, photos and location", "A WhatsApp button on every section", "Built for phones first, quick on slow networks"],
    featured: false,
    badge: "",
    cta: "Choose this",
    need: "landing",
    published: true,
    order: 1,
  },
  {
    id: "booking",
    track: "website",
    name: "Direct-booking website",
    description: "Customers pick a date or slot, pay a deposit and get confirmed on WhatsApp.",
    price: 180000,
    priceMode: "fixed",
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
    need: "booking",
    published: true,
    order: 2,
  },
  {
    id: "care",
    track: "website",
    name: "Care plan",
    description: "I look after the site after launch so it keeps working and stays up to date.",
    price: 15000,
    priceMode: "fixed",
    priceNote: "per month",
    timeline: "Ongoing",
    includes: ["Hosting and domain admin", "Updates to keep the site running", "Small edits to text, prices and photos"],
    featured: false,
    badge: "",
    cta: "Add after launch",
    need: "other",
    published: true,
    order: 3,
  },
  {
    id: "mobile-app",
    track: "app",
    name: "Mobile app",
    description: "An Android and iPhone app built with Flutter, from design to the Play Store.",
    price: 0,
    priceMode: "quote",
    priceNote: "",
    timeline: "Depends on the features",
    includes: [
      "Designed in Figma before the build",
      "Sign-in, payments and notifications as needed",
      "Publishing to the Play Store (and App Store)",
    ],
    featured: false,
    badge: "",
    cta: "Talk about your app",
    need: "mobile-app",
    published: true,
    order: 4,
  },
  {
    id: "web-app",
    track: "app",
    name: "Web app or business system",
    description: "Dashboards, booking systems and tools that run your business, online or on your office network.",
    price: 0,
    priceMode: "quote",
    priceNote: "",
    timeline: "Depends on the features",
    includes: [
      "Staff logins with the right access for each role",
      "Reports and records you can export",
      "Works offline on a local network if you need it",
    ],
    featured: false,
    badge: "",
    cta: "Talk about your system",
    need: "web-app",
    published: true,
    order: 5,
  },
];

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export type ProjectType = "website" | "mobile" | "webapp" | "desktop";
export type Ownership = "own" | "client" | "demo";
export type ProjectStatus = "live" | "building" | "demo";

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "mobile", label: "Mobile app" },
  { value: "webapp", label: "Web app / platform" },
  { value: "desktop", label: "Desktop / office system" },
];
export const OWNERSHIP_LABEL: Record<Ownership, string> = { own: "My product", client: "Client project", demo: "Sample project" };
export const STATUS_LABEL: Record<ProjectStatus, string> = { live: "Live", building: "In development", demo: "Live demo" };

export type ProjectImage = { url: string; smUrl?: string; alt: string; caption?: string };

export type Project = {
  id: string;
  /** URL part: /portfolio/<slug>. */
  slug: string;
  title: string;
  /** Short label shown on cards, e.g. "Shortlet booking website". */
  kind: string;
  types: ProjectType[];
  ownership: Ownership;
  status: ProjectStatus;
  /** One or two sentences for cards. */
  summary: string;
  /** "Built for …" or the problem it solves. */
  brief: string;
  role: string;
  year: string;
  features: string[];
  tech: string[];
  links: { live?: string; demo?: string; playStore?: string; appStore?: string; github?: string };
  cover: ProjectImage | null;
  gallery: ProjectImage[];
  /** Hire package to suggest on the case study ("Want one like this?"). */
  packageId?: string;
  /** Course to suggest ("Learn to build this"). */
  learnHref?: string;
  featured: boolean;
  published: boolean;
  order: number;
};

const demoImg = (slug: string, alt: string) => ({
  cover: { url: `/work/${slug}-cover.webp`, smUrl: `/work/${slug}-cover-960.webp`, alt },
  gallery: [
    { url: `/work/${slug}-desktop.webp`, alt: `${alt}: desktop`, caption: "On a laptop" },
    { url: `/work/${slug}-mobile.webp`, alt: `${alt}: phone`, caption: "On a phone" },
  ],
});

const DEMOS = (import.meta.env?.VITE_DEMOS_BASE_URL || "https://demos.codewithgideon.com").replace(/\/+$/, "");

export const PROJECT_STARTERS: Project[] = [
  {
    id: "codewithgideon",
    slug: "codewithgideon",
    title: "CodeWithGideon",
    kind: "Online school: website, dashboards and app",
    types: ["webapp", "mobile"],
    ownership: "own",
    status: "live",
    summary: "The platform behind my live coding classes: sign-up and weekly payments, a student dashboard with class recordings, an admin for running cohorts, and a Flutter app.",
    brief:
      "I needed one place where students sign up, pay week by week, join live classes, rewatch recordings and ask questions, and where I can run every cohort without spreadsheets.",
    role: "Design, build and run: web, mobile app and backend",
    year: "2026",
    features: [
      "Sign-up and checkout, paying week by week through Paystack",
      "Student dashboard with live-class links and recordings that play in the page",
      "Watch progress, badges, resources and mentor chat with screenshots",
      "Admin for cohorts, classes, payments, students and site content",
      "Class reminders and payment checks that run automatically",
      "A Flutter app with the same classes, recordings and chat",
    ],
    tech: ["React", "TypeScript", "Tailwind CSS", "Firebase", "Cloud Functions", "Paystack", "Flutter"],
    links: { live: "https://codewithgideon.com" },
    cover: null,
    gallery: [],
    learnHref: "/courses",
    featured: true,
    published: true,
    order: 1,
  },
  {
    id: "nexura",
    slug: "nexura",
    title: "Nexura",
    kind: "Hotel management system",
    types: ["webapp", "desktop"],
    ownership: "own",
    status: "building",
    summary: "A hotel management system that runs on a small computer in the hotel and keeps working without internet: rooms, guests, money, night audit and fleet.",
    brief:
      "Hotels lose money and records when software depends on a shaky internet line. Nexura runs on the hotel's own network, with every naira tracked in an append-only ledger.",
    role: "Product owner and developer",
    year: "2026",
    features: [
      "Works offline on the hotel's own network",
      "Money stored exactly (in kobo) with an append-only ledger",
      "Night audit and database migrations built in",
      "Fleet: dispatch, trips, drivers, vehicles, fuel and generator diesel",
      "Planned as a ready-to-use box: a mini PC with the software installed",
    ],
    tech: ["Node.js", "TypeScript", "SQLite", "pnpm monorepo", "Designed in Figma"],
    links: {},
    cover: null,
    gallery: [],
    packageId: "web-app",
    featured: true,
    published: true,
    order: 2,
  },
  {
    id: "betastudy",
    slug: "betastudy",
    title: "BetaStudy",
    kind: "Exam-prep mobile app",
    types: ["mobile"],
    ownership: "client",
    status: "live",
    summary: "A Flutter exam-prep app for a client, now on the Play Store: practice questions with spaced repetition, Google Sign-In and in-app purchases.",
    brief: "Built the mobile app for a client's exam-prep product. Their team runs the backend; I built and shipped the Flutter app.",
    role: "Flutter developer",
    year: "2026",
    features: [
      "Practice with spaced repetition",
      "Google Sign-In",
      "In-app purchases that follow Play Store rules",
      "Release builds, signing and Play Store publishing",
    ],
    tech: ["Flutter", "Riverpod", "Google Sign-In", "REST API"],
    links: {},
    cover: null,
    gallery: [],
    packageId: "mobile-app",
    learnHref: "/courses/flutter-mobile-app-development",
    featured: true,
    published: true,
    order: 3,
  },
  {
    id: "itura",
    slug: "itura",
    title: "Ìtura Suites",
    kind: "Shortlet booking website",
    types: ["website"],
    ownership: "demo",
    status: "demo",
    summary: "Guests pick dates on a live calendar, pay a 30% deposit and get their door code on WhatsApp.",
    brief:
      "Abuja shortlet hosts lose bookings, and pay platform fees, when guests can only enquire by phone or through Airbnb. Ìtura shows how a host can take direct bookings with a deposit.",
    role: "Design and build",
    year: "2026",
    features: [
      "A homepage with the apartments, amenities, location and FAQs",
      "A live availability calendar where booked nights can't be selected",
      "A price that updates as you go: nights, cleaning fee, total and 30% deposit",
      "Checkout by bank transfer, card or USSD (Paystack on a live site)",
      "A WhatsApp confirmation with the booking reference",
    ],
    tech: ["React", "TypeScript", "Tailwind CSS", "Designed in Figma first"],
    links: { demo: `${DEMOS}/itura/` },
    ...demoImg("itura", "Ìtura Suites booking website"),
    packageId: "booking",
    learnHref: "/courses/web-development-wordpress",
    featured: false,
    published: true,
    order: 4,
  },
  {
    id: "adire",
    slug: "adire",
    title: "Adire Hair Studio",
    kind: "Salon booking website",
    types: ["website"],
    ownership: "demo",
    status: "demo",
    summary: "Clients choose a style, stylist and time slot, then hold it with a ₦5,000 deposit or book on WhatsApp.",
    brief:
      "Busy salons handle bookings in WhatsApp chats and lose slots to no-shows. Adire shows styles and prices up front, and uses a small deposit to hold each slot.",
    role: "Design and build",
    year: "2026",
    features: [
      "Styles and prices for 13 services",
      "Multi-service booking, with the total time and price added up",
      "A choice of stylist",
      "Real time slots that respect opening hours and how long each style takes",
      "A ₦5,000 deposit, or book on WhatsApp and pay at the salon",
    ],
    tech: ["React", "TypeScript", "Tailwind CSS", "Designed in Figma first"],
    links: { demo: `${DEMOS}/adire/` },
    ...demoImg("adire", "Adire Hair Studio booking website"),
    packageId: "booking",
    learnHref: "/courses/web-development-wordpress",
    featured: false,
    published: true,
    order: 5,
  },
  {
    id: "facilityflow",
    slug: "facilityflow",
    title: "FacilityFlow",
    kind: "Maintenance and facility system",
    types: ["desktop", "webapp"],
    ownership: "own",
    status: "building",
    summary: "Runs a maintenance department on the office network: shifts, jobs, generator and diesel, apartments and costs, with no internet needed.",
    brief: "Maintenance teams track jobs, shifts and diesel on paper. FacilityFlow puts it on one office PC that technicians reach from their phones.",
    role: "Product owner and developer",
    year: "2026",
    features: [
      "Role-based logins for technicians, supervisors, admin and finance",
      "Flexible shift roster and attendance",
      "Job assignment with supervisor follow-up",
      "Generator and diesel tracking",
      "Apartment registry and department budget",
    ],
    tech: ["Electron", "TypeScript", "SQLite", "Local network server"],
    links: {},
    cover: null,
    gallery: [],
    packageId: "web-app",
    featured: false,
    published: false,
    order: 6,
  },
  {
    id: "daybook",
    slug: "daybook",
    title: "Day Book",
    kind: "Access records desktop app",
    types: ["desktop"],
    ownership: "client",
    status: "live",
    summary: "A desktop app that reads a property's door-lock records and turns them into daily sealed reports, for a 114-apartment serviced residence.",
    brief: "The lock system's own software kept records in an old database format. Day Book reads it, archives each day and produces reports the front office can trust.",
    role: "Design and build",
    year: "2026",
    features: [
      "Reads the lock system's database directly",
      "Daily archive with sealed reports",
      "Handles large imports without freezing",
      "Installer and licence keys",
    ],
    tech: ["Electron", "React", "TypeScript", "SQLite (WebAssembly)"],
    links: {},
    cover: null,
    gallery: [],
    packageId: "web-app",
    featured: false,
    published: false,
    order: 7,
  },
];

export const projectTypeLabel = (t: ProjectType) => PROJECT_TYPES.find((x) => x.value === t)?.label || t;
