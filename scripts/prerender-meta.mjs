/**
 * After `vite build`: write a copy of dist/index.html per public route with
 * that route's title, description and social image in the <head>.
 *
 * WhatsApp, Facebook and X don't run JavaScript, so without this every shared
 * link would preview as the home page. With `cleanUrls` in firebase.json,
 * Hosting serves dist/work/itura.html for /work/itura; the React app then
 * boots as usual. Keep these in step with the usePageMeta() calls.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ORIGIN = "https://codewithgideon.com";
const SITE = "Code with Gideon";
const dist = join(process.cwd(), "dist");

const routes = [
  {
    path: "/work",
    title: "Work",
    description:
      "Sample booking websites built end to end by Gideon: Ìtura Suites (shortlet) and Adire Hair Studio (salon). Try the live demos and read how each one works.",
    image: "/work/itura-og.jpg",
  },
  {
    path: "/work/itura",
    title: "Ìtura Suites: Shortlet booking website",
    description:
      "Guests pick dates on a live calendar, pay a 30% deposit and get their door code on WhatsApp. A sample project by Gideon, with a live demo you can try.",
    image: "/work/itura-og.jpg",
  },
  {
    path: "/work/adire",
    title: "Adire Hair Studio: Salon booking website",
    description:
      "Clients choose a style, stylist and time slot, then hold it with a ₦5,000 deposit or book on WhatsApp. A sample project by Gideon, with a live demo you can try.",
    image: "/work/adire-og.jpg",
  },
  {
    path: "/hire",
    title: "Hire Gideon: websites that take bookings",
    description:
      "WhatsApp-first landing pages from ₦90,000 and booking websites for ₦180,000, designed in Figma first. The domain and hosting stay in your name.",
    image: "/work/adire-og.jpg",
  },
  {
    path: "/courses",
    title: "Courses",
    description:
      "Choose a learning path: Flutter mobile apps, web development & WordPress, or AI-assisted development. Live cohorts with a mentor.",
    image: "/og-default.jpg",
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const setTag = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`));

const base = readFileSync(join(dist, "index.html"), "utf8");

for (const r of routes) {
  const title = `${r.title} | ${SITE}`;
  const url = `${ORIGIN}${r.path}`;
  const image = `${ORIGIN}${r.image}`;
  let html = base;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(r.description)}" />`);
  html = setTag(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(r.description)}" />`);
  html = setTag(html, /<meta\s+property="og:image"\s[\s\S]*?\/>/, `<meta property="og:image" content="${image}" />`);
  html = setTag(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta\s+name="twitter:image"[\s\S]*?\/>/, `<meta name="twitter:image" content="${image}" />`);
  html = setTag(html, /<link\s+rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`);
  const out = join(dist, `${r.path.slice(1)}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`prerender-meta: ${r.path} -> ${out.replace(process.cwd() + "/", "")}`);
}
