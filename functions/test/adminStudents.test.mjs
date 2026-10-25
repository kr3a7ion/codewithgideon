// Pure helpers from the admin student module. Firebase is stubbed out.
import {test} from "node:test";
import assert from "node:assert/strict";
import {register} from "node:module";

register("data:text/javascript," + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec.endsWith("/admin.js")) return {url: "data:text/javascript,export const db={};export const adminAuth={};", shortCircuit: true};
  return next(spec, ctx);
}`));

const {cleanNewStudent, newStudentProfile} = await import("../lib/adminStudents.js");

test("add-student form: cleans and validates", () => {
  const ok = cleanNewStudent({fullName: "  Ada   Okafor ", email: "ADA@Example.com ", phone: "0803 123 4567", pathId: "path_flutter"});
  assert.deepEqual(ok, {ok: true, value: {fullName: "Ada Okafor", email: "ada@example.com", phone: "0803 123 4567", pathId: "path_flutter"}});
  assert.equal(cleanNewStudent({fullName: "A", email: "a@b.co", phone: "0803123", pathId: "p"}).ok, false);
  assert.equal(cleanNewStudent({fullName: "Ada", email: "nope", phone: "0803123", pathId: "p"}).ok, false);
  assert.equal(cleanNewStudent({fullName: "Ada", email: "a@b.co", phone: "123", pathId: "p"}).ok, false);
  assert.equal(cleanNewStudent({fullName: "Ada", email: "a@b.co", phone: "08031234567", pathId: ""}).ok, false);
});

test("new student profile: waiting to pay, valid shape", () => {
  const student = {fullName: "Ada Okafor", email: "ada@example.com", phone: "08031234567", pathId: "path_flutter"};
  const p = newStudentProfile({uid: "u1", student, pathTitle: "Flutter", course: {id: "c1", weeks: 12, pricePerWeek: 10000}, now: 5});
  assert.equal(p.status, "Pending");
  assert.equal(p.role, "student");
  assert.equal(p.weeksToCommit, 4);
  assert.equal(p.totalPrice, 40000);
  assert.equal(p.courseDurationWeeks, 12);
  assert.equal(p.courseId, "c1");
  const allowed = ["uid", "role", "status", "timestamp", "fullName", "email", "phone", "ageRange", "gender",
    "weeksToCommit", "totalPrice", "path", "pathId", "courseId", "cohortId", "cohortLabel", "cohortKey",
    "courseDurationWeeks", "weeklyRate", "pendingPayment", "updatedAt"];
  for (const k of Object.keys(p)) assert.ok(allowed.includes(k), `unexpected key ${k}`);
  const short = newStudentProfile({uid: "u2", student, pathTitle: "Web", course: {id: "c2", weeks: 2, pricePerWeek: 0}, now: 5});
  assert.equal(short.weeksToCommit, 2);
  assert.equal("weeklyRate" in short, false);
  const none = newStudentProfile({uid: "u3", student, pathTitle: "Web", course: null, now: 5});
  assert.equal(none.weeksToCommit, 4);
  assert.equal("courseId" in none, false);
});
