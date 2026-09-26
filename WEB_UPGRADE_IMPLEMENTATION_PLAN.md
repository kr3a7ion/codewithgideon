# CodeWithGideon Web Upgrade Implementation Plan

This checklist tracks the web upgrade while keeping the mobile app feature set in mind. The goal is to move the web away from fragile single-page view state, remove split source-of-truth issues, simplify payment handling, and improve the user/admin experience without breaking existing production flows.

## Guiding Principles

- [ ] Keep mobile and web backed by the same Firestore truth.
- [ ] Avoid hardcoded course, pricing, cohort, contact, and support content where admin-managed data already exists.
- [ ] Upgrade in safe phases so registration, payment, dashboard access, and admin operations continue working.
- [ ] Prefer user-friendly error handling over raw debug output.
- [ ] Improve UI polish, spacing, responsiveness, dark mode, and loading states as each page is touched.

## Phase 1: Routing Foundation

- [x] Add `react-router-dom` to the web app.
- [x] Replace the `currentView` navigation model with real browser routes gradually.
- [x] Preserve current navigation behavior while routes are introduced.
- [x] Create public routes for `/`, `/courses`, `/courses/:courseId`, `/contact`, `/privacy`, `/terms`, and `/refund`.
- [x] Create student routes for `/student/login`, `/student/verify-email`, `/student/register`, `/student/payment`, `/student/dashboard`, `/student/classes`, `/student/resources`, `/student/community`, `/student/chat`, and `/student/badges`.
- [x] Create admin routes for `/admin`, `/admin/paths`, `/admin/courses`, `/admin/cohorts`, `/admin/sessions`, `/admin/messages`, `/admin/mobile-chat`, `/admin/support`, `/admin/resources`, `/admin/community`, `/admin/payments`, `/admin/settings`, and `/admin/registrations`.
- [x] Confirm page refresh works on every route.
- [x] Confirm Firebase Hosting rewrites route all app paths to `index.html`.

Note: `react-router-dom` is now installed and the app is wrapped in `BrowserRouter`. The existing `onNavigate(view, data)` API is still preserved while the app transitions to full route components.

## Phase 2: Dynamic Course And Curriculum Pages

- [x] Replace static `PathFlutter`, `PathWeb`, and `PathAI` pages with one dynamic course detail page.
- [x] Load course details by `courseId` first, then fall back to title/legacy slug only where needed.
- [x] Render syllabus from `courses/{courseId}.syllabus`.
- [x] Render `weeks` and `pricePerWeek` from Firestore truth fields.
- [x] Keep `priceLabel` only as display text, not payment truth.
- [x] Update public course cards to stop merging admin data with old sample courses.
- [x] Show a polished empty state if no active courses are available.
- [x] Improve course UI with stronger visual hierarchy, better spacing, and mobile-friendly cards.

## Phase 3: Registration Source Of Truth

- [x] Update registration path selection to use `courseId` and `pathId`, not course title strings.
- [x] Remove pinned course fallbacks from registration once Firestore data is confirmed stable.
- [x] Keep a temporary safe fallback only for emergency empty-data states.
- [x] Ensure selected course writes `pathId`, `courseId`, `courseDurationWeeks`, and `weeklyRate` to `users/{uid}`.
- [x] Make "save and go to dashboard" and "continue to payment" behavior explicit and impossible to confuse.
- [x] Improve form layout, validation copy, loading states, and dark mode contrast.

## Phase 4: Payment Simplification

- [x] Remove client-side Paystack fee calculation from web.
- [ ] Remove client-side Paystack fee calculation from mobile.
- [x] Charge only the base course amount: `weeks * weeklyRate`.
- [x] Remove fee split UI labels such as "Student Share", "You Cover", and "You Receive".
- [x] Add simple user copy: "Gateway charges may be added by Paystack at checkout."
- [ ] Run one test transaction after Paystack dashboard pass-fees is enabled.
- [ ] Inspect Paystack verify response fields: `amount`, `fees`, metadata, channel, and reference.
- [x] Update Cloud Function verification to validate safely against the intended base amount.
- [x] Store clean payment fields: `baseAmount`, `chargedAmount`, `gatewayFee`, `reference`, `weeks`, `kind`, `courseId`, `pathId`, and `cohortKey`.
- [x] Keep idempotency by using deterministic payment docs keyed by Paystack reference.
- [x] Replace raw payment/debug errors with friendly messages and internal console logs.

