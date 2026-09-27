import { roundNutrient } from './ingredient-measurements';

type Meal = { nutrition: Record<string, number | null | undefined> };

// Call with eligible days (both main meals filled). Unknown days are not zero days.
export function weeklyNutrient(days: Meal[][], key: string) {
  let value = 0;
  let known = 0;
  let mealsCount = 0;
  let trackedDays = 0;
  for (const meals of days) {
    const values = meals.map(meal => meal.nutrition[key]).filter(
      (amount): amount is number => typeof amount === 'number' && Number.isFinite(amount),
    );
    if (!values.length) continue;
    trackedDays++;
    mealsCount += meals.length;
    known += values.length;
    value += values.reduce((sum, amount) => sum + amount, 0);
  }
  return { value: roundNutrient(value), known, mealsCount, trackedDays };
}
