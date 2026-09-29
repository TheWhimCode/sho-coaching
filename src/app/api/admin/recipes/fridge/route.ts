import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
  if (!input || typeof input !== 'object' || !('recipeId' in input) || typeof input.recipeId !== 'string') {
    return Response.json({ error: 'Invalid recipe' }, { status: 400 });
  }
  const recipeId = input.recipeId;

  const result = await prisma.$transaction(async tx => {
    const cook = await tx.recipeCook.findFirst({
      where: { recipeId, remainingServings: { gte: 1 } },
      orderBy: { createdAt: 'asc' },
    });
    if (!cook) return null;
    await tx.recipeCook.update({ where: { id: cook.id }, data: { remainingServings: cook.remainingServings - 1 } });
    const total = await tx.recipeCook.aggregate({
      where: { recipeId, remainingServings: { gt: 0 } },
      _sum: { remainingServings: true },
    });
    return Math.floor((total._sum?.remainingServings ?? 0) + 0.000001);
  });

  return result === null
    ? Response.json({ error: 'No cooked serving is available.' }, { status: 409 })
    : Response.json({ remaining: result });
}
