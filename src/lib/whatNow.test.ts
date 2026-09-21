import assert from "node:assert/strict";
import { test } from "node:test";
import { activitySteps, categoryDefaultEnergy, effectiveEnergy, stepsForGuide } from "./whatNow";

test("uses the override when a task is easier or harder than its category", () => {
  assert.equal(effectiveEnergy(2, 8), 2);
  assert.equal(effectiveEnergy(null, 8), 8);
  assert.equal(effectiveEnergy(undefined, 4), 4);
  assert.equal(effectiveEnergy(null, undefined), 5);
});

test("studio categories have a default energy band", () => {
  assert.equal(categoryDefaultEnergy.selfcare, 5);
  assert.equal(categoryDefaultEnergy.tiktok, 8);
  assert.equal(categoryDefaultEnergy.vtubing, 6);
  assert.equal(categoryDefaultEnergy.blender, 7);
  assert.equal(categoryDefaultEnergy.unity, 9);
  assert.equal(categoryDefaultEnergy.food, 6);
});

test("activity steps come from checklists or plain strings, and skip finished items", () => {
  assert.deepEqual(activitySteps(["Boil water", "  ", "Sit down"]), ["Boil water", "Sit down"]);
  assert.deepEqual(activitySteps([
    { id: "a", text: "Open the fridge", done: false },
    { id: "b", text: "Already did this", done: true },
    { id: "c", text: "  ", done: false },
  ]), ["Open the fridge"]);
});

test("a task with no steps still has one guide beat: the title", () => {
  assert.deepEqual(stepsForGuide({
    source: "catalog",
    id: "x",
    title: "Drink water",
    description: "A glass is enough.",
    category: "selfcare",
    subcategory: "",
    energy: 2,
    energyOverride: null,
    steps: [],
  }), ["Drink water"]);
});