## Phase 5: Student Web Feature Parity

- [x] Add a proper student dashboard shell with tabs or routed sections.
- [x] Add classes page with unlocked live and recorded sessions.
- [x] Add resources library from `resources`.
- [x] Add community spaces from `communitySpaces`.
- [x] Add mentor chat using `mentorThreads/{threadId}/messages`.
- [x] Add notification/read-state support for cohort messages and mentor replies.
- [x] Add weekly badge view matching the mobile badge concept.
- [x] Ensure locked/pending states are clear and encouraging, not broken-looking.
- [x] Improve skeleton loading so dashboard content can appear progressively while Firestore syncs.

## Phase 6: Admin Dashboard Upgrade

- [x] Split admin sections into real routes.
- [x] Keep mobile mentor chat separate from support mail inbox.
- [x] Fix dashboard counts to clearly separate all chats, unread mobile chats, and unread support messages.
- [x] Label manual pending payment approval as an admin override/reconciliation action.
- [x] Improve admin payment records with verified gateway fields after Cloud Function updates.
- [x] Add site config management for homepage CTA, contact links, social links, APK link, and support copy.
- [x] Replace browser `alert` and `confirm` calls with styled app modals/toasts.
- [x] Improve admin mobile layout, spacing, tables, filters, and dark mode readability.

## Phase 7: Site Config And Static Content Cleanup

- [x] Move contact/social links into `config/app`.
- [x] Move homepage CTA copy into `config/app`.
- [x] Move APK/app download link into `config/app`.
- [x] Decide whether FAQ should be admin-editable or stable static content. Decision: keep stable static for now, but avoid hardcoded pricing.
- [x] Make pricing section read from active courses instead of hardcoded `₦10,000/week`.
- [x] Keep legal pages static unless policy copy needs admin editing.
- [x] Remove placeholder copy like "connect it to your preferred contact handler."
- [x] Update README to match current collections and flows.

## Phase 8: Security And Rules

- [x] Add or document Firestore rules locally instead of relying only on Firebase Console memory.
- [x] Confirm student read access for only their own `users/{uid}` data and allowed published resources/community/sessions.
- [x] Confirm mentor chat writes go through Cloud Functions or tightly scoped rules.
- [x] Confirm payment crediting happens only through Cloud Functions or admin override.
- [x] Add App Check rollout plan for web and mobile.
- [x] Add rate limiting or abuse protection for contact and mentor functions.
- [x] Confirm admin-only collections and writes are protected by `admins/{uid}`.

## Phase 9: UI Polish Pass

- [ ] Review typography scale across public, student, and admin pages.
- [ ] Improve spacing consistency between cards, forms, tables, and modals.
- [ ] Fix dark mode text visibility across all pages.
- [x] Add better empty states for no courses, no sessions, no resources, no community spaces, no chats, and no notifications.
- [ ] Add intentional skeleton loaders instead of blank waiting states.
- [ ] Improve mobile responsiveness for admin tables and student dashboard cards.
- [x] Reduce visual clutter in payment and registration flows.
- [ ] Make buttons and CTAs consistent across web and mobile brand language.

## Phase 10: Testing And Deployment

- [x] Run TypeScript build.
- [x] Test public navigation and route refresh.
- [ ] Test email registration.
- [ ] Test Google sign-in on web.
- [ ] Test verify-email flow.
- [ ] Test save-to-dashboard flow.
- [ ] Test initial payment.
- [ ] Test pending payment resume.
- [ ] Test top-up payment.
- [ ] Test admin manual payment override.
- [ ] Test student classes/resources/community/chat/badges.
- [ ] Test admin mobile chat read and reply flow.
- [ ] Test support contact form and support inbox.
- [ ] Test dark mode on all major pages.
- [ ] Deploy web preview or staging build before production.

## Immediate Recommended First Sprint

- [x] Add `react-router-dom` and set up route skeleton.
- [ ] Move public pages into route components.
- [x] Simplify web payment fee handling.
- [x] Remove user-facing payment debug output.
- [x] Create dynamic course detail page.
- [x] Update course/registration/payment to use `courseId` and `pathId` as truth.
- [x] Add site config shape for contact/social/app links.

Verification note: normal web production build now passes with `npm run build`. Functions build now passes with `npm --prefix functions run build`.
