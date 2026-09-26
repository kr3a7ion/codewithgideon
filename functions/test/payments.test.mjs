// Run with: npm run build && node --test test/
// computeCredit is pure, so we load it without touching Firebase by stubbing
// the admin module before importing the compiled payments module.
import {test} from "node:test";
import assert from "node:assert/strict";
import {register} from "node:module";

register("data:text/javascript," + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec.endsWith("/admin.js")) return {url: "data:text/javascript,export const db={};export const adminAuth={};", shortCircuit: true};
  return next(spec, ctx);
}`));

const {computeCredit} = await import("../lib/payments.js");

const base = {hasCourse: true, weeklyRate: 10000, maxWeeks: 12, currentWeeks: 0, kind: "initial", requestedWeeks: 0};

test("pays for 1 week but asks for 12 -> gets 1 week", () => {
  const r = computeCredit({...base, amountKobo: 1_000_000, requestedWeeks: 12});
  assert.equal(r.safeWeeks, 1);
  assert.equal(r.reviewReason, "");
});

test("full course payment credits all weeks", () => {
  const r = computeCredit({...base, amountKobo: 12_000_000, requestedWeeks: 12});
  assert.equal(r.safeWeeks, 12);
});

test("gateway fee on top of base does not add a week", () => {
  const r = computeCredit({...base, amountKobo: 4_000_000 + 70_000, requestedWeeks: 4});
  assert.equal(r.safeWeeks, 4);
});

test("cannot exceed course length even if overpaid", () => {
  const r = computeCredit({...base, amountKobo: 20_000_000, requestedWeeks: 20});
  assert.equal(r.safeWeeks, 12);
});

test("top-up is capped at remaining weeks", () => {
  const r = computeCredit({...base, kind: "topup", currentWeeks: 10, amountKobo: 5_000_000, requestedWeeks: 5});
  assert.equal(r.safeWeeks, 2);
});

test("top-up on a fully paid course goes to review", () => {
  const r = computeCredit({...base, kind: "topup", currentWeeks: 12, amountKobo: 1_000_000, requestedWeeks: 1});
  assert.equal(r.safeWeeks, 0);
  assert.equal(r.reviewReason, "course_already_paid");
});

test("less than one week goes to review", () => {
  const r = computeCredit({...base, amountKobo: 500_000, requestedWeeks: 1});
  assert.equal(r.safeWeeks, 0);
  assert.equal(r.reviewReason, "amount_below_one_week");
});

test("missing course goes to review", () => {
  const r = computeCredit({...base, hasCourse: false, amountKobo: 1_000_000});
  assert.equal(r.reviewReason, "course_not_configured");
});

test("no requested weeks -> credit what was paid for", () => {
  const r = computeCredit({...base, amountKobo: 3_000_000});
  assert.equal(r.safeWeeks, 3);
});
