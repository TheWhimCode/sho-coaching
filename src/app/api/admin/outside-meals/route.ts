import { prisma } from '@/lib/prisma';
import { foodDateSchema, outsideMealSchema } from '@/lib/outside-meals';
import { saveOutsideMeal } from '@/lib/outside-meals-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const from = foodDateSchema.safeParse(params.get('from'));
  const to = foodDateSchema.safeParse(params.get('to'));
  if (!from.success || !to.success || from.data > to.data) {
    return Response.json({ error: 'Use a valid date range.' }, { status: 400 });
  }
  const rows = await prisma.outsideMeal.findMany({
    where: { date: { gte: from.data, lte: to.data } }, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });
  return Response.json(rows, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  const parsed = outsideMealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid outside meal.', details: parsed.error.flatten() }, { status: 400 });
  return Response.json(await saveOutsideMeal(parsed.data));
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing entry ID.' }, { status: 400 });
  await prisma.outsideMeal.deleteMany({ where: { id } });
  return Response.json({ ok: true });
}
