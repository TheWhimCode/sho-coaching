import assert from "node:assert/strict";
import { test } from "node:test";
import { socialIdeaSchema } from "./socialIdeas";

test("progress-only updates preserve omitted notes, dates, and links", () => {
  assert.deepEqual(socialIdeaSchema.partial().strict().parse({ status: "making" }), { status: "making" });
});

test("rejects invalid dates and unsafe reference URLs", () => {
  const patch = socialIdeaSchema.partial().strict();
  assert.equal(patch.safeParse({ dueDate: "2026-02-30" }).success, false);
  assert.equal(patch.safeParse({ reference: "javascript:alert(1)" }).success, false);
  assert.equal(patch.safeParse({ dueDate: "2028-02-29", reference: "https://example.com/post" }).success, true);
});

test("rejects blank titles and unknown platforms or progress states", () => {
  const patch = socialIdeaSchema.partial().strict();
  for (const value of [{ title: "   " }, { platform: "other" }, { status: "unknown" }]) {
    assert.equal(patch.safeParse(value).success, false);
  }
});
