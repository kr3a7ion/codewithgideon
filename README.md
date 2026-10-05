<div align="center">
<img width="1200" height="630" alt="CodeWithGideon: learn to build it, or have it built" src="public/og-default.jpg" />
</div>


# CodeWithGideon

> A modern EdTech platform for student enrollment, payments, cohort management, and live class access.

CodeWithGideon is a full-stack learning platform that allows students to register, pay for courses, join instructor-led cohorts, and access their classes through a structured dashboard.

Administrators can manage courses, sessions, students, payments, mobile mentor chats, support messages, resources, community spaces, and public site settings through a routed admin dashboard.

---

# Platform Overview

CodeWithGideon solves several common problems with online tech education:

- Students often get lost in endless tutorials
- Course access is usually disorganized
- Admins struggle to manage payments and student access

This platform provides:

- Structured **cohort based learning**
- **Instructor-led sessions**
- **Live class access**
- **Session scheduling**
- **Payment verification**
- **Admin student management**
- **Mentor chat and student community access**
- **Admin-managed public course and contact content**

---

# Public site: Learn · Work · Hire

One brand, two doors. **Learn** is the live cohort classes, **Hire** is Gideon
building websites for businesses, and **Work** is the proof for both.
Designs: [Figma rebrand file](https://www.figma.com/design/ANyVyXq9PfmTz1kxppwlJJ)
(brand, components, and every page at 1440 and 390).

| Route | Page |
|---|---|
| `/` | Hero with two equal doors; Learn block (courses, how it works, the app); Hire block (sample work, packages); meet your teacher (`#about`); FAQ; two-door band |
| `/courses`, `/courses/:slug` | Learn (course data from Admin → Courses), with "See what you'll build" |
| `/work` | Portfolio grid (sample projects) |
| `/work/:slug` | Case study: brief, features, steps, screens, "What you'd get", three calls to action |
| `/hire` | Packages, process, proof, enquiry form (`#enquire`, `?need=landing\|booking\|other`), FAQ |

- Content (work entries, packages, FAQs) lives in `src/marketing/content.ts`;
  the building blocks are in `src/marketing/ui.tsx`.
- Brand name: **CodeWithGideon**, one word. The official logo is in
  `src/marketing/logo.tsx` (React) and `public/brand/` (SVG files: mark, lockup,
  stacked lockup and app icon, each for light and dark backgrounds). Logo teal
  `#1FBEC3` is for the logo only; UI teal stays `teal-600`.
- Set from Admin → Settings, no deploy needed:
  - **WhatsApp link** (Contact page group) is used by every WhatsApp button on
    the site. It's a WhatsApp Business message link, so buttons can't prefill
    text; the Hire form copies the visitor's details for them to paste.
  - **Next cohort start date** (Home page group) shows "Enrolling now · next
    cohort starts …" above the home page courses and hides itself once the
    date passes.
  - Which courses appear on the home page: Admin → Courses → "On home page".
- Colours: navy is the brand, **teal = Learn**, **orange = Hire**, warm `paper`
  for section backgrounds (`tailwind.config.js`).
- Demo sites are linked, not rebuilt: `VITE_DEMOS_BASE_URL` (default
  `https://demos.codewithgideon.com`). Optional `VITE_BOOKING_URL` (Cal.com or
  Calendly) makes "Book a call" open that instead of WhatsApp.
- Social previews: `npm run build` runs `scripts/prerender-meta.mjs`, which
  writes `dist/work.html`, `dist/work/itura.html` and so on with each page's
  title and image, because WhatsApp doesn't run JavaScript. `cleanUrls` in
  `firebase.json` serves them.
- Analytics: GA4 through Firebase Analytics (`VITE_FIREBASE_MEASUREMENT_ID`),
  loaded when the browser is idle (straight away for tagged links) and paused on `/admin` and `/student`. Events:
  `cta_click`, `demo_open`, `whatsapp_click`, `generate_lead`. UTM tags on
  outreach links (`?utm_source=whatsapp&utm_campaign=leadscout`) are kept and
  saved with any enquiry.

---

# Key Features

## Student Features

### Joining (3 steps)

Sign-up, checkout and the student area have their own slim layout, outside
the marketing header and footer (Figma pages 08 and 09).

1. **Account** (`/register`): Google, or email and password. The course the
   student picked on a course page is remembered in `localStorage`
   (`cwg_join_course`), so it survives a reload or the verification link
   opening a new tab.
2. **Check your email** (`/student/verify-email`): checks every few seconds
   while the tab is open and moves on by itself once the email is confirmed.
3. **Your details and weeks** (`/student/register`): name, WhatsApp number,
   age range and gender (no preselected answers), course and weeks picker
   with a live order summary. "Save and finish later" keeps the details.
4. **Review and pay** (`/student/payment`): Paystack pop-up. The page shows
   "Confirming your payment" while the server checks it, then **You're in**
   with the next class, the app link and mentor chat.

A payment Paystack received but the server couldn't credit (`needs_review`)
shows **"We're confirming your payment"** everywhere, with no way to pay
again, until the admin marks it handled. This is read from
`users/{uid}/payments`, so it needs no extra fields on the profile.

### Student area (`/student/*`)

A sidebar on desktop; a header and bottom tabs (Home, Classes, Chat,
Updates, More) on phones.

- **Home**: the live or next class (Join from 15 minutes before; Add to
  calendar otherwise), coming up, recordings to catch up on, this week's
  resources, weeks unlocked, the latest mentor reply and updates. It has
  three states: active, payment pending, and checking payment.
- **Classes**: Upcoming, Recordings and All tabs, grouped by week, with
  "Add classes to my calendar" (.ics, or Google Calendar on Android).
- **Mentor chat**: questions can name the class they're about.
- **Resources** (search and week filter), **Updates**, **Community**,
  **Badges**.
- **Payments & account**: weeks, payment history with printable receipts,
  edit name and WhatsApp number, dark mode, sign out. **Add weeks** opens a
  dialog and goes straight to Paystack.

Locked weeks never show class titles: students can only read the weeks they
paid for.

---

## Admin Features

The admin area (`/admin`) works on a phone and a computer: a grouped
sidebar on desktop, bottom tabs plus a "More" sheet on phones.

| Page | What it's for |
|---|---|
| **Today** | What needs attention (unfinished checkouts, payments to review, unread chats and website messages, classes without recordings, intakes without classes), the live or next class with its link, key numbers, automation status |
| **Students** | Search and filter everyone; a student panel with contact links (email, phone, WhatsApp), enrolment, pending checkout, payment history and actions |
| **Payments** | Unfinished checkouts with **Check with Paystack**, the needs-review queue, recent payments |
| **Inbox** | Student chats (app + website) and contact-form messages in one place |
| **Classes** | The schedule per cohort (Upcoming, Past, Drafts), quick recording links, **Generate schedule** from the course syllabus, **Copy schedule** from another cohort |
| **Cohorts** | The open intake per path and one-click **Start next intake** |
| **Announcements** | Messages to a cohort (students see them under Updates) |
| **Courses & paths**, **Resources**, **Community** | What students can sign up for and the material around it |
| **Settings** | Website content (next cohort date, APK link, contact page and the site-wide WhatsApp link, socials), Google Sheets, CSV export, delete-all (typed confirmation) |

### Automations

- **Payment auto-check** (`reconcilePendingPayments`, every 30 min): asks
  Paystack about checkouts that never reached verify or the webhook,
  credits the paid ones and clears abandoned ones after a day.
- **Check with Paystack** (`adminCheckPayment`): the same check for one
  checkout, from the admin area. Replaces checking the Paystack dashboard
  by hand.
- **Class reminders** (`sendClassReminders`, every 15 min): posts a cohort
  announcement about an hour before each published class.
- **Generate / copy schedules** and **start next intake** run in the admin
  area.

---

## Session Management

Admins can create sessions with:

- title
- week number
- cohort
- schedule date
- time
- join URL
- notes

Students automatically see sessions once they are published.

---

## Payment System

The platform supports Paystack payment verification.

Workflow:

1. Student registers
2. Student initiates payment
3. Payment is verified via Firebase Cloud Functions
4. Student access is unlocked
5. Sessions become visible

Checkouts that never reach verify or the webhook are checked with Paystack
automatically every 30 minutes, or on demand with **Check with Paystack** in
the admin area. A manual credit is still available for payments made outside
Paystack.

---

# Contact And Mentor Chat

The platform includes a secure website contact system and a separate in-app mentor chat flow.

Features:

- Contact form submission
- Server side validation via Firebase Cloud Function
- Messages stored in Firestore
- Admin inbox modal for reading messages
- Student mentor chat stored in `mentorThreads/{threadId}/messages`
- Admin mobile chat panel kept separate from website support mail


Responsibilities:

- validate user input
- prevent empty messages
- store message in Firestore
- timestamp messages
- keep mentor chat unread/read state clear for admin and students

---

# Technology Stack

Frontend:

- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons
- Vite

Backend / Infrastructure:

- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions
- Firebase Hosting
- Paystack API

---

# Project Structure

```
src/
├── App.tsx                 routes, guards (RequireStudent, RequireAdmin), 404
├── app/                    AppProvider, usePageMeta (title/SEO), view names
├── ui/                     shared UI kit: Button, ButtonLink, Card, Badge, Field,
│                           PageHeader, EmptyState, Skeleton, LoadingPanel
├── pages/                  HomePage, NotFound
└── features/
    ├── join/               sign-up and checkout (/register, /student/login,
    │                       verify-email, register, payment)
    ├── shared/             building blocks for join + student (Card, Notice,
    │                       Dialog, Avatar, Progress)
    ├── learn/              student area (/student/*)
    │   ├── useStudentData.ts   all student data + listeners
    │   ├── usePayments.ts      the student's payments (receipts, "being checked")
    │   ├── StudentArea.tsx     sidebar, phone header and tabs, Add weeks dialog
    │   ├── ui.tsx              class hero, session rows, weeks card, cards
    │   ├── time.ts, calendar.ts  class times, add to calendar
    │   └── sections/           Home, Classes, Resources, Community,
    │                           MentorChat, Updates, Badges, Account, More
    └── admin/              admin area (/admin/*)
        ├── useAdminWorkspace.tsx  all admin data + actions
        ├── AdminArea.tsx          routes
        ├── nav.tsx                pages, groups, old-URL redirects
        ├── insights.ts            what needs attention (Today + badges)
        ├── automation.ts          schedule generation/copy, intake names
        ├── layout/                sidebar, phone tabs, toasts, confirm
        ├── pages/                 one file per page
        ├── parts/                 class form, schedule dialogs, recording link
        └── ui.tsx                 admin building blocks (panels, dialogs, menus)

components/                 public pages, admin login
hooks/useAppLogic.ts        auth state, live profile, navigation bridge
services/                   firebase, registrationStore (Firestore access), siteConfig
utils/courseRoutes.ts       course slugs and URLs

functions/src/
├── index.ts                contact, mentor chat, Sheets sync
└── payments.ts             Paystack initialize, verify, webhook (server-side crediting)

firestore.rules             security rules (source of truth)
firestore.indexes.json      composite indexes
tests/                      rules tests (run in the Firestore emulator)
dev/                        UI preview harness with mock data (no Firebase needed)
```

Design tokens live in `tailwind.config.js` and match the mobile app: deep blue
`#0F2B5B` (`blue-900`), teal `#1698A0` (`teal-500`), orange `#FF7A45`
(`orange-500`), Sora for headings (`font-display`) and Manrope for body text.

---

# Environment Variables

Create a `.env` file in the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_PAYSTACK_PUBLIC_KEY=
VITE_VERIFY_PAYSTACK_URL=
```

These values come from your Firebase project settings and the Paystack dashboard.

---

# Firebase Setup

1. Create a Firebase project
2. Enable the following services

- Authentication
- Firestore
- Cloud Functions
- Hosting

---

## Authentication

Enable **Email/Password** and **Google**.


---

## Firestore Collections

Typical collections used by the platform:

```
admins
config
paths
courses
activeCohorts
cohorts
users
users/{uid}/payments
cohorts/{cohortId}/sessions
cohorts/{cohortId}/messages
resources
communitySpaces
contactMessages
mentorThreads
mentorThreads/{threadId}/messages
paymentReferences
```

---

# Firestore Rules

Firestore security rules are tracked locally in `firestore.rules` and referenced from `firebase.json`.

Treat `firestore.rules` as the source of truth. If rules are edited in the Firebase Console during an emergency, copy those changes back into this file before the next deployment.

Validate rules without deploying:

```bash
firebase deploy --only firestore:rules --dry-run
```

Important rule decisions:

- Contact messages should **not be directly written from the client**.
- Mentor chat student sends go through the callable `sendMentorRequest` function.
- Students can read their own mentor thread and mark it read.
- Payment crediting is handled by Cloud Functions or admin reconciliation only.
- Admin writes require an `admins/{uid}` document.

---

# Cloud Functions

## sendContactMessage

Callable function used by the contact form.

Responsibilities:

- validate name
- validate email
- validate message
- store message in Firestore

Example flow:


User → Contact Form
↓
Firebase Callable Function
↓
Validation
↓
Firestore Storage


---

## sendHireEnquiry

Callable function used by the enquiry form on `/hire`
(`functions/src/hire.ts`).

- Asks for a WhatsApp number instead of an email (Nigerian `0803…`, `+234…`
  or any 10–15 digit number), plus business name, need and budget range.
- Saves to `contactMessages` with `category: "hire"`, so it shows in
  Admin → Inbox → Website messages with a **Reply on WhatsApp** button.
- Honeypot field and a limit of 5 enquiries per number per hour.
- If the call fails, the page offers the same details as a pre-filled
  WhatsApp message.

---

## sendMentorRequest

Callable function used by student mentor chat.

Responsibilities:

- require authentication
- write to deterministic `mentorThreads/{threadId}`
- append text-only messages
- keep dashboard counts and unread state aligned

---

## Paystack payments (`functions/src/payments.ts`)

- `initializePaystackPayment`: used by the mobile app. Sets the amount on the server.
- `verifyPaystackPayment`: called after checkout on web and mobile.
- `paystackWebhook`: Paystack calls this directly, so access is granted even if the student closes the page.

Verify and webhook share one fulfilment path. The server reads the course price
from Firestore, credits only the weeks the amount actually covers, and records
each reference once, so a payment can never be credited twice. Anything it
can't match is stored with `status: needs_review` for the admin.

---

# Installation

```bash
git clone https://github.com/kr3a7ion/codewithgideon.git
cd codewithgideon
npm ci
npm --prefix functions ci
```

---

# Development

```bash
npm run dev           # the site, against your Firebase project
npm run preview:ui    # student + admin areas with mock data, no Firebase (port 5174)
```

The preview harness is useful for UI work. `http://localhost:5174/` lists
every screen: the join pages, each checkout state (`?phase=success`,
`verifying`, `failed&stage=verify`, `?state=checking`), and the student area
in each state (`?state=active`, `locked`, `checking`, `empty`; add
`&theme=dark`). Add `&slow=3000` to delay every mock call by that many
milliseconds and check the loading states. `http://localhost:5174/admin/today`
opens the admin area.
Admin actions work against in-memory sample data, so you can try flows like
generating a schedule without touching real data.

# Checks

```bash
npm run build                 # type check + production build
npm --prefix functions test   # payment crediting tests
npm run test:rules            # Firestore rules in the emulator (needs Java 11+)
```

GitHub Actions runs all three on every push.

---

# Deploy

Follow `DEPLOY_RUNBOOK.md`. It covers the order (functions → indexes → rules →
hosting), the Paystack webhook URL, a preview channel before going live, and
rollback.

---

# UI Design Principles

The interface focuses on:

- modern EdTech layout
- clean dashboards
- premium card UI
- responsive layouts
- dark mode support
- animated interactions
- modal based workflows

---

# Future Improvements

Planned improvements include:

- Firebase App Check
- contact spam protection
- analytics dashboard
- automated reminders
- certificates system
- recording archive
- community chat
- mobile app integration

---

# Author

**Gideon Sunday**

Founder of **CodeWithGideon**

Instagram  
https://instagram.com/c0dewithgideon

TikTok  
https://tiktok.com/@codewithgideon

---

# License

This project is intended for educational and commercial use under the author's terms
