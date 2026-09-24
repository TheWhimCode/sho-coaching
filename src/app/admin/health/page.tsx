import { prisma } from "@/lib/prisma";
import HealthPlanner from "./HealthPlanner";
import { recipeNutritionFromIngredients } from "@/lib/ingredient-measurements";
export default async function HealthPage() {
  const stored = await prisma.recipe.findMany({ orderBy: { title: "asc" }, include: { nutrition: true, ingredients: { include: { groceryItem: true } } } });
  const recipes = stored.map(recipe => ({ ...recipe, nutrition: recipeNutritionFromIngredients(recipe) }));
  return <HealthPlanner recipes={recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    isAddon: recipe.tags.includes('add-on'),
    portionable: recipe.servings !== null,
    familyKey: recipe.familyKey,
    familyTitle: recipe.familyTitle,
    variantLabel: recipe.variantLabel,
    nutrition: {
      ...Object.fromEntries(Object.entries(recipe.nutrition ?? {}).filter(([, value]) => typeof value === "number" || value === null)) as Record<string, number | null>,
      calories: recipe.nutrition?.calories ?? recipe.calories,
      proteinGrams: recipe.nutrition?.proteinGrams ?? recipe.proteinGrams,
      carbsGrams: recipe.nutrition?.carbsGrams ?? recipe.carbsGrams,
      fatGrams: recipe.nutrition?.fatGrams ?? recipe.fatGrams,
    },
  }))} />;
}
