// Pure helpers from the hire module. Firebase is stubbed out.
import {test} from "node:test";
import assert from "node:assert/strict";
import {register} from "node:module";

register("data:text/javascript," + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec.endsWith("/admin.js")) return {url: "data:text/javascript,export const db={};export const adminAuth={};", shortCircuit: true};
  return next(spec, ctx);
}`));

const {normalizeWhatsApp, buildHireEnquiry, clientIp} = await import("../lib/hire.js");

test("Nigerian numbers normalise to 234…", () => {
  assert.equal(normalizeWhatsApp("0803 000 0000"), "2348030000000");
  assert.equal(normalizeWhatsApp("+234 803-000-0000"), "2348030000000");
  assert.equal(normalizeWhatsApp("00234 8030000000"), "2348030000000");
  assert.equal(normalizeWhatsApp("8030000000"), "2348030000000");
});

test("other international numbers pass; junk fails", () => {
  assert.equal(normalizeWhatsApp("+44 7700 900123"), "447700900123");
  assert.equal(normalizeWhatsApp("12345"), null);
  assert.equal(normalizeWhatsApp(""), null);
  assert.equal(normalizeWhatsApp(undefined), null);
  assert.equal(normalizeWhatsApp("1".repeat(16)), null);
});

const valid = {name: " Amaka  Obi ", businessName: "Glow Beauty Lounge", whatsapp: "08030000000", need: "booking", budget: "100k-200k"};

test("a valid enquiry is cleaned and summarised", () => {
  const e = buildHireEnquiry({...valid, details: "Braids and nails", utm: {utm_source: "whatsapp", utm_campaign: "leadscout", evil: "x"}});
  assert.equal(e.name, "Amaka Obi");
  assert.equal(e.whatsapp, "2348030000000");
  assert.equal(e.needLabel, "Booking site");
  assert.deepEqual(e.utm, {utm_source: "whatsapp", utm_campaign: "leadscout"});
  assert.match(e.message, /Business: Glow Beauty Lounge/);
  assert.match(e.message, /WhatsApp: \+2348030000000/);
  assert.match(e.message, /Came from: whatsapp \/ leadscout/);
});

test("missing or unknown fields are refused with a friendly message", () => {
  assert.throws(() => buildHireEnquiry({...valid, name: "A"}), /name/);
  assert.throws(() => buildHireEnquiry({...valid, businessName: ""}), /business/);
  assert.throws(() => buildHireEnquiry({...valid, whatsapp: "123"}), /WhatsApp/);
  assert.throws(() => buildHireEnquiry({...valid, need: "app"}), /need/);
  assert.throws(() => buildHireEnquiry({...valid, budget: "a lot"}), /budget/);
});

test("built-in object keys are not accepted as a need or budget", () => {
  for (const key of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
    assert.throws(() => buildHireEnquiry({...valid, need: key}), /need/);
    assert.throws(() => buildHireEnquiry({...valid, budget: key}), /budget/);
  }
});

test("client IP comes from the first forwarded hop", () => {
  assert.equal(clientIp({headers: {"x-forwarded-for": "102.89.1.2, 10.0.0.1"}, ip: "10.0.0.1"}), "102.89.1.2");
  assert.equal(clientIp({headers: {}, ip: "102.89.1.3"}), "102.89.1.3");
  assert.equal(clientIp(undefined), "");
});
