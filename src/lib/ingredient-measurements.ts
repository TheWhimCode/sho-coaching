type Numeric = number | string | { toString(): string } | null | undefined;

export function numberOrNull(value: Numeric): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function ingredientGrams(ingredient: {
  weightGrams?: Numeric; count?: Numeric; gramsPerCount?: Numeric;
  groceryItem?: { gramsPerCount?: Numeric } | null;
}): number | null {
  const weight = numberOrNull(ingredient.weightGrams);
  if (weight !== null) return weight;
  const count = numberOrNull(ingredient.count);
  const conversion = numberOrNull(ingredient.gramsPerCount) ?? numberOrNull(ingredient.groceryItem?.gramsPerCount);
  if (count === 0) return 0;
  return count !== null && conversion !== null && conversion > 0 ? count * conversion : null;
}

export const nutrientKeys = [
  'calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'fibreGrams',
  'saturatedFatGrams', 'sugarGrams', 'sodiumMg', 'potassiumMg', 'calciumMg',
  'magnesiumMg', 'ironMg', 'zincMg', 'vitaminDMcg', 'vitaminB12McG',
  'folateMcg', 'iodineMcg', 'omega3AlAGrams', 'omega3EpaDhaMg',
] as const;

// Calculate only complete nutrient totals. Never present a partial sum as a full meal.
export function recipeNutritionFromIngredients(recipe: {
  servings: number | null;
  ingredients: (Parameters<typeof ingredientGrams>[0] & {
    optional: boolean; pantryStaple?: boolean;
    groceryItem?: { gramsPerCount?: Numeric; nutritionPer100g?: unknown; excludeFromNutrition?: boolean } | null;
  })[];
}) {
  // Unlinked pantry staples are kept for readable instructions, not nutrition totals.
  const required = recipe.ingredients.filter(i => !i.optional && !i.groceryItem?.excludeFromNutrition && !(i.pantryStaple && !i.groceryItem));
  const servings = recipe.servings ?? 1;
  let computed = 0;
  const values = Object.fromEntries(nutrientKeys.map(key => {
    let total = 0;
    const complete = servings > 0 && required.length > 0 && required.every(ingredient => {
      const grams = ingredientGrams(ingredient);
      if (grams === 0) return true;
      const profile = ingredient.groceryItem?.nutritionPer100g;
      const value = profile && typeof profile === 'object' ? (profile as Record<string, unknown>)[key] : null;
      if (grams === null || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return false;
      total += grams * value / 100;
      return true;
    });
    if (complete) computed++;
    return [key, complete ? total / servings : null];
  })) as Record<typeof nutrientKeys[number], number | null>;
  return {
    ...values,
    basis: computed === nutrientKeys.length
      ? 'Estimated per serving from groceries, including measured oil and salt; excludes spices and optional garnish; no cooking-loss adjustment.'
      : computed > 0
        ? 'Estimated per serving from groceries, including measured oil and salt; excludes spices and optional garnish. Missing nutrient values remain unknown; no cooking-loss adjustment.'
        : 'Nutrition incomplete: required ingredient weights or grocery nutrient values are missing.',
  };
}

export function stockAfterEdit(lot: {
  purchasedCount: Numeric; purchasedWeightGrams: Numeric;
  groceryItem: { gramsPerCount: Numeric };
}, field: 'count' | 'grams', value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error('Use a non-negative number');
  const purchasedCount = numberOrNull(lot.purchasedCount);
  const purchasedGrams = numberOrNull(lot.purchasedWeightGrams);
  const ratio = numberOrNull(lot.groceryItem.gramsPerCount) ?? (purchasedCount && purchasedGrams ? purchasedGrams / purchasedCount : null);
  return field === 'count'
    ? { count: value, grams: value === 0 ? 0 : ratio ? value * ratio : null }
    : { grams: value, count: value === 0 ? 0 : ratio ? value / ratio : null };
}
