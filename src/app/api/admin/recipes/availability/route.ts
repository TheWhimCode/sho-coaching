import { prisma } from '@/lib/prisma';
import { isDateKey, localDateKey, recipeAvailability } from '@/lib/meal-plan';

export const dynamic = 'force-dynamic';

// `from` is the planner's first day; planned meals from that day on still hold their stock.
export async function GET(request: Request) {
  const from = new URL(request.url).searchParams.get('from');
  const availability = await recipeAvailability(prisma, isDateKey(from) ? from : localDateKey());
  return Response.json(availability, { headers: { 'Cache-Control': 'no-store' } });
}
