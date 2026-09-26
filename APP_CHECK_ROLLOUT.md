# App Check Rollout Plan

Use this plan before enabling `enforceAppCheck` on callable or HTTP functions.

## Phase 1: Register Apps

- Register the production web app in Firebase App Check with reCAPTCHA Enterprise or reCAPTCHA v3.
- Register the Android app with Play Integrity before releasing a production APK.
- Register iOS with DeviceCheck/App Attest if iOS is added later.

## Phase 2: Client Integration

- Initialize App Check in the web Firebase bootstrap before any callable function runs.
- Initialize App Check in the mobile app before Firebase Auth, Firestore, or Functions usage.
- Keep debug providers enabled only for local development builds.

## Phase 3: Monitor Without Enforcement

- Keep `enforceAppCheck` disabled at first.
- Watch Firebase App Check metrics for valid, invalid, and missing token traffic.
- Confirm contact form, mentor chat, payment initialize, and payment verify continue to work.

## Phase 4: Gradual Enforcement

- Enable enforcement first for low-risk callables such as `sendContactMessage`.
- Then enable enforcement for `sendMentorRequest` after the released mobile app sends valid tokens.
- Enable enforcement for payment initialize/verify only after web and mobile payment flows are confirmed with valid tokens.

## Phase 5: Operational Notes

- Do not enforce App Check until the currently distributed APK version supports it.
- Keep rate limiting in place even after App Check because App Check is not a replacement for abuse limits.
- Document debug token usage for local development and rotate debug tokens if they leak.
