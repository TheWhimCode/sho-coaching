import assert from "node:assert/strict";
import { moodEntryInputSchema, moodRatingFields } from "../src/lib/mood-entries";
const recordedAt = "2026-10-21T08:30:15.123Z";
for (const field of moodRatingFields) {
  for (const rating of [1, 2, 3, 4, 5]) assert.equal(moodEntryInputSchema.safeParse({ recordedAt, [field]: rating }).success, true);
  for (const rating of [0, 6, -1, 1.5, NaN, Infinity, "3", true]) assert.equal(moodEntryInputSchema.safeParse({ recordedAt, [field]: rating }).success, false);
}
for (const ratings of [{}, Object.fromEntries(moodRatingFields.map(field => [field, null]))]) {
  assert.equal(moodEntryInputSchema.safeParse({ recordedAt, ...ratings }).success, false);
}
assert.equal(moodEntryInputSchema.safeParse({ recordedAt, mood: null, energy: 2, note: null }).success, true);
assert.equal(moodEntryInputSchema.safeParse({ recordedAt, mood: 1, energy: 6 }).success, false);
assert.equal(moodEntryInputSchema.safeParse({ recordedAt, mood: 3, userId: "unexpected" }).success, false);
for (const invalid of ["2026-10-21T08:30:00", "2026-02-30T08:00:00Z", new Date(NaN), undefined]) {
  assert.equal(moodEntryInputSchema.safeParse({ recordedAt: invalid, mood: 3 }).success, false);
}
const morning = moodEntryInputSchema.parse({ recordedAt, mood: 2 });
const evening = moodEntryInputSchema.parse({ recordedAt: "2026-10-21T20:30:15.123Z", energy: 4 });
assert.notEqual(morning.recordedAt.getTime(), evening.recordedAt.getTime());
assert.equal(morning.recordedAt.toISOString().slice(0, 10), evening.recordedAt.toISOString().slice(0, 10));
assert.equal(moodEntryInputSchema.parse({ recordedAt: "2026-10-21T10:30:15.123+02:00", mood: 3 }).recordedAt.toISOString(), recordedAt);
assert.equal(moodEntryInputSchema.parse({ ...morning, mood: null, stress: 5, note: "Corrected entry" }).stress, 5);
assert.equal(moodEntryInputSchema.safeParse({ ...morning, mood: null }).success, false);
console.log("Mood entry validation tests passed.");
