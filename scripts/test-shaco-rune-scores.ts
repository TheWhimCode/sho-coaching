import assert from "node:assert/strict";
import { applyRuneScoreOverrides } from "../src/lib/guides/buildPicker/runeScoreOverrides";
import { runDecisionTree, type TreeParticipant } from "../src/lib/guides/buildPicker/decisionTree";

const shaco: TreeParticipant = {
  name: "Shaco", championId: "Shaco", spellIds: [4, 11], shields: "None", shieldScore: 0,
  durabilityScore: 1, damageType: "AP", damageThreat: "High", damageScore: 3,
  cc: "Medium", ccScore: 4, mercuryTreadsScore: 3, deniesResets: false, canBuildSteelcaps: false,
};
for (const perkIds of [undefined, [], [5008, 5005], [999999], [8229, 8226], [8992, 8226]]) {
  const original = { ...shaco, perkIds };
  assert.strictEqual(applyRuneScoreOverrides(original), original, "Comet, Deathfire and missing runes keep the base profile");
  assert.equal(applyRuneScoreOverrides({ ...original, damageType: "Mixed" as const }).damageType, "AP", "Default Shaco is AP even with a stale cached profile");
}

const other: TreeParticipant = { ...shaco, name: "Other", championId: "Other", perkIds: [9923] };
assert.strictEqual(applyRuneScoreOverrides(other), other, "Only Shaco changes");

for (const keystone of [8112, 8128, 9923, 8351, 8360, 8369, 8005, 8008, 8021, 8010, 8437, 8439, 8465, 8214, 8230]) {
  const original = { ...shaco, perkIds: [keystone, 8226, 5008] };
  const expected = { ...original, damageType: "AD" as const, ccScore: 2, mercuryTreadsScore: 1, damageScore: 4 };
  assert.deepEqual(applyRuneScoreOverrides(original), expected);
  assert.equal(original.ccScore, 4, "Do not mutate base ratings");
  const teammate = { ...other, ccScore: 5, damageType: "AP" as const };
  // Compare all results, including builds, boots, traces, tags and composition.
  const explicitVariant = expected;
  assert.deepEqual(
    runDecisionTree({ allies: [teammate], enemies: [original] }),
    runDecisionTree({ allies: [teammate], enemies: [explicitVariant] }),
  );
  assert.deepEqual(
    runDecisionTree({ allies: [original], enemies: [teammate] }),
    runDecisionTree({ allies: [explicitVariant], enemies: [teammate] }),
    "Allied CC and damage use the variation too",
  );
}
const base = runDecisionTree({ allies: [other], enemies: [shaco] });
const variant = runDecisionTree({ allies: [other], enemies: [{ ...shaco, perkIds: [9923] }] });
assert.equal(base.composition.cc, 4);
assert.equal(base.composition.damage, 3);
assert.equal(variant.composition.cc, 2);
assert.equal(variant.composition.damage, 4);
assert.match(variant.trace.find(step => step.nodeId === "boots")!.detail, /mercs 1/);
assert.match(base.trace.find(step => step.nodeId === "boots")!.detail, /magic 3/);
assert.match(variant.trace.find(step => step.nodeId === "boots")!.detail, /magic 0/);
assert.equal(shaco.ccScore, 4);
console.log("Shaco keystone variants, default/random fallback, ally/enemy scoring, Mercs totals and immutable profiles passed.");
