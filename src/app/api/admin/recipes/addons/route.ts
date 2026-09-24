import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const inputSchema = z.object({
  title: z.string().trim().min(1).max(100),
  groceryItemId: z.string().min(1),
  quantity: z.number().finite().positive().max(100000),
  measure: z.enum(['grams', 'count']),
  method: z.string().trim().max(2000).default(''),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Enter a name, ingredient, and positive amount.' }, { status: 400 });
  const input = parsed.data;
  const product = await prisma.groceryItem.findUnique({ where: { id: input.groceryItemId } });
  if (!product) return Response.json({ error: 'Ingredient not found.' }, { status: 400 });
  if (input.measure === 'count' && (!product.gramsPerCount || Number(product.gramsPerCount) <= 0)) {
    return Response.json({ error: 'This ingredient needs a grams-per-count value. Use grams for now.' }, { status: 400 });
  }
  const recipe = await prisma.recipe.create({ data: {
    title: input.title, slug: `addon-${crypto.randomUUID()}`, tags: ['add-on'], servings: null,
    summary: 'One fixed addition to a meal, independent of the main meal’s servings.',
    ingredients: { create: {
      groceryItemId: product.id, name: product.name, amount: String(input.quantity),
      unit: input.measure === 'grams' ? 'g' : '',
      weightGrams: input.measure === 'grams' ? input.quantity : null,
      count: input.measure === 'count' ? input.quantity : null,
    } },
    ...(input.method ? { steps: { create: { text: input.method } } } : {}),
  }, select: { id: true } });
  return Response.json(recipe, { status: 201 });
}
