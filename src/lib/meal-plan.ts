import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { StockError } from './cook-recipe';
import { availableRecipeServings, availableWithAddon } from './recipe-availability';
import { mealSlots, type MealSlot } from './meal-slots';
export { mealSlots, type MealSlot } from './meal-slots';

type Db = Prisma.TransactionClient;

const slotOrder: Record<string, number> = Object.fromEntries(mealSlots.map((slot, index) => [slot, index]));

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function localDateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export type PlannedSlot = {
  plannedDate: string; mealSlot: string; recipeId: string; servings: number;
  addonRecipeId: string | null; cookedServings: number; status: string;
};

export type Availability = {
  // Portions you can still plan: free portions in the fridge + what raw stock can still make, minus planned claims.
  recipes: Record<string, number>;
  withAddons: Record<string, Record<string, number>>;
  // Free cooked portions per recipe, for display.
  cooked: Record<string, number>;
};

const recipeInclude = { ingredients: { include: { groceryItem: { include: { lots: true } } } } } satisfies Prisma.RecipeInclude;

// Slots from `from` onward count as not yet eaten. Older "planned" slots that never got cooked no longer hold stock.
export async function recipeAvailability(db: Db, from: string, exclude?: { plannedDate: string; mealSlot: string }): Promise<Availability> {
  const [recipes, cooks, plans] = await Promise.all([
    db.recipe.findMany({ include: recipeInclude }),
    db.recipeCook.groupBy({ by: ['recipeId'], _sum: { remainingServings: true }, where: { remainingServings: { gt: 0 } } }),
    db.mealPlan.findMany({ where: { plannedDate: { gte: from } } }),
  ]);
  const fridge = new Map(cooks.map(cook => [cook.recipeId, Math.floor((cook._sum.remainingServings ?? 0) + 0.000001)]));
  const rawClaims = new Map<string, number>();
  const addonClaims = new Map<string, number>();
  for (const plan of plans) {
    if (exclude && plan.plannedDate === exclude.plannedDate && plan.mealSlot === exclude.mealSlot) continue;
    rawClaims.set(plan.recipeId, (rawClaims.get(plan.recipeId) ?? 0) + Math.max(0, plan.servings - plan.cookedServings));
    if (plan.addonRecipeId) addonClaims.set(plan.addonRecipeId, (addonClaims.get(plan.addonRecipeId) ?? 0) + 1);
  }
  const rawFree = (recipe: (typeof recipes)[number]) => Math.max(0, availableRecipeServings(recipe) - (rawClaims.get(recipe.id) ?? 0));
  const addons = recipes.filter(recipe => recipe.tags.includes('add-on'));
  const addonFree = new Map(addons.map(addon => [addon.id, Math.max(0, availableRecipeServings(addon) - (addonClaims.get(addon.id) ?? 0))]));
  return {
    recipes: Object.fromEntries(recipes.map(recipe => [recipe.id, (fridge.get(recipe.id) ?? 0) + rawFree(recipe)])),
    withAddons: Object.fromEntries(recipes.filter(recipe => !recipe.tags.includes('add-on')).map(main => [main.id,
      Object.fromEntries(addons.map(addon => [addon.id, (addonFree.get(addon.id) ?? 0) >= 1
        ? (fridge.get(main.id) ?? 0) + Math.max(0, availableWithAddon(main, addon) - (rawClaims.get(main.id) ?? 0))
        : 0])),
    ])),
    cooked: Object.fromEntries(recipes.map(recipe => [recipe.id, fridge.get(recipe.id) ?? 0])),
  };
}

export async function listPlans(from: string, to: string): Promise<PlannedSlot[]> {
  const rows = await prisma.mealPlan.findMany({ where: { plannedDate: { gte: from, lte: to } }, orderBy: [{ plannedDate: 'asc' }] });
  return rows.map(toSlot);
}

function toSlot(row: { plannedDate: string; mealSlot: string; recipeId: string; servings: number; addonRecipeId: string | null; cookedServings: number; status: string }): PlannedSlot {
  return { plannedDate: row.plannedDate, mealSlot: row.mealSlot, recipeId: row.recipeId, servings: row.servings, addonRecipeId: row.addonRecipeId, cookedServings: row.cookedServings, status: row.status };
}

function serializable<T>(work: (tx: Db) => Promise<T>) {
  return (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code) && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('Could not save the meal plan.');
  })();
}

