import { prisma } from "@/lib/prisma";
import RecipesBoard from "./RecipesBoard";
import type { Recipe } from "./recipes";
import { ingredientGrams, numberOrNull, recipeNutritionFromIngredients } from "@/lib/ingredient-measurements";
import { stockedGrams } from "@/lib/recipe-availability";

export const dynamic = "force-dynamic";

export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ category?: string; recipe?: string }> }) {
  const params = await searchParams;
  const [stored, cooks] = await Promise.all([
    prisma.recipe.findMany({ orderBy: { createdAt: "asc" }, include: { ingredients: { orderBy: { sortOrder: "asc" }, include: { groceryItem: { include: { lots: true } } } }, steps: { orderBy: { sortOrder: "asc" } }, nutrition: true } }),
    prisma.recipeCook.groupBy({ by: ["recipeId"], _sum: { remainingServings: true }, where: { remainingServings: { gt: 0 } } }),
  ]);
  // Free cooked portions per recipe: not yet assigned to a planned meal.
  const fridge = Object.fromEntries(cooks.map(cook => [cook.recipeId, Math.floor((cook._sum.remainingServings ?? 0) + 0.000001)]));
  const rows = stored.map(recipe => ({ ...recipe, nutrition: recipeNutritionFromIngredients(recipe) }));
  const recipes: Recipe[] = rows.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    familyKey: recipe.familyKey,
    familyTitle: recipe.familyTitle,
    variantLabel: recipe.variantLabel,
    summary: recipe.summary,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    tags: recipe.tags,
    calories: recipe.calories,
    notes: recipe.notes,
    ingredients: recipe.ingredients.map((ingredient) => {
      const unmeasured = !ingredient.amount.trim() && ingredient.count == null && ingredient.weightGrams == null;
      const needGrams = ingredient.optional || unmeasured ? null : ingredientGrams(ingredient);
      const haveGrams = ingredient.groceryItem ? stockedGrams(ingredient.groceryItem.lots, ingredient.groceryItem.gramsPerCount) : null;
      return {
        id: ingredient.id, amount: ingredient.amount, unit: ingredient.unit, name: ingredient.name, note: ingredient.note, optional: ingredient.optional,
        groceryItemId: ingredient.groceryItemId,
        needGrams, haveGrams, packGrams: numberOrNull(ingredient.groceryItem?.gramsPerCount),
      };
    }),
    steps: recipe.steps.map(({ id, text }) => ({ id, text })),
    nutrition: {
      basis: recipe.nutrition?.basis ?? "estimated per serving; excludes optional garnish",
      values: [
        ["Calories", recipe.nutrition?.calories ?? recipe.calories, "kcal"], ["Protein", recipe.nutrition?.proteinGrams ?? recipe.proteinGrams, "g"], ["Carbs", recipe.nutrition?.carbsGrams ?? recipe.carbsGrams, "g"], ["Fat", recipe.nutrition?.fatGrams ?? recipe.fatGrams, "g"], ["Fibre", recipe.nutrition?.fibreGrams ?? null, "g"], ["Saturated fat", recipe.nutrition?.saturatedFatGrams ?? null, "g"], ["Sugar", recipe.nutrition?.sugarGrams ?? null, "g"], ["Sodium", recipe.nutrition?.sodiumMg ?? null, "mg"], ["Potassium", recipe.nutrition?.potassiumMg ?? null, "mg"], ["Calcium", recipe.nutrition?.calciumMg ?? null, "mg"], ["Magnesium", recipe.nutrition?.magnesiumMg ?? null, "mg"], ["Iron", recipe.nutrition?.ironMg ?? null, "mg"], ["Zinc", recipe.nutrition?.zincMg ?? null, "mg"], ["Vitamin D", recipe.nutrition?.vitaminDMcg ?? null, "mcg"], ["Vitamin B12", recipe.nutrition?.vitaminB12McG ?? null, "mcg"], ["Folate", recipe.nutrition?.folateMcg ?? null, "mcg"], ["Iodine", recipe.nutrition?.iodineMcg ?? null, "mcg"], ["Omega-3 ALA", recipe.nutrition?.omega3AlAGrams ?? null, "g"], ["Omega-3 EPA/DHA", recipe.nutrition?.omega3EpaDhaMg ?? null, "mg"],
      ].map(([label, value, unit]) => ({ label: label as string, value: value as number | null, unit: unit as string })).filter((item) => item.value !== null && item.value >= (item.unit === "g" ? 0.1 : 1)),
    },
  }));
  return <RecipesBoard recipes={recipes} fridge={fridge} category={params.category ?? null} recipeId={params.recipe ?? null} />;
}
