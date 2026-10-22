import assert from "node:assert/strict";
import { runDecisionTree, type TreeContext, type TreeParticipant } from "../src/lib/guides/buildPicker/decisionTree";
import { pickerBuildDefs } from "../src/lib/guides/buildPicker/builds";
import { VIEGO_ITEM_SECTION } from "../src/app/guide/viegoItems";

function participant(index: number, durability: number): TreeParticipant {
  return {
    name: `Champion${index}`, championId: `Champion${index}`, spellIds: [],
    shields: "None", damageType: "Mixed", damageThreat: "Medium", deniesResets: false,
    cc: "Medium", durabilityScore: durability, damageScore: 4, ccScore: 2, shieldScore: 0,
  };
}

function context(scores: number[], stealth?: string): TreeContext {
  const enemies = scores.map((score, index) => participant(index, score));
  if (stealth) enemies[0] = { ...enemies[0], name: stealth, championId: stealth };
  return { allies: Array.from({ length: 5 }, (_, i) => participant(i + 5, 2)), enemies };
}

for (const scores of [[1, 1, 1, 1, 1], [1, 1, 1, 2, 2], [2, 2, 2, 1, 1], [2, 2, 2, 2, 2], [2, 2, 2, 2, 3]]) {
  const result = runDecisionTree(context(scores));
  const total = scores.reduce((sum, score) => sum + score, 0);
  assert.equal(result.buildId, total <= 7 ? "bastionbreaker-cyclosword" : "umbral-collector", `Durability band: ${scores}`);
  assert.ok(result.trace.some((step) => step.nodeId === "tanky" && !step.hypothetical));
  assert.ok(result.alternates.every((route) => route.buildId !== "main-bastionbreaker"));
}

assert.equal(runDecisionTree(context([3, 3, 2, 2, 2])).buildId, "main-hubris", "Standard Hubris now starts at durability 12");
assert.equal(runDecisionTree(context([3, 3, 3, 2, 2])).buildId, "main-hubris");
assert.equal(runDecisionTree(context([3, 3, 3, 3, 3])).buildId, "hubris-ldr");
for (const stealth of ["Rengar", "Evelynn", "Shaco"]) {
  assert.equal(runDecisionTree(context([3, 3, 3, 2, 2], stealth)).buildId, "main-hubris", `${stealth} no longer overrides Hubris`);
  assert.equal(runDecisionTree(context([3, 3, 3, 3, 3], stealth)).buildId, "hubris-ldr", `${stealth} preserves Titansbane`);
}

for (const [scores, expected] of [
  [[1, 1, 1, 1, 1], undefined],
  [[1, 1, 1, 2, 2], "umbral-collector"],
  [[1, 1, 2, 2, 2], "bastionbreaker-cyclosword"],
  [[2, 2, 2, 2, 2], undefined],
  [[2, 2, 2, 2, 3], "main-hubris"],
  [[3, 3, 2, 2, 2], "umbral-collector"],
  [[3, 3, 3, 2, 2], "umbral-collector"],
  [[3, 3, 3, 3, 2], "umbral-collector"],
  [[3, 3, 3, 3, 3], "hubris-skip-anti-tank"],
] as const) {
  assert.equal(runDecisionTree(context([...scores])).alternative?.buildId, expected, `Top durability alternative at ${scores}`);
  assert.ok(runDecisionTree(context([...scores])).alternates.length > 0, "Breakdown retains broader durability alternatives");
}

for (const [scores, label, breakdownReason] of [
  [[1, 1, 1, 2, 2], "If they build tankier than expected.", "If they had a little more durability."],
  [[1, 1, 2, 2, 2], "If they build squishier than expected.", "If they had a little less durability."],
  [[2, 2, 2, 2, 3], "If they build tankier than expected.", "If they had a little more durability."],
  [[3, 3, 2, 2, 2], "If you fall behind early", "If they had a little less durability."],
  [[3, 3, 3, 3, 2], "If you fall behind early", "If they had a little more durability."],
  [[3, 3, 3, 3, 3], "If you fall behind early", "If they had a little less durability."],
] as const) {
  const result = runDecisionTree(context([...scores]));
  assert.equal(result.alternative?.label, label, "Top durability alternative explains a practical itemization pivot");
  assert.equal(result.alternates[0]?.reason, breakdownReason, "Breakdown keeps hypothetical wording");
}

