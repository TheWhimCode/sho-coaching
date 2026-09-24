import { prisma } from "@/lib/prisma";
import { numberOrNull, stockAfterEdit } from "@/lib/ingredient-measurements";

function lotInStock(row: { remainingCount: Parameters<typeof numberOrNull>[0]; remainingWeightGrams: Parameters<typeof numberOrNull>[0]; remainingAmount: string }) {
  const count = numberOrNull(row.remainingCount);
  const grams = numberOrNull(row.remainingWeightGrams);
  return (count ?? 0) > 0 || (grams ?? 0) > 0 ||
    (row.remainingCount === null && row.remainingWeightGrams === null && !['', '0'].includes(row.remainingAmount));
}

export async function GET() {
  const items = await prisma.groceryItem.findMany({
    include: { lots: true }, orderBy: { name: 'asc' },
  });
  return Response.json(items.flatMap(item => item.lots.length ? item.lots.map(row => ({
    id: row.id, name: item.name,
    count: numberOrNull(row.remainingCount), grams: numberOrNull(row.remainingWeightGrams),
    inStock: lotInStock(row),
  })) : [{ id: item.id, name: item.name, count: null, grams: null, inStock: false }]));
}

export async function PATCH(request: Request) {
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
  if (!input || typeof input.id !== 'string' || !['count', 'grams'].includes(input.field) ||
      typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value < 0 || input.value > 1000000) {
    return Response.json({ error: 'Enter a non-negative count or weight in grams.' }, { status: 400 });
  }
  const { id, field, value } = input;
  const result = await prisma.$transaction(async tx => {
    const lot = await tx.groceryLot.findUnique({ where: { id }, include: { groceryItem: true } });
    if (lot) {
      const updated = stockAfterEdit(lot, field, value);
      await tx.groceryLot.update({ where: { id }, data: {
        remainingCount: updated.count, remainingWeightGrams: updated.grams,
        // Compatibility only: calculations use the numeric columns above.
        remainingAmount: String(updated.count ?? updated.grams ?? 0),
      } });
      return { id, name: lot.groceryItem.name, ...updated };
    }
    const item = await tx.groceryItem.findUnique({ where: { id } });
    if (!item) return null;
    const updated = stockAfterEdit({ purchasedCount: null, purchasedWeightGrams: null, groceryItem: item }, field, value);
    const amount = String(updated.count ?? updated.grams ?? 0);
    const created = await tx.groceryLot.create({ data: {
      groceryItemId: item.id, purchasedAmount: amount, remainingAmount: amount,
      purchasedCount: updated.count, remainingCount: updated.count,
      purchasedWeightGrams: updated.grams, remainingWeightGrams: updated.grams,
    } });
    return { id: created.id, name: item.name, ...updated };
  });
  return result ? Response.json(result) : Response.json({ error: 'Grocery not found' }, { status: 404 });
}
