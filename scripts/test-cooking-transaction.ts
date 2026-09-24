import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { consumeRecipe, StockError } from '../src/lib/cook-recipe';

async function main() {
  const id = randomUUID();
  const rollback = new Error('Intentional test rollback');
  try {
    await prisma.$transaction(async tx => {
      const product = await tx.groceryItem.create({ data: { name: `test-spinach-${id}`, gramsPerCount: 50 } });
      const recipe = await tx.recipe.create({ data: { slug: `test-${id}`, title: 'Rollback test', servings: 2, ingredients: { create: [
        { name: 'test spinach', groceryItemId: product.id, amount: '2', count: 2 },
        { name: 'pantry essential', amount: '' },
      ] } } });
      const lot = await tx.groceryLot.create({ data: { groceryItemId: product.id, purchasedCount: 5, remainingCount: 5, purchasedWeightGrams: 250, remainingWeightGrams: 250, purchasedAmount: '5', remainingAmount: '5' } });
      const requestId = randomUUID();
      await consumeRecipe(tx, recipe.id, 1, requestId);
      let updated = await tx.groceryLot.findUniqueOrThrow({ where: { id: lot.id } });
      assert.equal(Number(updated.remainingCount), 4);
      assert.equal(Number(updated.remainingWeightGrams), 200);
      await consumeRecipe(tx, recipe.id, 1, requestId);
      updated = await tx.groceryLot.findUniqueOrThrow({ where: { id: lot.id } });
      assert.equal(Number(updated.remainingWeightGrams), 200, 'Retry must not deduct twice');
      assert.equal(await tx.groceryTransaction.count({ where: { recipeCookId: requestId } }), 1);
      await assert.rejects(consumeRecipe(tx, recipe.id, 10, randomUUID()), StockError);
      throw rollback;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.recipe.count({ where: { slug: `test-${id}` } }), 0);
  assert.equal(await prisma.groceryItem.count({ where: { name: `test-spinach-${id}` } }), 0);
  const recipe = await prisma.recipe.findUniqueOrThrow({ where: { slug: 'amatriciana' }, include: { ingredients: true, nutrition: true } });
  assert.equal(Number(recipe.ingredients.find(i => i.id === 'amatriciana-pasta')?.weightGrams), 200);
  assert.equal(Number((await prisma.groceryItem.findUniqueOrThrow({ where: { name: 'spinach' } })).gramsPerCount), 100);
  console.log('Verified cooking, linked stock deductions, retry safety, rollback, spinach 100 g/count, Amatriciana 200 g.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
