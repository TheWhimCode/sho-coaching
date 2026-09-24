import { StockError } from '@/lib/cook-recipe';
import { isDateKey, listPlans, mealSlots, planMeal, unplanMeal, type MealSlot } from '@/lib/meal-plan';

export const dynamic = 'force-dynamic';

function isSlot(value: unknown): value is MealSlot {
  return typeof value === 'string' && (mealSlots as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const from = params.get('from');
  const to = params.get('to');
  if (!isDateKey(from) || !isDateKey(to)) return Response.json({ error: 'Missing date range.' }, { status: 400 });
  return Response.json(await listPlans(from, to), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || !isDateKey(input.plannedDate) || !isSlot(input.mealSlot) || !isDateKey(input.from) ||
    typeof input.recipeId !== 'string' || !input.recipeId || !Number.isInteger(input.servings) || input.servings < 1 || input.servings > 100 ||
    (input.addonRecipeId != null && typeof input.addonRecipeId !== 'string')) {
    return Response.json({ error: 'Invalid meal plan request.' }, { status: 400 });
  }
  try {
    const slot = await planMeal({ plannedDate: input.plannedDate, mealSlot: input.mealSlot, recipeId: input.recipeId, servings: input.servings, addonRecipeId: input.addonRecipeId ?? null, from: input.from });
    return Response.json(slot);
  } catch (error) {
    if (error instanceof StockError) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ error: 'Could not save this meal. Please retry.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  const plannedDate = params.get('date');
  const mealSlot = params.get('slot');
  if (!isDateKey(plannedDate) || !isSlot(mealSlot)) return Response.json({ error: 'Missing meal slot.' }, { status: 400 });
  return Response.json(await unplanMeal(plannedDate, mealSlot));
}
