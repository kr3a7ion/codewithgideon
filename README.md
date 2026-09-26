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

Admins have access to a powerful control dashboard.

### Admin Capabilities

- Manage **learning paths**
- Create and edit **courses**
- Create and assign **cohorts**
- Publish **sessions**
- Manage **student registrations**
- Approve or verify **pending payments**
- Review verified Paystack records and gateway fields
- Export student data
- Sync student data with **Google Sheets**
- Manage **mobile mentor chat** separately from website support mail
- Manage **resources** and **community spaces**
- Manage **site settings** such as contact links, socials, APK link, and homepage CTA
- Manage **contact inbox**
- View platform activity

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

Pending payments can also be manually reconciled by an admin override after confirming the Paystack reference in the gateway dashboard.

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
components/
├── AdminDashboard.tsx
├── StudentDashboard.tsx
├── Courses.tsx
├── ContinueRegistration.tsx
└── Contact.tsx

services/
├── firebase.ts
├── registrationStore.ts
└── siteConfig.ts

hooks/
└── useSiteConfig.ts

firestore.rules
firebase.json

functions/
└── src/
└── index.ts


---

# Environment Variables

Create a `.env` file in the project root.

Example:
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=


These values come from your Firebase project settings.

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

Enable:
Email / Password


---

## Firestore Collections

Typical collections used by the platform:
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

## verifyPaystackPayment

HTTP function responsible for verifying payments.

Responsibilities:

- verify Paystack transaction
- confirm charged amount safely against the intended base amount
- store base amount, charged amount, gateway fee, channel, status, metadata, and reference
- update student record
- unlock course access

---

# Installation

Clone the repository:


git clone https://github.com/kr3a7ion/codewithgideon.git


Install dependencies:


npm install


Install functions dependencies:


cd functions
npm install
cd ..


---

# Run Development Server


npm run dev


---

# Build Project


npm run build


---

# Deploy

Deploy hosting and functions from this repo:


firebase deploy


Deploy only Firestore rules from the local `firestore.rules` file:

```bash
firebase deploy --only firestore:rules
```


Deploy only functions:


firebase deploy --only functions


Deploy a specific function:


firebase deploy --only functions:sendContactMessage


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
