import assert from "node:assert/strict";
import { test } from "node:test";
import { reorderIdeasSchema, socialIdeaSchema } from "./socialIdeas";
test("accepts a category reorder list", () => {
  const parsed = reorderIdeasSchema.parse({ ids: ["idea-1", "idea-2"] });
  assert.deepEqual(parsed, { ids: ["idea-1", "idea-2"] });
  assert.equal(reorderIdeasSchema.safeParse({ ids: [] }).success, false);
});
const patch = socialIdeaSchema.partial().strict();
test("moving an idea preserves its content and clearing the date is allowed", () => {
  assert.deepEqual(patch.parse({ plannedDate: "2026-09-18" }), { plannedDate: "2026-09-18" });
  assert.deepEqual(patch.parse({ plannedDate: null }), { plannedDate: null });
});
test("validates real calendar dates", () => {
  assert.equal(patch.safeParse({ plannedDate: "2026-02-30" }).success, false);
  assert.equal(patch.safeParse({ plannedDate: "2028-02-29" }).success, true);
});
test("rejects blank tasks, duplicate task IDs, and removed fields", () => {
  for (const value of [{ checklist: [{ id: "a", text: " ", done: false }] }, { checklist: [{ id: "a", text: "One", done: false }, { id: "a", text: "Two", done: true }] }, { status: "making" }, { dueDate: null }, { reference: "https://example.com" }]) {
    assert.equal(patch.safeParse(value).success, false);
  }
});
test("marks a card completed without deleting it", () => {
  assert.deepEqual(patch.parse({ status: "completed" }), { status: "completed" });
  assert.deepEqual(patch.parse({ status: "idea" }), { status: "idea" });
});
test("checklist updates do not replace notes or planned date", () => {
  const value = { checklist: [{ id: "a", text: "Find a clip", done: true }] };
  assert.deepEqual(patch.parse(value), value);
});
test("accepts social, life, and VTubing categories", () => {
  assert.equal(patch.safeParse({ platform: "tiktok" }).success, true);
  assert.equal(patch.safeParse({ platform: "selfcare" }).success, true);
  assert.equal(patch.safeParse({ platform: "food" }).success, true);
  assert.equal(patch.safeParse({ platform: "home" }).success, true);
  assert.equal(patch.safeParse({ platform: "vtubing" }).success, true);
  assert.equal(patch.safeParse({ platform: "blender" }).success, true);
  assert.equal(patch.safeParse({ platform: "unity" }).success, true);
  assert.equal(patch.safeParse({ platform: "youtube" }).success, false);
});
