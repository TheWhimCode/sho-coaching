import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ingredientGrams, numberOrNull } from './ingredient-measurements';
import { assignCookToPlans } from './meal-plan';

export class StockError extends Error {}

export async function cookRecipe(recipeId: string, servings: number, requestId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(tx => consumeRecipe(tx, recipeId, servings, requestId), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code) && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error('Could not save cooking event.');
}

// Caller must supply a serializable transaction; failure rolls back all deductions.
export async function consumeRecipe(tx: Prisma.TransactionClient, recipeId: string, servings: number, requestId: string) {
        const existing = await tx.recipeCook.findUnique({ where: { id: requestId } });
        if (existing) {
          if (existing.recipeId !== recipeId || existing.servings !== servings) throw new StockError('This cooking request was already used for another meal.');
          return existing;
        }
        const recipe = await tx.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: { include: { groceryItem: true } } } });
        if (!recipe || (recipe.servings ?? 1) <= 0) throw new StockError('Recipe not found or invalid serving count.');
        const requirements = new Map<string, { grams: number; name: string }>();
        for (const ingredient of recipe.ingredients) {
          // Optional garnish and unmeasured pantry essentials do not block cooking.
          if (ingredient.optional || (!ingredient.amount.trim() && ingredient.count === null && ingredient.weightGrams === null)) continue;
          const grams = ingredientGrams(ingredient);
          if (grams === null || !ingredient.groceryItemId) throw new StockError(`A gram equivalent is missing for ${ingredient.name}.`);
          const previous = requirements.get(ingredient.groceryItemId)?.grams ?? 0;
          requirements.set(ingredient.groceryItemId, { grams: previous + grams * servings / (recipe.servings ?? 1), name: ingredient.name });
        }
        const cooked = await tx.recipeCook.create({ data: { id: requestId, recipeId, servings, remainingServings: servings } });
        for (const [groceryItemId, requirement] of requirements) {
          let needed = requirement.grams;
          const lots = await tx.groceryLot.findMany({ where: { groceryItemId }, include: { groceryItem: true }, orderBy: [{ expiresAt: { sort: 'asc', nulls: 'last' } }, { purchasedAt: 'asc' }] });
          for (const lot of lots) {
            if (needed < 0.0005) break;
            const expiry = lot.expiresAt ?? (lot.usualShelfLifeDays !== null ? new Date((lot.openedAt ?? lot.purchasedAt).getTime() + lot.usualShelfLifeDays * 86400000) : null);
            if (expiry && expiry.getTime() <= Date.now()) continue;
            const ratio = numberOrNull(lot.groceryItem.gramsPerCount);
            const count = numberOrNull(lot.remainingCount);
            const available = numberOrNull(lot.remainingWeightGrams) ?? (ratio && count !== null ? ratio * count : 0);
            const used = Math.min(available, needed);
            if (used <= 0) continue;
            const remainingGrams = Math.round((available - used) * 1000) / 1000;
            const remainingCount = remainingGrams === 0 ? 0 : ratio ? remainingGrams / ratio : null;
            await tx.groceryLot.update({ where: { id: lot.id }, data: {
              remainingWeightGrams: remainingGrams, remainingCount,
              remainingAmount: String(remainingCount ?? remainingGrams),
            } });
            await tx.groceryTransaction.create({ data: { groceryLotId: lot.id, recipeCookId: cooked.id, amountDelta: -used, reason: 'cooked: grams' } });
            needed -= used;
          }
          if (needed >= 0.0005) throw new StockError(`Not enough ${requirement.name} in stock (missing approximately ${Math.ceil(needed)} g).`);
        }
        // Planned meals waiting on this recipe take their portions now; the rest sits in the fridge.
        const { remaining } = await assignCookToPlans(tx, cooked);
        return { ...cooked, remainingServings: remaining };
}