export type PlanInput = { plannedDate: string; mealSlot: MealSlot; recipeId: string; servings: number; addonRecipeId?: string | null; from: string };

// Fridge portions are used first; the rest of the slot claims raw groceries until the recipe is cooked.
export function planMeal(input: PlanInput) {
  return serializable(async tx => {
    const where = { plannedDate: input.plannedDate, mealSlot: input.mealSlot };
    const existing = await tx.mealPlan.findUnique({ where: { plannedDate_mealSlot: where } });
    if (existing) await releasePlan(tx, existing);
    const availability = await recipeAvailability(tx, input.from, where);
    const max = input.addonRecipeId ? availability.withAddons[input.recipeId]?.[input.addonRecipeId] ?? 0 : availability.recipes[input.recipeId] ?? 0;
    if (max < input.servings) throw new StockError(max > 0 ? `Only ${max} ${max === 1 ? 'serving' : 'servings'} available for this meal.` : 'Not enough ingredients or cooked portions for this meal.');
    const cooks = await tx.recipeCook.findMany({ where: { recipeId: input.recipeId, remainingServings: { gt: 0 } }, orderBy: { createdAt: 'asc' } });
    let cookedServings = 0;
    let recipeCookId: string | null = null;
    for (const cook of cooks) {
      const take = Math.min(Math.floor(cook.remainingServings + 0.000001), input.servings - cookedServings);
      if (take <= 0) continue;
      await tx.recipeCook.update({ where: { id: cook.id }, data: { remainingServings: cook.remainingServings - take } });
      cookedServings += take;
      recipeCookId ??= cook.id;
      if (cookedServings >= input.servings) break;
    }
    const covered = cookedServings >= input.servings;
    const row = await tx.mealPlan.create({ data: {
      ...where, recipeId: input.recipeId, servings: input.servings, addonRecipeId: input.addonRecipeId || null,
      cookedServings, recipeCookId, status: covered ? 'cooked' : 'planned', cookedAt: covered ? new Date() : null,
    } });
    return toSlot(row);
  });
}

export function unplanMeal(plannedDate: string, mealSlot: string) {
  return serializable(async tx => {
    const existing = await tx.mealPlan.findUnique({ where: { plannedDate_mealSlot: { plannedDate, mealSlot } } });
    if (existing) await releasePlan(tx, existing);
    return { removed: !!existing };
  });
}

// Unplanning puts fridge portions back; a raw claim simply disappears.
async function releasePlan(tx: Db, plan: { id: string; recipeId: string; cookedServings: number; recipeCookId: string | null }) {
  if (plan.cookedServings > 0) {
    const cook = (plan.recipeCookId && await tx.recipeCook.findUnique({ where: { id: plan.recipeCookId } }))
      || await tx.recipeCook.findFirst({ where: { recipeId: plan.recipeId }, orderBy: { createdAt: 'desc' } });
    if (cook) await tx.recipeCook.update({ where: { id: cook.id }, data: { remainingServings: cook.remainingServings + plan.cookedServings } });
  }
  await tx.mealPlan.delete({ where: { id: plan.id } });
}

// A fresh batch first covers meals already planned from today on, earliest first; the rest stays free in the fridge.
export async function assignCookToPlans(tx: Db, cook: { id: string; recipeId: string; servings: number }, today = localDateKey()) {
  const plans = (await tx.mealPlan.findMany({ where: { recipeId: cook.recipeId, plannedDate: { gte: today } } }))
    .filter(plan => plan.cookedServings < plan.servings)
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate) || (slotOrder[a.mealSlot] ?? 9) - (slotOrder[b.mealSlot] ?? 9));
  let remaining = cook.servings;
  let assigned = 0;
  for (const plan of plans) {
    const take = Math.min(plan.servings - plan.cookedServings, Math.floor(remaining + 0.000001));
    if (take <= 0) break;
    const cookedServings = plan.cookedServings + take;
    const covered = cookedServings >= plan.servings;
    await tx.mealPlan.update({ where: { id: plan.id }, data: {
      cookedServings, recipeCookId: plan.recipeCookId ?? cook.id, status: covered ? 'cooked' : 'planned', cookedAt: covered ? new Date() : plan.cookedAt,
    } });
    remaining -= take;
    assigned += take;
  }
  await tx.recipeCook.update({ where: { id: cook.id }, data: { remainingServings: remaining } });
  return { assigned, remaining };
}
