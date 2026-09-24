export type PlannedMeal = { recipeId: string; servings: number; addonRecipeId?: string };
export type Meals = Record<string, PlannedMeal>;

export function validServings(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 100;
}

export function readMealDrafts(value: unknown): Meals {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, meal]) => {
    if (typeof meal === 'string') return meal ? [[key, { recipeId: meal, servings: 1 }]] : [];
    if (!meal || typeof meal !== 'object' || typeof meal.recipeId !== 'string' || !meal.recipeId) return [];
    return [[key, { recipeId: meal.recipeId, servings: typeof meal.servings === 'number' && validServings(meal.servings) ? meal.servings : 1, ...(typeof meal.addonRecipeId === 'string' && meal.addonRecipeId ? { addonRecipeId: meal.addonRecipeId } : {}) }]];
  }));
}

// The main meal scales; a single fixed add-on never does. Missing data stays unknown.
export function mealNutrition(nutrition: Record<string, number | null>, servings: number, addon?: Record<string, number | null>) {
  const scaled = scaleNutrition(nutrition, servings);
  if (!addon) return scaled;
  return Object.fromEntries([...new Set([...Object.keys(scaled), ...Object.keys(addon)])].map(key => [key,
    scaled[key] == null || addon[key] == null ? null : scaled[key] + addon[key],
  ]));
}

export function scaleNutrition(nutrition: Record<string, number | null>, servings: number) {
  return Object.fromEntries(Object.entries(nutrition).map(([key, value]) => [key, value === null ? null : value * servings]));
}
