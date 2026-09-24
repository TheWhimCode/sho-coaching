import { ingredientGrams, numberOrNull } from './ingredient-measurements';

type Numeric = Parameters<typeof numberOrNull>[0];
type Lot = {
  remainingWeightGrams: Numeric; remainingCount: Numeric;
  expiresAt: Date | null; purchasedAt: Date; openedAt: Date | null; usualShelfLifeDays: number | null;
};
type Ingredient = Parameters<typeof ingredientGrams>[0] & {
  optional: boolean; amount: string; groceryItemId: string | null;
  groceryItem?: { gramsPerCount?: Numeric; lots: Lot[] } | null;
};
type StockRecipe = { servings: number | null; ingredients: Ingredient[] };

export function stockedGrams(lots: Lot[], gramsPerCount: Numeric, now = new Date()) {
  const ratio = numberOrNull(gramsPerCount);
  return lots.reduce((total, lot) => {
    const expiry = lot.expiresAt ?? (lot.usualShelfLifeDays !== null
      ? new Date((lot.openedAt ?? lot.purchasedAt).getTime() + lot.usualShelfLifeDays * 86400000) : null);
    if (expiry && expiry <= now) return total;
    const count = numberOrNull(lot.remainingCount);
    return total + (numberOrNull(lot.remainingWeightGrams) ?? (ratio && count !== null ? ratio * count : 0));
  }, 0);
}

export function availableWithAddon(main: StockRecipe, addon: StockRecipe, now = new Date()) {
  // Add-on ingredients represent one complete mini recipe, regardless of main portions.
  const max = main.servings === null ? Math.min(1, availableRecipeServings(main, now)) : availableRecipeServings(main, now);
  for (let portions = max; portions >= 1; portions--) {
    const combined: StockRecipe = { servings: 1, ingredients: [
      ...main.ingredients.map(ingredient => ({ ...ingredient, weightGrams: ingredientGrams(ingredient) === null ? null : ingredientGrams(ingredient)! * portions / (main.servings ?? 1) })),
      ...addon.ingredients,
    ] };
    if (availableRecipeServings(combined, now) >= 1) return portions;
  }
  return 0;
}

// Whole portions available now. Planning does not reserve or consume inventory.
export function availableRecipeServings(recipe: { servings: number | null; ingredients: Ingredient[] }, now = new Date()): number {
  const yieldCount = recipe.servings ?? 1;
  if (yieldCount <= 0 || recipe.ingredients.length === 0) return 0;
  const needs = new Map<string, { grams: number; available: number }>();
  for (const ingredient of recipe.ingredients) {
    if (ingredient.optional || (!ingredient.amount.trim() && ingredient.count == null && ingredient.weightGrams == null)) continue;
    const grams = ingredientGrams(ingredient);
    if (grams === 0) continue;
    if (grams === null || !ingredient.groceryItemId || !ingredient.groceryItem) return 0;
    const previous = needs.get(ingredient.groceryItemId);
    if (previous) { previous.grams += grams / yieldCount; continue; }
    const available = stockedGrams(ingredient.groceryItem.lots, ingredient.groceryItem.gramsPerCount, now);
    needs.set(ingredient.groceryItemId, { grams: grams / yieldCount, available });
  }
  return Math.min(100, ...Array.from(needs.values(), need => Math.max(0, Math.floor((need.available + 0.000001) / need.grams))));
}
