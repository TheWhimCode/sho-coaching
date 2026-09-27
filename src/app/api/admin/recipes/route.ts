import { prisma } from '@/lib/prisma';
import { nutrientKeys } from '@/lib/ingredient-measurements';
import { z } from 'zod';

const numeric = z.number().finite().nonnegative().max(1_000_000);
const optionalText = z.string().trim().max(2_000).optional();
const nutritionSchema = z.object(Object.fromEntries(nutrientKeys.map(key => [key, numeric.optional()])))
  .strict()
  .optional();

const grocerySchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().max(100).optional(),
  // Pantry controls shopping/stock. Nutrition exclusion is deliberately separate:
  // oil and salt can be pantry staples that still contribute to nutrition.
  pantryStaple: z.boolean().optional(),
  excludeFromNutrition: z.boolean().optional(),
  gramsPerCount: numeric.optional().nullable(),
  unitsPerPurchase: numeric.positive().max(100_000).optional().nullable(),
  weightBasis: z.string().trim().max(300).optional(),
  nutritionPer100g: nutritionSchema.nullable(),
  nutritionSource: z.string().trim().max(500).optional(),
});

const ingredientSchema = z.object({
  groceryItemId: z.string().min(1).optional(),
  groceryName: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  amount: z.string().trim().max(50).default(''),
  unit: z.string().trim().max(50).default(''),
  quantity: numeric.optional().nullable(),
  weightGrams: numeric.optional().nullable(),
  count: numeric.optional().nullable(),
  gramsPerCount: numeric.positive().max(100_000).optional().nullable(),
  note: z.string().trim().max(500).default(''),
  optional: z.boolean().default(false),
  // Normally inherited from the grocery item; accepts an explicit override for
  // a rare recipe-specific exception.
  pantryStaple: z.boolean().optional(),
}).refine(value => Boolean(value.groceryItemId || value.groceryName), {
  message: 'Each ingredient needs groceryItemId or groceryName.',
});

const stockSchema = z.object({
  groceryItemId: z.string().min(1).optional(),
  groceryName: z.string().trim().min(1).max(100).optional(),
  purchasedAmount: z.string().trim().min(1).max(100),
  remainingAmount: z.string().trim().min(1).max(100).optional(),
  purchasedCount: numeric.optional().nullable(),
  remainingCount: numeric.optional().nullable(),
  purchasedWeightGrams: numeric.optional().nullable(),
  remainingWeightGrams: numeric.optional().nullable(),
  usualShelfLifeDays: z.number().int().positive().max(3650).optional().nullable(),
}).refine(value => Boolean(value.groceryItemId || value.groceryName), {
  message: 'Each stock entry needs groceryItemId or groceryName.',
});

const recipeSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180).optional(),
  familyKey: optionalText.nullable(),
  familyTitle: optionalText.nullable(),
  variantLabel: optionalText.nullable(),
  summary: z.string().trim().max(1_000).default(''),
  servings: z.number().int().positive().max(100).nullable().default(2),
  prepMinutes: z.number().int().nonnegative().max(24 * 60).default(0),
  cookMinutes: z.number().int().nonnegative().max(24 * 60).default(0),
  tags: z.array(z.string().trim().min(1).max(50)).min(1).max(20),
  methodText: z.string().trim().max(10_000).default(''),
  notes: z.string().trim().max(5_000).default(''),
  ingredients: z.array(ingredientSchema).min(1).max(100),
  steps: z.array(z.string().trim().min(1).max(2_000)).max(50).default([]),
});

const inputSchema = z.object({
  recipe: recipeSchema,
  // These are grocery definitions, not shopping-list entries. Existing names are
  // updated only for fields included in the request, preserving package data by default.
  groceries: z.array(grocerySchema).max(100).default([]),
  stock: z.array(stockSchema).max(100).default([]),
});

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

