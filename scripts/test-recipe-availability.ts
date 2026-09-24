import assert from 'node:assert/strict';
import { availableRecipeServings, availableWithAddon } from '../src/lib/recipe-availability';

const now = new Date('2026-09-24T12:00:00Z');
const lot = { remainingWeightGrams: 100, remainingCount: 2, expiresAt: null, purchasedAt: now, openedAt: null, usualShelfLifeDays: null };
const ingredient = { optional: false, amount: '50', weightGrams: 50, count: null, groceryItemId: 'spinach', groceryItem: { gramsPerCount: 50, lots: [lot] } };
const recipe = { servings: 1, ingredients: [ingredient] };
assert.equal(availableRecipeServings(recipe, now), 2);
assert.equal(availableRecipeServings({ ...recipe, servings: 2 }, now), 4);
assert.equal(availableRecipeServings({ ...recipe, servings: null }, now), 2);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [] }, now), 0);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, groceryItemId: null, groceryItem: null }] }, now), 0);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, groceryItem: { ...ingredient.groceryItem, lots: [] } }] }, now), 0);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [ingredient, ingredient] }, now), 1, 'Duplicate ingredients must add up');
const essential = { ...ingredient, amount: '', weightGrams: null, groceryItemId: null, groceryItem: null };
assert.equal(availableRecipeServings({ ...recipe, ingredients: [ingredient, essential, { ...essential, amount: '5', optional: true }] }, now), 2);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, weightGrams: null, count: 1 }] }, now), 2);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, weightGrams: null, count: null }] }, now), 0, 'Unknown required amount must block');
for (const lots of [
  [{ ...lot, remainingWeightGrams: 0 }],
  [{ ...lot, expiresAt: new Date('2026-09-23') }],
  [{ ...lot, purchasedAt: new Date('2026-09-20'), usualShelfLifeDays: 2 }],
]) assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, groceryItem: { ...ingredient.groceryItem, lots } }] }, now), 0);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, groceryItem: { ...ingredient.groceryItem, lots: [lot, lot] } }] }, now), 4);
assert.equal(availableRecipeServings({ ...recipe, ingredients: [{ ...ingredient, groceryItem: { ...ingredient.groceryItem, lots: [{ ...lot, remainingWeightGrams: null }] } }] }, now), 2);
console.log('Recipe availability tests passed: quantities, portions, missing/optional/essential ingredients, duplicates, expiry, multiple lots and count conversions.');
const addon = { servings: null, ingredients: [{ ...ingredient, weightGrams: 25 }] };
assert.equal(availableWithAddon(recipe, addon, now), 1, '100 g cannot cover two 50 g mains plus a 25 g add-on');
assert.equal(availableWithAddon({ ...recipe, servings: 2 }, addon, now), 3, 'Add-on must stay at 25 g, not multiply with portions');
assert.equal(availableWithAddon({ ...recipe, servings: null }, addon, now), 1);
assert.equal(availableWithAddon(recipe, { ...addon, ingredients: [{ ...ingredient, groceryItemId: null }] }, now), 0);
console.log('Combined meal/add-on stock and fixed quantity tests passed.');
