import assert from "node:assert/strict";
import { test } from "node:test";
import { enterBeatIndex, engineForChoice, guideProgress, moodEngines } from "./whatNowEngines";

test("meh skips the guided overlay and asks what's wrong", () => {
  const engine = moodEngines["feel-meh"];
  assert.equal(engineForChoice("feel-work")?.pace, "find");
  assert.equal(engineForChoice("feel-miserable")?.pace, "guide");
  assert.equal(engineForChoice("feel-bad")?.pace, "guide");
  assert.equal(engine.pace, "find");
  assert.equal(engine.beats.some(beat => beat.kind === "guide" || beat.kind === "say"), false);
  assert.equal(engine.beats.map(beat => beat.kind).join(), "ask,pick,result");
  const ask = engine.beats[0];
  assert.equal(ask.kind, "ask");
  if (ask.kind === "ask") {
    assert.equal(ask.prompt, "What's wrong?");
    assert.deepEqual(ask.choices?.map(choice => choice.label), ["Hungry", "Tired", "Sad", "Bored"]);
  }
});

test("miserable care messages run before any task is chosen", () => {
  const beats = moodEngines["feel-miserable"].beats;
  const firstAsk = beats.findIndex(beat => beat.kind === "ask");
  const firstPick = beats.findIndex(beat => beat.kind === "pick");
  assert.ok(beats.slice(0, firstAsk).every(beat => beat.kind === "say"));
  assert.ok(firstAsk < firstPick);
  assert.equal(beats.some(beat => beat.kind === "guide"), true);
});

test("work engine asks for a direction, then finds a task", () => {
  const beats = moodEngines["feel-work"].beats.map(beat => beat.kind).join();
  assert.equal(beats, "ask,pick,result");
  const ask = moodEngines["feel-work"].beats[0];
  assert.equal(ask.kind, "ask");
  if (ask.kind === "ask") {
    assert.equal(ask.choices?.[0]?.label, "Tell me what needs to be done");
    assert.equal(ask.choices?.[0]?.filter?.pick, "timeline");
    assert.equal(ask.choices?.[1]?.label, "Make a TikTok");
    assert.equal(ask.choices?.[1]?.filter?.pick, "timed");
    assert.deepEqual(ask.choices?.[1]?.filter?.categories, ["tiktok"]);
    assert.equal(ask.choices?.[1]?.filter?.count, 3);
    assert.equal(ask.choices?.[2]?.label, "Work on your model");
    assert.equal(ask.choices?.[2]?.filter?.pick, "list");
    assert.deepEqual(ask.choices?.[2]?.filter?.categories, ["blender", "unity"]);
    assert.equal(ask.choices?.[2]?.filter?.count, 3);
  }
});

test("a failed pick skips the rest of the script", () => {
  const engine = moodEngines["feel-miserable"];
  const pickAt = engine.beats.findIndex(beat => beat.kind === "pick");
  assert.equal(enterBeatIndex(engine, pickAt, null), engine.beats.length);
});

test("guide progress walks remaining task steps only", () => {
  const item = {
    source: "catalog" as const,
    id: "tea",
    title: "Make tea",
    description: "",
    category: "food",
    subcategory: "",
    energy: 3,
    energyOverride: null,
    steps: ["Fill the kettle", "Sit while it boils", "Pour"],
  };
  const first = guideProgress(item, 0);
  const last = guideProgress(item, 2);
  assert.equal(first.text, "Fill the kettle");
  assert.equal(first.last, false);
  assert.equal(last.text, "Pour");
  assert.equal(last.last, true);
});
