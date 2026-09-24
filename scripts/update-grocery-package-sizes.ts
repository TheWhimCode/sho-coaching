import 'dotenv/config';
import assert from 'node:assert/strict';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const sizes = [['spaghetti', 500], ['pasta', 500], ['almond milk', 1000]] as const;

async function main() {
  await prisma.$transaction(async tx => {
    const banana = await tx.groceryItem.findUniqueOrThrow({ where: { name: 'banana' } });
    const duplicate = await tx.groceryItem.findUnique({ where: { name: 'bananas' } });
    if (duplicate) {
      // Do not silently discard a conflicting product definition.
      assert.equal(String(duplicate.gramsPerCount), String(banana.gramsPerCount));
      assert.equal(JSON.stringify(duplicate.nutritionPer100g), JSON.stringify(banana.nutritionPer100g));
      assert.equal(duplicate.nutritionSource, banana.nutritionSource);
      assert.equal(duplicate.category, banana.category);
      await tx.recipeIngredient.updateMany({ where: { groceryItemId: duplicate.id }, data: { groceryItemId: banana.id } });
      // Moving lots preserves their reservations and transaction history.
      await tx.groceryLot.updateMany({ where: { groceryItemId: duplicate.id }, data: { groceryItemId: banana.id } });
      await tx.groceryItem.delete({ where: { id: duplicate.id } });
    }

    for (const [name, grams] of sizes) {
      const product = await tx.groceryItem.update({ where: { name }, data: {
        gramsPerCount: grams, weightBasis: `One standard package: ${grams} g (user-defined)`,
      } });
      const lots = await tx.groceryLot.findMany({ where: { groceryItemId: product.id } });
      for (const lot of lots) {
        // Preserve known physical stock; derive count in the new standard packages.
        const purchasedWeightGrams = lot.purchasedWeightGrams ?? lot.purchasedCount?.mul(grams) ?? null;
        const remainingWeightGrams = lot.remainingWeightGrams ?? lot.remainingCount?.mul(grams) ?? null;
        const purchasedCount = purchasedWeightGrams?.div(grams).toDecimalPlaces(6) ?? null;
        const remainingCount = remainingWeightGrams?.div(grams).toDecimalPlaces(6) ?? null;
        await tx.groceryLot.update({ where: { id: lot.id }, data: {
          purchasedWeightGrams, remainingWeightGrams, purchasedCount, remainingCount,
          ...(purchasedCount !== null ? { purchasedAmount: purchasedCount.toString() } : {}),
          ...(remainingCount !== null ? { remainingAmount: remainingCount.toString() } : {}),
        } });
      }
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });

  assert.equal(await prisma.groceryItem.count({ where: { name: 'bananas' } }), 0);
  const banana = await prisma.groceryItem.findUniqueOrThrow({ where: { name: 'banana' } });
  const ingredients = await prisma.recipeIngredient.findMany({ where: { name: { in: ['banana', 'bananas'] } } });
  assert.ok(ingredients.every(i => i.groceryItemId === banana.id));
  for (const [name, grams] of sizes) {
    const product = await prisma.groceryItem.findUniqueOrThrow({ where: { name } });
    assert.equal(Number(product.gramsPerCount), grams);
  }
  console.log('Verified: banana references consolidated; spaghetti 500 g, pasta 500 g, almond milk 1000 g per count.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
