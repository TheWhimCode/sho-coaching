import assert from "node:assert/strict";
import { matchInputPlatform } from "../src/lib/guides/buildPicker/lookupInput";

assert.equal(matchInputPlatform("8015357169"), "selected");
assert.equal(matchInputPlatform(" EUW1_8015357169 "), "euw1");
assert.equal(matchInputPlatform("na1_1234567890"), "na1");
assert.equal(matchInputPlatform("EUW1_ 8015357169"), "euw1");
for (const input of ["", "123", "Viego", "Player#EUW", "EUW1_", "FAKE_1234567890"]) {
  assert.equal(matchInputPlatform(input), null, `Do not treat ${input} as a match ID`);
}
console.log("Build picker input detection passed.");
