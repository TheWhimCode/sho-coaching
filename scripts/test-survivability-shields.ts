import assert from "node:assert/strict";
import { runDecisionTree, type TreeParticipant } from "../src/lib/guides/buildPicker/decisionTree";

function champion(name: string, overrides: Partial<TreeParticipant> = {}): TreeParticipant {
  return {
    name, championId: name, spellIds: [4, 12], shields: "None", shieldScore: 0,
    damageType: "AD", damageThreat: "Medium", damageScore: 3, durabilityScore: 2,
    deniesResets: false, cc: "Medium", ccScore: 2, mercuryTreadsScore: 3,
    ...overrides,
  };
}
const allies = (shields: number) => Array.from({ length: 5 }, (_, i) => champion(`Ally${i}`, { shieldScore: i === 0 ? shields : 0 }));
const enemies = (assassin: string, magic: boolean) => [
  champion(assassin),
  ...Array.from({ length: 4 }, (_, i) => champion(`Enemy${i}`, { damageType: magic ? "AP" : "AD" })),
];
const shieldbowBuilds = new Set(["collector-shieldbow", "collector-shieldbow-ga"]);
for (const assassin of ["Kha'Zix", "Khazix", "Talon", "Kayn", "Rengar", "Shaco", "Qiyana"]) {
  for (const magic of [false, true]) {
    const roster = enemies(assassin, magic);
    assert.ok(shieldbowBuilds.has(runDecisionTree({ allies: allies(4), enemies: roster }).buildId), `${assassin}: allow at 4 shields (${magic})`);
    const result = runDecisionTree({ allies: allies(5), enemies: roster });
    assert.ok(!shieldbowBuilds.has(result.buildId), `${assassin}: block at 5 shields (${magic})`);
    assert.equal(result.trace.find(step => step.nodeId === "survivability")?.ruleId, "v2");
  }
}
assert.ok(shieldbowBuilds.has(runDecisionTree({ allies: allies(10), enemies: enemies("Zed", false) }).buildId), "Unlisted champions do not block the build");
for (const bonus of [{ spellIds: [4, 21] }, { perkIds: [8465] }]) {
  const team = allies(4);
  team[1] = { ...team[1], ...bonus };
  assert.ok(!shieldbowBuilds.has(runDecisionTree({ allies: team, enemies: enemies("Kayn", false) }).buildId), "Barrier/Guardian count toward the same cutoff");
}
const jungleRengar = enemies("Rengar", false);
jungleRengar[0].spellIds = [4, 11];
assert.equal(runDecisionTree({ allies: allies(4), enemies: jungleRengar }).boot.slot, 3);
assert.ok(!shieldbowBuilds.has(runDecisionTree({ allies: allies(5), enemies: jungleRengar }).buildId));
console.log("Survivability allied-shield restrictions passed.");
