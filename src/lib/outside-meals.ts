import { z } from 'zod';
import { nutrientKeys } from './ingredient-measurements';
import { scaleNutrition } from './meal-portions';
import { mealSlots } from './meal-slots';

export const foodDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a real calendar date (YYYY-MM-DD).');

const nutrient = z.number().finite().nonnegative().max(1_000_000);
const nutritionSchema = z.object(Object.fromEntries(nutrientKeys.map(key => [key, nutrient.nullable().optional()])))
  .strict().refine(value => nutrientKeys.some(key => value[key] != null), 'Include at least one nutrient estimate.');

export const outsideMealSchema = z.object({
  // Reuse the ID to correct an estimate or retry without duplicating intake.
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  date: foodDateSchema,
  mealSlot: z.enum(mealSlots),
  name: z.string().trim().min(1).max(200),
  amount: z.number().finite().positive().max(100).default(1),
  portion: z.string().trim().min(1).max(300),
  // Values describe ONE portion; amount is applied exactly once when displayed.
  nutrition: nutritionSchema,
  notes: z.string().trim().max(5000).default(''),
  source: z.string().trim().min(1).max(300).default('AI photo estimate'),
}).strict();

export type OutsideMeal = z.infer<typeof outsideMealSchema>;

export function outsideMealNutrition(meal: Pick<OutsideMeal, 'nutrition' | 'amount'>) {
  return scaleNutrition(Object.fromEntries(nutrientKeys.map(key => [key, meal.nutrition[key] ?? null])), meal.amount);
}
