import assert from 'node:assert/strict';
import { nextShoppingGrams, purchaseQuantity } from '../src/lib/shopping';

assert.equal(purchaseQuantity(400, 600), 600);
assert.equal(purchaseQuantity(600, 600), 600);
assert.equal(purchaseQuantity(601, 600), 1200);
assert.equal(purchaseQuantity(25, 100), 100);
assert.equal(purchaseQuantity(50, null), 50);
assert.equal(purchaseQuantity(0, 100), 0);
assert.equal(nextShoppingGrams(0, 600, 400, 600), 600, 'An existing pack already covers the recipe');
assert.equal(nextShoppingGrams(0, 600, 700, 600), 1200, 'Raise the line to the next full pack');
assert.equal(nextShoppingGrams(25, 0, 50, 100), 100);
console.log('Shopping pack rounding tests passed.');
