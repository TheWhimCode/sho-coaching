import 'dotenv/config';
import assert from 'node:assert/strict';
import { Prisma, PrismaClient } from '@prisma/client';
import { nutrientKeys } from '../src/lib/ingredient-measurements';

const prisma = new PrismaClient();
async function main() {
  await prisma.$transaction(async tx => {
    const recipe = await tx.recipe.findUniqueOrThrow({ where: { slug: 'mascarpone-pasta' }, include: { nutrition: true } });
    assert.ok(recipe.servings !== null && recipe.servings > 0);
    const factor = recipe.servings / 2;
    if (recipe.nutrition && factor !== 1) {
      const data = Object.fromEntries(nutrientKeys.map(key => [key, recipe.nutrition![key] === null ? null : recipe.nutrition![key]! * factor]));
      await tx.recipeNutrition.update({ where: { recipeId: recipe.id }, data: {
        ...data, basis: 'Estimated per serving (2 servings per recipe); excludes optional garnish. Ingredient quantities unchanged.',
      } });
    }
    await tx.recipe.update({ where: { id: recipe.id }, data: {
      servings: 2,
      calories: recipe.calories === null ? null : Math.round(recipe.calories * factor),
      proteinGrams: recipe.proteinGrams === null ? null : recipe.proteinGrams * factor,
      carbsGrams: recipe.carbsGrams === null ? null : recipe.carbsGrams * factor,
      fatGrams: recipe.fatGrams === null ? null : recipe.fatGrams * factor,
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  const result = await prisma.recipe.findUniqueOrThrow({ where: { slug: 'mascarpone-pasta' }, include: { nutrition: true } });
  assert.equal(result.servings, 2);
  console.log(JSON.stringify({ servings: result.servings, caloriesPerServing: result.nutrition?.calories, proteinPerServing: result.nutrition?.proteinGrams }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
