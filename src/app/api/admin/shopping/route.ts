import { prisma } from '@/lib/prisma';
import { ingredientGrams, numberOrNull } from '@/lib/ingredient-measurements';
import { stockedGrams } from '@/lib/recipe-availability';
import { nextShoppingGrams } from '@/lib/shopping';

function listed(row: { id: string; grams: { toString(): string }; groceryItem: { name: string } }) {
  return { id: row.id, name: row.groceryItem.name, grams: Number(row.grams) };
}

export async function GET() {
  const rows = await prisma.shoppingItem.findMany({ include: { groceryItem: true }, orderBy: { groceryItem: { name: 'asc' } } });
  return Response.json(rows.map(listed));
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing shopping item.' }, { status: 400 });
  await prisma.shoppingItem.deleteMany({ where: { id } });
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return Response.json({ error: 'Invalid request' }, { status: 400 });
  if (input.action === 'purchase') return purchase();
  if (input.action === 'add-recipe' && typeof input.recipeId === 'string') return addRecipe(input.recipeId);
  return Response.json({ error: 'Unknown shopping action.' }, { status: 400 });
}

async function addRecipe(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: { include: { groceryItem: { include: { lots: true } } } } },
  });
  if (!recipe) return Response.json({ error: 'Recipe not found.' }, { status: 404 });
  let added = 0;
  for (const ingredient of recipe.ingredients) {
    if (ingredient.optional || (!ingredient.amount.trim() && ingredient.count == null && ingredient.weightGrams == null)) continue;
    const need = ingredientGrams(ingredient);
    if (need == null || need <= 0 || !ingredient.groceryItemId || !ingredient.groceryItem) continue;
    const have = stockedGrams(ingredient.groceryItem.lots, ingredient.groceryItem.gramsPerCount);
    const existing = await prisma.shoppingItem.findUnique({ where: { groceryItemId: ingredient.groceryItemId } });
    const listedGrams = existing ? Number(existing.grams) : 0;
    const grams = nextShoppingGrams(have, listedGrams, need, numberOrNull(ingredient.groceryItem.gramsPerCount));
    if (grams <= listedGrams + 0.000001) continue;
    await prisma.shoppingItem.upsert({
      where: { groceryItemId: ingredient.groceryItemId },
      update: { grams },
      create: { groceryItemId: ingredient.groceryItemId, grams },
    });
    added += 1;
  }
  return Response.json({ added });
}

async function purchase() {
  const rows = await prisma.shoppingItem.findMany({ include: { groceryItem: true } });
  await prisma.$transaction(async tx => {
    for (const row of rows) {
      const added = Number(row.grams);
      const ratio = numberOrNull(row.groceryItem.gramsPerCount);
      const lot = await tx.groceryLot.findFirst({ where: { groceryItemId: row.groceryItemId }, orderBy: { purchasedAt: 'desc' } });
      if (!lot) {
        const count = ratio ? added / ratio : null;
        const amount = String(count ?? added);
        await tx.groceryLot.create({ data: {
          groceryItemId: row.groceryItemId, purchasedAmount: amount, remainingAmount: amount,
          purchasedCount: count, remainingCount: count, purchasedWeightGrams: added, remainingWeightGrams: added,
        } });
      } else {
        const current = numberOrNull(lot.remainingWeightGrams) ?? (ratio && numberOrNull(lot.remainingCount) != null ? ratio * numberOrNull(lot.remainingCount)! : 0);
        const grams = current + added;
        const count = ratio ? grams / ratio : numberOrNull(lot.remainingCount);
        await tx.groceryLot.update({ where: { id: lot.id }, data: {
          remainingWeightGrams: grams, remainingCount: count, remainingAmount: String(count ?? grams),
        } });
      }
    }
    await tx.shoppingItem.deleteMany({ where: { id: { in: rows.map(row => row.id) } } });
  });
  return Response.json({ purchased: rows.length });
}
