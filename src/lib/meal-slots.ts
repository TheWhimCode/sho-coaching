export const mainMealSlots = ['lunch', 'dinner'] as const;
export const snackSlots = ['snack-1', 'snack-2'] as const;
export const mealSlots = [...mainMealSlots, ...snackSlots] as const;
export type MealSlot = (typeof mealSlots)[number];
export const mealSlotLabels: Record<MealSlot, string> = {
  lunch: 'lunch', dinner: 'dinner', 'snack-1': 'snack 1', 'snack-2': 'snack 2',
};
