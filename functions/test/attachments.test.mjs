import {test} from "node:test";
import assert from "node:assert/strict";

const {cleanAttachments} = await import("../lib/attachments.js");

const link = (path) => `https://firebasestorage.googleapis.com/v0/b/codewithgideon.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=abc`;
const good = (uid, name = "a.png") => ({url: link(`mentor-uploads/${uid}/${name}`), path: `mentor-uploads/${uid}/${name}`, name, contentType: "image/png", size: 1000});

test("keeps the student's own image uploads", () => {
  assert.equal(cleanAttachments("u1", [good("u1")]).length, 1);
});

test("drops other students' files, non-images, big files and foreign links", () => {
  assert.equal(cleanAttachments("u1", [good("u2")]).length, 0);
  assert.equal(cleanAttachments("u1", [{...good("u1"), contentType: "application/pdf"}]).length, 0);
  assert.equal(cleanAttachments("u1", [{...good("u1"), size: 6 * 1024 * 1024}]).length, 0);
  assert.equal(cleanAttachments("u1", [{...good("u1"), url: "https://evil.example.com/x.png"}]).length, 0);
  assert.equal(cleanAttachments("u1", [{...good("u1"), url: link("mentor-uploads/u1/other.png")}]).length, 0);
  assert.equal(cleanAttachments("u1", "nope").length, 0);
});

test("at most three", () => {
  assert.equal(cleanAttachments("u1", [good("u1", "1.png"), good("u1", "2.png"), good("u1", "3.png"), good("u1", "4.png")]).length, 3);
});
