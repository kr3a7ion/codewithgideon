// Pure helpers from the automation module. Firebase is stubbed out.
import {test} from "node:test";
import assert from "node:assert/strict";
import {register} from "node:module";

register("data:text/javascript," + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec.endsWith("/admin.js")) return {url: "data:text/javascript,export const db={};export const adminAuth={};", shortCircuit: true};
  return next(spec, ctx);
}`));

const {decidePending, isReminderDue, reminderMessage, reminderId, REMINDER_LEAD_MS} =
  await import("../lib/automation.js");

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

test("paid checkouts are credited whatever their age", () => {
  assert.equal(decidePending({ageMs: 11 * MIN, paystackStatus: "success"}), "fulfil");
  assert.equal(decidePending({ageMs: 5 * 24 * HOUR, paystackStatus: "success"}), "fulfil");
});

test("abandoned or failed checkouts are cleared only after 24 hours", () => {
  assert.equal(decidePending({ageMs: 2 * HOUR, paystackStatus: "abandoned"}), "wait");
  assert.equal(decidePending({ageMs: 25 * HOUR, paystackStatus: "abandoned"}), "clear");
  assert.equal(decidePending({ageMs: 25 * HOUR, paystackStatus: "failed"}), "clear");
  assert.equal(decidePending({ageMs: 25 * HOUR, paystackStatus: "not_found"}), "clear");
});

test("in-progress checkouts wait up to 3 days", () => {
  assert.equal(decidePending({ageMs: 30 * HOUR, paystackStatus: "ongoing"}), "wait");
  assert.equal(decidePending({ageMs: 73 * HOUR, paystackStatus: "pending"}), "clear");
});

test("reminder is due within 75 minutes of a published class", () => {
  const now = Date.UTC(2026, 8, 27, 16, 0);
  assert.equal(isReminderDue({isPublished: true, startsAt: now + 60 * MIN}, now), true);
  assert.equal(isReminderDue({isPublished: true, startsAt: now + REMINDER_LEAD_MS + MIN}, now), false);
  assert.equal(isReminderDue({isPublished: true, startsAt: now - MIN}, now), false);
  assert.equal(isReminderDue({isPublished: false, startsAt: now + 30 * MIN}, now), false);
  // Firestore Timestamp-like values work too.
  assert.equal(isReminderDue({startsAt: {toMillis: () => now + 20 * MIN}}, now), true);
});

test("reminder text uses Lagos time and the week", () => {
  // 17:00 UTC is 6:00 PM in Lagos (UTC+1).
  const m = reminderMessage({title: "State management", week: 3, startsAt: Date.UTC(2026, 8, 27, 17, 0)});
  assert.equal(m.title, "Class starting soon");
  assert.match(m.body, /^Week 3: State management starts at 6:00\s?PM \(WAT\)\./i);
  assert.ok(m.body.length >= 5 && m.title.length >= 3); // validCohortMessage
});

test("rescheduling a class gives it a new reminder id", () => {
  const a = reminderId("FLUTTER-2026-09", "W03_x", 1);
  const b = reminderId("FLUTTER-2026-09", "W03_x", 2);
  assert.notEqual(a, b);
  assert.match(a, /^[\w-]+$/);
});
