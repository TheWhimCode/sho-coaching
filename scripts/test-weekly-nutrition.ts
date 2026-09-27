import assert from 'node:assert/strict';
import { weeklyNutrient } from '../src/lib/weekly-nutrition';

const unknownDay = [{ nutrition: { iodineMcg: null } }, { nutrition: {} }];
const knownDay = [{ nutrition: { iodineMcg: 100 } }, { nutrition: { iodineMcg: 200 } }];
const result = weeklyNutrient([unknownDay, knownDay], 'iodineMcg');
assert.deepEqual(result, { value: 300, known: 2, mealsCount: 2, trackedDays: 1 });
assert.equal(result.value / result.trackedDays, 300);
assert.equal(weeklyNutrient([unknownDay], 'iodineMcg').trackedDays, 0);
assert.equal(weeklyNutrient([], 'iodineMcg').trackedDays, 0);
const zeroDay = [{ nutrition: { iodineMcg: 0 } }];
assert.equal(weeklyNutrient([zeroDay, knownDay], 'iodineMcg').trackedDays, 2);
assert.equal(weeklyNutrient([zeroDay, knownDay], 'iodineMcg').value / 2, 150);
const partial = weeklyNutrient([[...knownDay, ...unknownDay]], 'iodineMcg');
assert.equal(partial.trackedDays, 1);
assert.ok(partial.known < partial.mealsCount);
assert.equal(weeklyNutrient([knownDay], 'omega3EpaDhaMg').trackedDays, 0);
console.log('Per-nutrient day counts, unknown days, known zeros and partial coverage passed.');
