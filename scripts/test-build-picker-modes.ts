import assert from "node:assert/strict";
import { isSupportedPickerGame } from "../src/lib/guides/buildPicker/supportedGame";

const standardGame = {
  mapId: 11,
  gameMode: "CLASSIC",
  queueId: 420,
  participants: Array.from({ length: 10 }, (_, index) => ({ teamId: index < 5 ? 100 : 200 })),
};

for (const queueId of [400, 420, 430, 440, 490, 700]) {
  assert.equal(isSupportedPickerGame({ ...standardGame, queueId }), true, `Supported queue ${queueId}`);
}
// Map alone must not admit custom, bots, Swiftplay, URF, or future queues.
for (const queueId of [0, 450, 480, 720, 830, 840, 850, 1700, 1900, 9999]) {
  assert.equal(isSupportedPickerGame({ ...standardGame, queueId }), false, `Rejected queue ${queueId}`);
}
assert.equal(isSupportedPickerGame({ ...standardGame, mapId: 12 }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, gameMode: "URF" }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, mapId: undefined }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, gameMode: undefined }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, queueId: undefined }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, participants: standardGame.participants.slice(1) }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, participants: Array(10).fill({ teamId: 100 }) }), false);
assert.equal(isSupportedPickerGame({ ...standardGame, participants: [...standardGame.participants.slice(1), { teamId: 300 }] }), false);

console.log("Build picker mode restrictions passed.");
