import assert from 'node:assert/strict';
import { foodDateSchema, outsideMealSchema, outsideMealNutrition } from '../src/lib/outside-meals';

const dessert = outsideMealSchema.parse({
  id: 'dessert-test', date: '2026-09-27', mealSlot: 'lunch', name: 'Dessert',
  amount: 0.8, portion: 'full glass', nutrition: { calories: 550, proteinGrams: 8, sodiumMg: 0, iodineMcg: null },
});
const eaten = outsideMealNutrition(dessert);
assert.equal(eaten.calories, 440);
assert.equal(eaten.proteinGrams, 6.4);
assert.equal(eaten.sodiumMg, 0);
assert.equal(eaten.iodineMcg, null);
assert.equal(eaten.vitaminDMcg, null);
assert.equal(dessert.nutrition.calories, 550);
for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', 'yesterday']) assert.equal(foodDateSchema.safeParse(date).success, false);
assert.equal(foodDateSchema.safeParse('2028-02-29').success, true);
for (const amount of [0, -1, Infinity, NaN, 101]) assert.equal(outsideMealSchema.safeParse({ ...dessert, amount }).success, false);
for (const nutrition of [{}, { calories: null }, { calories: -1 }, { calories: Infinity }, { calories: 1, mystery: 4 }]) {
  assert.equal(outsideMealSchema.safeParse({ ...dessert, nutrition }).success, false);
}
assert.equal(outsideMealSchema.safeParse({ ...dessert, mealSlot: 'invalid' }).success, false);
assert.equal(outsideMealSchema.safeParse({ ...dessert, name: ' ' }).success, false);
assert.equal(outsideMealSchema.safeParse({ ...dessert, recipeId: 'unexpected' }).success, false);
console.log('Outside meal validation, fractional intake, units and unknown-nutrient tests passed.');
