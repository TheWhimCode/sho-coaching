import { prisma } from './prisma';
import { outsideMealSchema } from './outside-meals';

export async function saveOutsideMeal(value: unknown) {
  const input = outsideMealSchema.parse(value);
  const data = { ...input, nutrition: Object.fromEntries(Object.entries(input.nutrition).filter(([, value]) => value !== undefined)) };
  return prisma.outsideMeal.upsert({ where: { id: input.id }, create: data, update: data });
}
