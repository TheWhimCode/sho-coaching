import assert from "node:assert/strict";
import { test } from "node:test";
import type { WhatNowCandidate } from "./whatNow";
import { applyFilter, listNeedPool, mergeFilters, pickManyFromFilter, timedNeedPool, timelineNeedPool } from "./whatNowSurvey";

const items: WhatNowCandidate[] = [
  { source: "studio", id: "a", title: "Clip", description: "", category: "tiktok", subcategory: "", energy: 8, energyOverride: null, steps: ["Find a clip"] },
  { source: "studio", id: "b", title: "Snack", description: "", category: "food", subcategory: "", energy: 6, energyOverride: null, steps: [] },
  { source: "catalog", id: "h", title: "Hidden", description: "", category: "hidden-cat", subcategory: "", energy: 4, energyOverride: null, hidden: true, steps: [] },
];

test("energy and category filters still match ordinary tasks", () => {
  const matches = applyFilter(items, mergeFilters([{ minEnergy: 6 }, { categories: ["tiktok"] }]));
  assert.equal(matches.map(item => item.id).join(), "a");
});

test("hidden catalog items are skipped unless that category is requested", () => {
  assert.equal(applyFilter(items, { minEnergy: 1, maxEnergy: 10 }).some(item => item.hidden), false);
  assert.equal(applyFilter(items, { categories: ["hidden-cat"] }).map(item => item.id).join(), "h");
});

function task(id: string, plannedDate: string): WhatNowCandidate {
  return { source: "studio", id, title: id, description: "", category: "home", subcategory: "", energy: 5, energyOverride: null, steps: [], plannedDate };
}

test("timeline picks always prefer unfinished work due within two days", () => {
  const pool = timelineNeedPool([
    task("soon", "2026-09-22"),
    task("also-soon", "2026-09-23"),
    task("later", "2026-09-25"),
    task("far", "2026-10-01"),
    { source: "catalog", id: "list", title: "list", description: "", category: "food", subcategory: "", energy: 4, energyOverride: null, steps: [] },
  ], "2026-09-21");
  assert.deepEqual(pool.map(item => item.id).sort(), ["also-soon", "soon"]);
});

test("overdue timeline work counts as due within two days", () => {
  const pool = timelineNeedPool([
    task("overdue", "2026-09-20"),
    task("later", "2026-09-25"),
  ], "2026-09-21");
  assert.deepEqual(pool.map(item => item.id), ["overdue"]);
});

test("if nothing is due in two days, timeline picks from three to five days out", () => {
  const pool = timelineNeedPool([
    task("three", "2026-09-24"),
    task("five", "2026-09-26"),
    task("six", "2026-09-27"),
  ], "2026-09-21");
  assert.deepEqual(pool.map(item => item.id).sort(), ["five", "three"]);
});

function clip(id: string, plannedDate?: string): WhatNowCandidate {
  return { source: "studio", id, title: id, description: "", category: "tiktok", subcategory: "", energy: 8, energyOverride: null, steps: [], plannedDate };
}

test("TikTok picks prefer the next three days, then the next seven", () => {
  const filter = { pick: "timed" as const, categories: ["tiktok"], soonDays: 3, laterDays: 7 };
  const soon = timedNeedPool([
    clip("three", "2026-09-24"),
    clip("five", "2026-09-26"),
    clip("eight", "2026-09-29"),
  ], filter, "2026-09-21");
  assert.deepEqual(soon.map(item => item.id), ["three"]);
  const week = timedNeedPool([
    clip("five", "2026-09-26"),
    clip("seven", "2026-09-28"),
    clip("eight", "2026-09-29"),
  ], filter, "2026-09-21");
  assert.deepEqual(week.map(item => item.id).sort(), ["five", "seven"]);
  const rest = timedNeedPool([
    clip("eight", "2026-09-29"),
    clip("undated"),
  ], filter, "2026-09-21");
  assert.deepEqual(rest.map(item => item.id).sort(), ["eight", "undated"]);
});

test("model picks are untimed Blender and Unity list items", () => {
  const pool = listNeedPool([
    { source: "studio", id: "rig", title: "rig", description: "", category: "blender", subcategory: "", energy: 7, energyOverride: null, steps: [], plannedDate: "2026-09-22" },
    { source: "studio", id: "scene", title: "scene", description: "", category: "unity", subcategory: "", energy: 9, energyOverride: null, steps: [] },
    { source: "studio", id: "clip", title: "clip", description: "", category: "tiktok", subcategory: "", energy: 8, energyOverride: null, steps: [] },
    { source: "studio", id: "model", title: "model", description: "", category: "vtubing", subcategory: "", energy: 6, energyOverride: null, steps: [] },
  ], { pick: "list", categories: ["blender", "unity"] });
  assert.deepEqual(pool.map(item => item.id).sort(), ["rig", "scene"]);
});

const tiktokFilter = { pick: "timed" as const, categories: ["tiktok"], soonDays: 3, laterDays: 7, count: 3 };

test("TikTok options take three from the soon window when it has enough", () => {
  const picks = pickManyFromFilter([
    clip("a", "2026-09-22"),
    clip("b", "2026-09-23"),
    clip("c", "2026-09-24"),
    clip("d", "2026-09-26"),
  ], tiktokFilter, [], "2026-09-21");
  assert.deepEqual(picks.map(item => item.id).sort(), ["a", "b", "c"]);
});

test("TikTok options fill later days when the soon window is short", () => {
  const picks = pickManyFromFilter([
    clip("soon", "2026-09-22"),
    clip("five", "2026-09-26"),
    clip("seven", "2026-09-28"),
    clip("far", "2026-09-30"),
  ], tiktokFilter, [], "2026-09-21");
  assert.deepEqual(picks.map(item => item.id).sort(), ["five", "seven", "soon"]);
});

test("TikTok and model options show fewer than three when the list is shorter", () => {
  const tiktoks = pickManyFromFilter([clip("one"), clip("two")], tiktokFilter, [], "2026-09-21");
  assert.deepEqual(tiktoks.map(item => item.id).sort(), ["one", "two"]);
  const models = pickManyFromFilter([
    { source: "studio", id: "rig", title: "rig", description: "", category: "blender", subcategory: "", energy: 7, energyOverride: null, steps: [] },
    { source: "studio", id: "scene", title: "scene", description: "", category: "unity", subcategory: "", energy: 9, energyOverride: null, steps: [] },
  ], { pick: "list", categories: ["blender", "unity"], count: 3 }, []);
  assert.deepEqual(models.map(item => item.id).sort(), ["rig", "scene"]);
});