for (const [physical, minimum] of [[8, 13], [8.5, 13], [9, 12], [10.5, 12], [11, 11], [12, 11]] as const) {
  for (const durability of [minimum - 1, minimum]) {
    const ctx = context([2, 2, 2, 2, durability - 8]);
    ctx.enemies = ctx.enemies.map((enemy) => ({ ...enemy, damageScore: physical * 2 / 5 }));
    const result = runDecisionTree(ctx);
    const primary = durability < minimum ? "umbral-collector" : "main-hubris";
    const alternative = durability < minimum ? "main-hubris" : "umbral-collector";
    assert.equal(result.buildId, primary, `Physical ${physical}, durability ${durability}`);
    assert.equal(result.alternative?.buildId, alternative, "Alternative follows adjusted physical-damage cutoff");
    const physicalFlags = result.floatTags.filter((tag) => tag.word === "AP" || tag.word === "AD");
    const expectedFlag = physical < 9 && durability === minimum - 1 ? "AP"
      : physical >= 11 && durability === minimum ? "AD" : undefined;
    assert.equal(physicalFlags.length, expectedFlag ? 5 : 0, "Only flag physical damage when it changes the recommendation");
    assert.ok(physicalFlags.every((tag) => tag.word === expectedFlag && tag.side === "enemy"));
  }
  const tanky = context([3, 3, 3, 3, 3]);
  tanky.enemies = tanky.enemies.map((enemy) => ({ ...enemy, damageScore: physical * 2 / 5 }));
  assert.equal(runDecisionTree(tanky).buildId, "hubris-ldr", "Titansbane threshold stays at 15");
}

const lowPhysicalFlags = context([3, 3, 2, 2, 2]);
lowPhysicalFlags.enemies[0].damageType = "AD";
lowPhysicalFlags.enemies[1].damageType = "AP";
lowPhysicalFlags.enemies[4].damageType = "AP";
assert.deepEqual(runDecisionTree(lowPhysicalFlags).floatTags.filter((tag) => tag.word === "AP").map((tag) => tag.championId), ["Champion1", "Champion2", "Champion3", "Champion4"]);
const highPhysicalFlags = context([3, 2, 2, 2, 2]);
highPhysicalFlags.enemies = highPhysicalFlags.enemies.map((enemy, index) => ({ ...enemy,
  damageType: index < 2 ? "AD" : index === 2 ? "Mixed" : "AP",
  damageScore: index === 0 ? 5 : 4,
}));
assert.deepEqual(runDecisionTree(highPhysicalFlags).floatTags.filter((tag) => tag.word === "AD").map((tag) => tag.championId), ["Champion0", "Champion1", "Champion2"]);