function slugFromTitle(title: string) {
  const base = normalizedName(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || 'recipe';
}

class ContentError extends Error {}

async function uniqueSlug(requested: string) {
  const base = requested.slice(0, 160);
  let candidate = base;
  let suffix = 2;
  while (await prisma.recipe.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base.slice(0, 180 - String(suffix).length - 1)}-${suffix++}`;
  }
  return candidate;
}

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid recipe data.', details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const groceryNames = input.groceries.map(item => normalizedName(item.name));
  if (new Set(groceryNames).size !== groceryNames.length) {
    return Response.json({ error: 'Each grocery can appear only once.' }, { status: 400 });
  }
  const ingredientRefs = input.recipe.ingredients.map(item => item.groceryItemId ?? normalizedName(item.groceryName!));
  if (new Set(ingredientRefs).size !== ingredientRefs.length) {
    return Response.json({ error: 'Each grocery can appear only once in a recipe.' }, { status: 400 });
  }

  try {
    const recipe = await prisma.$transaction(async tx => {
    for (const grocery of input.groceries) {
      const name = normalizedName(grocery.name);
      const data = {
        ...(grocery.category !== undefined ? { category: grocery.category } : {}),
        ...(grocery.pantryStaple !== undefined ? { pantryStaple: grocery.pantryStaple } : {}),
        ...(grocery.excludeFromNutrition !== undefined ? { excludeFromNutrition: grocery.excludeFromNutrition } : {}),
        ...(grocery.gramsPerCount !== undefined ? { gramsPerCount: grocery.gramsPerCount } : {}),
        ...(grocery.unitsPerPurchase !== undefined ? { unitsPerPurchase: grocery.unitsPerPurchase } : {}),
        ...(grocery.weightBasis !== undefined ? { weightBasis: grocery.weightBasis } : {}),
        ...(grocery.nutritionPer100g !== undefined ? { nutritionPer100g: grocery.nutritionPer100g } : {}),
        ...(grocery.nutritionSource !== undefined ? { nutritionSource: grocery.nutritionSource } : {}),
      };
      await tx.groceryItem.upsert({
        where: { name },
        create: { name, category: grocery.category ?? '', pantryStaple: grocery.pantryStaple ?? false, excludeFromNutrition: grocery.excludeFromNutrition ?? false, ...data },
        update: data,
      });
    }

    const resolveGrocery = async (reference: { groceryItemId?: string; groceryName?: string }) => {
      const item = reference.groceryItemId
        ? await tx.groceryItem.findUnique({ where: { id: reference.groceryItemId } })
        : await tx.groceryItem.findUnique({ where: { name: normalizedName(reference.groceryName!) } });
      if (!item) throw new ContentError(`Grocery not found: ${reference.groceryName ?? reference.groceryItemId}`);
      return item;
    };

    const slug = await uniqueSlug(input.recipe.slug ?? slugFromTitle(input.recipe.title));
    const created = await tx.recipe.create({
      data: {
        slug, title: input.recipe.title, familyKey: input.recipe.familyKey ?? null,
        familyTitle: input.recipe.familyTitle ?? null, variantLabel: input.recipe.variantLabel ?? null,
        summary: input.recipe.summary, servings: input.recipe.servings, prepMinutes: input.recipe.prepMinutes,
        cookMinutes: input.recipe.cookMinutes, tags: input.recipe.tags.map(normalizedName), methodText: input.recipe.methodText,
        notes: input.recipe.notes,
        ingredients: { create: await Promise.all(input.recipe.ingredients.map(async (ingredient, sortOrder) => {
          const grocery = await resolveGrocery(ingredient);
          return {
            groceryItemId: grocery.id, name: ingredient.name ?? grocery.name, amount: ingredient.amount, unit: ingredient.unit,
            quantity: ingredient.quantity ?? null, weightGrams: ingredient.weightGrams ?? null,
            count: ingredient.count ?? null, gramsPerCount: ingredient.gramsPerCount ?? null,
            note: ingredient.note, optional: ingredient.optional,
            pantryStaple: ingredient.pantryStaple ?? grocery.pantryStaple, sortOrder,
          };
        })) },
        steps: input.recipe.steps.length ? { create: input.recipe.steps.map((text, sortOrder) => ({ text, sortOrder })) } : undefined,
      },
      select: { id: true, slug: true, title: true },
    });

    for (const stock of input.stock) {
      const grocery = await resolveGrocery(stock);
      if (grocery.pantryStaple) throw new ContentError(`${grocery.name} is a pantry staple and cannot have tracked stock.`);
      await tx.groceryLot.create({ data: {
        groceryItemId: grocery.id, purchasedAmount: stock.purchasedAmount, remainingAmount: stock.remainingAmount ?? stock.purchasedAmount,
        purchasedCount: stock.purchasedCount ?? null, remainingCount: stock.remainingCount ?? stock.purchasedCount ?? null,
        purchasedWeightGrams: stock.purchasedWeightGrams ?? null, remainingWeightGrams: stock.remainingWeightGrams ?? stock.purchasedWeightGrams ?? null,
        usualShelfLifeDays: stock.usualShelfLifeDays ?? null,
      } });
    }
      return created;
    });

    return Response.json(recipe, { status: 201 });
  } catch (error) {
    if (error instanceof ContentError) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
