import { prisma } from '@/lib/prisma';
import { availableRecipeServings, availableWithAddon } from '@/lib/recipe-availability';

export const dynamic = 'force-dynamic';

export async function GET() {
  const recipes = await prisma.recipe.findMany({ include: { ingredients: { include: { groceryItem: { include: { lots: true } } } } } });
  const addons = recipes.filter(recipe => recipe.tags.includes('add-on'));
  return Response.json({
    recipes: Object.fromEntries(recipes.map(recipe => [recipe.id, availableRecipeServings(recipe)])),
    withAddons: Object.fromEntries(recipes.filter(recipe => !recipe.tags.includes('add-on')).map(recipe => [recipe.id,
      Object.fromEntries(addons.map(addon => [addon.id, availableWithAddon(recipe, addon)])),
    ])),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