const shields = context([2, 2, 2, 2, 2]);
shields.enemies = shields.enemies.map((enemy) => ({ ...enemy, shieldScore: 2 }));
assert.equal(runDecisionTree(shields).buildId, "sit-serpents-first");
// Top slot requires one point; breakdown permits two, regardless of shield timing.
for (const late of [false, true]) {
  for (const shieldTotal of [4, 5, 6, 7]) {
    const nearShields = context([2, 2, 2, 2, 2]);
    nearShields.enemies[0] = { ...nearShields.enemies[0], shieldScore: shieldTotal, shieldTiming: late ? "Late" : null };
    const result = runDecisionTree(nearShields);
    const shieldAlternates = result.alternates.filter((route) => route.buildId.startsWith("sit-serpents"));
    assert.deepEqual(shieldAlternates, shieldTotal === 5 || shieldTotal === 6
      ? [{ buildId: "sit-serpents-late", reason: "If they build extra shields." }]
      : [], `Shield total ${shieldTotal}, late ${late}`);
    assert.equal(result.alternative?.buildId, shieldTotal === 7 ? "sit-serpents" : shieldTotal === 6 ? "sit-serpents-late" : undefined, "Shield builds keep their specific pivot; generic shield fallback requires one point");
    if (shieldTotal === 6) {
      assert.equal(result.alternative?.label, "If they build more shields than expected.");
    }
    assert.equal(result.buildId, shieldTotal === 7 ? (late ? "sit-serpents-late" : "sit-serpents-first") : "umbral-collector");
  }
}
for (const scores of [[1, 1, 1, 1, 1], [1, 1, 2, 2, 2], [3, 3, 2, 2, 2]]) {
  const withShields = context(scores);
  withShields.enemies[0].shieldScore = 6;
  const result = runDecisionTree(withShields);
  assert.equal(result.alternative?.buildId, result.buildId === "main-hubris" ? "umbral-collector" : "sit-serpents-late", "Build-specific alternative wins; shield fallback otherwise takes priority over durability");
  assert.ok(result.alternates.some((route) => route.buildId !== "sit-serpents-late"), "Durability alternative remains in breakdown");
}
const lowDamage = context([2, 2, 2, 2, 2]);
lowDamage.allies = lowDamage.allies.map((ally) => ({ ...ally, damageScore: 1 }));
lowDamage.enemies = lowDamage.enemies.map((enemy) => ({ ...enemy, damageScore: 1 }));
assert.equal(runDecisionTree(lowDamage).buildId, "yun-tal-ldr");
assert.deepEqual(runDecisionTree(lowDamage).alternative, { buildId: "hubris-ldr", label: "If you miss B. F. Sword on first reset" });
const builds = pickerBuildDefs(VIEGO_ITEM_SECTION);
for (const ctx of [lowDamage, shields, context([3, 3, 3, 3, 3])]) {
  const alternative = runDecisionTree(ctx).alternative;
  assert.ok(alternative && builds.some(build => build.id === alternative.buildId), "Every restored alternative exists in the build catalog");
}
for (const assassin of [false, true]) {
  for (const adDamage of [10, 11]) {
    const ad = context([2, 2, 2, 2, 2]);
    ad.enemies = ad.enemies.map((enemy, index) => ({ ...enemy,
      damageType: index < 3 ? "AD" : "AP",
      damageScore: index === 0 ? adDamage - 6 : index < 3 ? 3 : 1,
      ...(assassin && index === 0 ? { championId: "Rengar", name: "Rengar", spellIds: [11] } : {}),
    }));
    const result = runDecisionTree(ad);
    if (adDamage === 10) {
      assert.notEqual(result.buildId, "collector-shieldbow-ga", "AD damage 10 must not recommend AD survivability");
    } else {
      assert.equal(result.buildId, "collector-shieldbow-ga");
      assert.deepEqual(result.boot, { itemId: 3047, slot: 2 });
      assert.deepEqual(result.alternative, { buildId: "survivability-earlier-shieldbow-ad", label: "If you get ahead" });
    }
  }
}
const ap = context([2, 2, 2, 2, 2]);
ap.enemies = ap.enemies.map((enemy) => ({ ...enemy, damageType: "AP", mercuryTreadsScore: 2 }));
const apResult = runDecisionTree(ap);
assert.equal(apResult.buildId, "collector-shieldbow");
assert.deepEqual(apResult.boot, { itemId: 3111, slot: 2 });
assert.equal(apResult.alternative?.buildId, "survivability-earlier-shieldbow");
for (const mercs of [7, 8]) {
  const atBoundary = { ...ap, enemies: ap.enemies.map((enemy, index) => ({ ...enemy, mercuryTreadsScore: index === 0 ? mercs : 0 })) };
  assert.equal(runDecisionTree(atBoundary).buildId === "collector-shieldbow", mercs === 8, `AP survival Mercs ${mercs}`);
}
for (const [mercs, damagePerChampion, expectedBoot, expectedSlot] of [
  [8, 2, 3009, 4],
  [9, 2, 3111, 3],
  [9, 2.5, 3111, 4],
  [9, 3, 3009, 4],
] as const) {
  const normal = context([2, 2, 2, 2, 2]);
  normal.enemies = normal.enemies.map((enemy, index) => ({ ...enemy, damageScore: damagePerChampion, mercuryTreadsScore: index === 0 ? mercs : 0 }));
  assert.deepEqual(runDecisionTree(normal).boot, { itemId: expectedBoot, slot: expectedSlot }, `Normal Mercs ${mercs}, damage ${damagePerChampion * 5}`);
}
for (const [scores, expectedBoot] of [
  [[2, 2, 2, 2, 2], 3009],
  [[2, 2, 2, 2, 3], 3009],
  [[2, 2, 2, 3, 3], 3009],
  [[2, 2, 3, 3, 3], 3008],
] as const) {
  assert.equal(runDecisionTree(context([...scores])).boot.itemId, expectedBoot, `Swifties durability ${scores}`);
}
for (const [id, items] of [
  ["collector-shieldbow-ga", [6676, 3036, 6673, 3031, 3026]],
  ["collector-shieldbow", [6676, 3036, 6673, 3031, 6699]],
  ["survivability-earlier-shieldbow-ad", [6676, 6673, 3036, 3026, 3031]],
  ["survivability-earlier-shieldbow", [6676, 6673, 3036, 3031, 6699]],
] as const) {
  assert.deepEqual(builds.find((build) => build.id === id)?.itemIds, [...items], id);
}
console.log("Build picker recommendation, alternative, and survivability checks passed.");
