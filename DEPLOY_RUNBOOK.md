# Deploy runbook: Phase 0 (stabilise)

Covers the `fix/phase0-stabilise` branch of this repo and the matching branch
of `Codewithgideonmobile`. Follow the steps in order. Each step is safe on its
own: the backend stays compatible with the web app and with the mobile APK
students already have (v1.0.0).

Firebase project: `codewithgideon` · Functions region: `us-central1`

---

## What this release fixes

| Problem | Fix |
|---|---|
| Payment verify trusted the client's weeks, so paying for 1 week could unlock 12 | The server credits only the weeks the amount paid covers, at the course price stored in Firestore. |
| A closed browser after paying meant no access until you approved it by hand | The Paystack webhook now grants access too (same code as verify, and it can't credit twice). |
| `initializePaystackPayment` could write a pending payment to any account | It requires the account's email or login token, never creates user docs, and sets the amount itself. |
| The committed rules rejected the web's pending-payment write, so every web payment failed | The rules accept it. |
| Server timestamps in a student's doc locked them out of their own profile | The rules accept numbers or timestamps, and check only the fields that changed. |
| The web dashboard moved students into the newest cohort | Removed. The cohort is assigned when a payment is confirmed. |
| An abandoned top-up hid all paid classes | A pending top-up never removes access (web and rules). |
| Mobile mentor replies never arrived | Web, mobile and the Cloud Function all use `mentorThreads/mentor_<uid>`. |
| The mobile dashboard waited about 5 s for nothing | The artificial delay is gone. |
| Tailwind loaded from a CDN script at runtime | Tailwind is compiled at build time. |
| One crashing section blanked the whole site | An error boundary catches it; refreshing the payment page no longer crashes. |

---

## Step 0: Prerequisites (once)

```bash
npm i -g firebase-tools   # needs v13+
firebase login
firebase use codewithgideon
java -version             # Java 11+ is needed only for the rules tests
```

---

## Step 1: Merge and install

```bash
git checkout main && git pull
git merge --no-ff fix/phase0-stabilise   # or merge the PR on GitHub
npm ci
npm --prefix functions ci
```

---

## Step 2: Run the checks locally

```bash
npm --prefix functions test   # payment credit maths (9 tests)
npm run build                 # type check + production build
npm run test:rules            # Firestore rules against every web/mobile query
```

All three must pass. `test:rules` starts the Firestore emulator by itself.
GitHub Actions runs the same checks on every push (`.github/workflows/ci.yml`).

---

## Step 3: Deploy the Cloud Functions

```bash
firebase deploy --only functions
```

The function names and URLs are unchanged, so the web app and the installed
APK keep working.

Check it worked:

```bash
curl -s -X POST https://us-central1-codewithgideon.cloudfunctions.net/verifyPaystackPayment \
  -H 'Content-Type: application/json' -d '{"reference":"CWG_TEST_DOES_NOT_EXIST"}'
# expected: {"ok":false,"code":"paystack_not_found",...}
```

---

## Step 4: Indexes (compare before deploying)

Your console may already have indexes that aren't in the file. Export them
first, so the deploy doesn't delete them:

```bash
firebase firestore:indexes > /tmp/current-indexes.json
```

Copy any index from `/tmp/current-indexes.json` that is missing from
`firestore.indexes.json` into the file, then:

```bash
firebase deploy --only firestore:indexes
```

If the CLI asks whether to delete indexes that aren't in the file, answer
**No**. Wait until every index shows **Enabled** in Firebase Console →
Firestore → Indexes before Step 5.

---

## Step 5: Deploy the rules

```bash
firebase deploy --only firestore:rules
```

The rules have three blocks marked **TEMPORARY** (sessions, resources,
community spaces). They keep the v1.0.0 APK working. They get tightened in
Step 9.

---

## Step 6: Deploy the website

Try it on a preview URL first (same Firebase project, separate web address):

```bash
npm run build
firebase hosting:channel:deploy phase0 --expires 7d
```

Open the preview URL it prints and run the checklist in Step 10. When
everything passes:

```bash
firebase deploy --only hosting
```

Web environment (`.env` / `.env.production.local`, not committed):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=codewithgideon
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
VITE_VERIFY_PAYSTACK_URL=https://us-central1-codewithgideon.cloudfunctions.net/verifyPaystackPayment
```

---

## Step 7: Paystack dashboard

1. **Settings → API Keys & Webhooks → Live Webhook URL:**
   `https://us-central1-codewithgideon.cloudfunctions.net/paystackWebhook`
2. Optional: **Settings → Preferences → Transaction charges → Pass charges to
   customer.** The apps now send only the base price (weeks × weekly rate), and
   the server ignores any fee on top when it counts weeks.
3. Confirm the `PAYSTACK_SECRET_KEY` secret is set:
   `firebase functions:secrets:access PAYSTACK_SECRET_KEY` (prints it; don't share).

---

## Step 8: Mobile APK v1.0.1

In `Codewithgideonmobile/codewithgideon`:

```bash
flutter pub get
dart format lib test        # CI checks formatting; commit any changes
flutter analyze
flutter test
flutter build apk --release
```

Then upload the APK and update the APK link in **Admin → Settings**
(`config/app`).

Merge mobile PR #1 and then PR #2 before building. PR #2 replaces
`phosphor_flutter`, which doesn't compile on Flutter 3.44+, with Material
Icons. After that, any current stable Flutter works. Mobile CI runs analyze,
test and a debug APK build on both Flutter 3.38.7 and the latest stable.
If you build from PR #1 alone, use Flutter 3.38–3.41.

---

## Step 9: Tighten the rules (after most students have v1.0.1)

In `firestore.rules`, replace each **TEMPORARY** rule with the strict version
written in the comment next to it (sessions, resources, community spaces). In
`tests/firestore.rules.test.mjs`, change the `TEMPORARY:` test to
`assertFails`. Then:

```bash
npm run test:rules && firebase deploy --only firestore:rules
```

After this, a student can read only published sessions up to the week they
paid for, and only published resources and spaces.

---

## Step 10: End-to-end checklist

Use a test student account. For payments, pay for **1 week** with a real card,
then refund it from the Paystack dashboard.

**Public site**
- [ ] `/`, `/courses`, a course page, `/contact`, `/privacy`, `/terms` and `/refund` load. Refreshing each one works.
- [ ] Dark mode toggle works and is remembered.
- [ ] The contact form sends, and the message appears in the admin support inbox.

**Registration**
- [ ] Email sign-up → verification email → verify → registration form → "Save and go to dashboard".
- [ ] Google sign-in (new account and existing account).
- [ ] A pending student can go back and change their course before paying.

**Payments (web)**
- [ ] First payment (1 week): the dashboard unlocks without a page refresh, and the student is in the active cohort.
- [ ] Close the Paystack popup without paying: the dashboard shows no lingering pending state and paid classes are still visible.
- [ ] Top-up of 1 week: weeks go up by exactly 1.
- [ ] Pay, then close the tab before the success screen: access still arrives (webhook) within a minute.
- [ ] Admin → Payments shows the record with `status: success`.

**Payments (mobile v1.0.0 and v1.0.1)**
- [ ] First payment and top-up both credit the right weeks.

**Student area (web and mobile)**
- [ ] Classes show only paid weeks; join and recording links open.
- [ ] Resources, community spaces and cohort announcements load.
- [ ] Mentor chat: the student sends → the admin sees it in Mobile Chat → the admin replies → the student sees the reply (web and mobile).
- [ ] Profile edit (mobile) saves name and phone.

**Admin**
- [ ] Login, 30-minute auto-lock countdown, every section route (`/admin/...`), refresh on each.
- [ ] Manual approval of a pending payment credits once; approving the same reference again is refused.

---

## Phase 1 release (web UI: PR #11)

Phase 1 changes only the website: new design, real routes, and the rebuilt
student and admin areas. It needs no function, rule or index deploys, so do
Phase 0 first and then:

```bash
git checkout main && git pull   # after merging PR #11
npm ci
npm run build
firebase hosting:channel:deploy phase1 --expires 7d
```

On the preview URL, check:
- [ ] The Step 10 **Public site** and **Student area** items.
- [ ] Every admin section at `/admin/<section>` (paths, cohorts, sessions, messages, mobile-chat, community, courses, resources, payments, settings, registrations). Refresh each one.
- [ ] An unknown URL such as `/nope` shows the 404 page.

Then run `firebase deploy --only hosting`. To roll back, use Hosting release
history (below).

Tip: `npm run preview:ui` shows the student and admin areas with sample data
and no Firebase, which is handy for UI changes.

---

## Rollback

- Functions: `firebase functions:list` shows versions; redeploy the previous
  commit with `git checkout <prev> -- functions && firebase deploy --only functions`.
- Hosting: Firebase Console → Hosting → release history → **Rollback**.
- Rules: Firebase Console → Firestore → Rules → history → pick the previous
  version → **Publish**.
