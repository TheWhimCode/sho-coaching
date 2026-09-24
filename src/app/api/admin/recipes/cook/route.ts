import { cookRecipe, StockError } from '@/lib/cook-recipe';

export async function POST(request: Request) {
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
  if (!input || typeof input.recipeId !== 'string' || typeof input.requestId !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(input.requestId) || typeof input.servings !== 'number' ||
    !Number.isFinite(input.servings) || input.servings <= 0 || input.servings > 100) {
    return Response.json({ error: 'Invalid recipe or serving count' }, { status: 400 });
  }
  try {
    const result = await cookRecipe(input.recipeId, input.servings, input.requestId);
    return Response.json({ id: result.id, servings: result.servings, remaining: result.remainingServings, assigned: result.servings - result.remainingServings });
  } catch (error) {
    if (error instanceof StockError) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ error: 'Could not save. Your stock has not been partially deducted. Please retry.' }, { status: 500 });
  }
}
