<div align="center">
<img width="1200" height="475" alt="Code with gideon Logo" src="https://res.cloudinary.com/djjdzt7ka/image/upload/v1770216204/logo.jpg" />
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

# Key Features

## Student Features

Students can:

- Create an account
- Login securely
- Continue registration after login
- Select learning paths
- Make payments
- Access unlocked classes
- Join live sessions
- View class schedule
- Open resources and community spaces
- Chat with a mentor from the student dashboard
- Earn weekly progress badges
- Track progress
- Contact the platform via a contact form

### Student Dashboard Includes

- Current course overview
- Next session information
- Live session indicator
- Payment continuation
- Unlocked sessions preview
- Classes, resources, community, mentor chat, badges, and notifications
- Clear locked states while payment is pending
- Direct join buttons for live and recorded classes

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
| **Announcements** | Messages to a cohort (students see them under Notifications) |
| **Courses & paths**, **Resources**, **Community** | What students can sign up for and the material around it |
| **Settings** | Website content (APK link, contact page, socials, home page button), Google Sheets, CSV export, delete-all (typed confirmation) |

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
    ├── learn/              student area (/student/*)
    │   ├── useStudentData.ts   all student data + listeners
    │   ├── StudentArea.tsx     header, section nav, top-up dialog
    │   └── sections/           Overview, Classes, Resources, Community,
    │                           MentorChat, Notifications, Badges
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

components/                 public pages, auth, registration, payment
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

The preview harness is useful for UI work. Open
`http://localhost:5174/student/dashboard?state=active` (or `state=locked`,
`state=empty`) and `http://localhost:5174/admin/today`. Admin actions work
against in-memory sample data, so you can try flows like generating a
schedule without touching real data.

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
