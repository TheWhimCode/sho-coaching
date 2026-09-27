# Add a recipe

Use this guide whenever the user asks to add or change a recipe, its ingredients, pantry staples, groceries, or stock.

## Where changes belong

Use `POST /api/admin/recipes` for recipe content, grocery definitions, and optional stock lots. Do **not** create a Prisma migration unless the database schema itself must change. See `docs/RECIPE_CONTENT_API.md` for the API request shape.

## Grocery matching and naming

1. Check existing groceries before adding one. Reuse an existing item when it is the same usable ingredient.
2. Keep names generic and canonical. For example, use `pasta`, not `spaghetti`, `penne`, or a brand, unless the distinction changes nutrition, package size, or how it is used.
3. Prefer the existing spelling and singular/plural convention. Do not create near-duplicates such as `chili powder` and `chilli powder` without a real ingredient difference.
4. Add a new grocery only when it is genuinely absent or materially different. Include category, nutrition per 100 g, package fields, and a short source note when the item is nutritionally tracked.

## Measurements

- Use grams for recipe amounts whenever the source gives cups, millilitres, ounces, or pounds. Avoid cups, pounds, and millilitres in saved recipe lines.
- Counts are fine for natural units such as cloves, eggs, cans, or a medium onion. Also save `weightGrams` or `gramsPerCount` when a count needs to affect stock or nutrition.
- Keep `gramsPerCount` (one unit’s weight) separate from `unitsPerPurchase` (how many units are sold together). Those fields preserve shopping behavior—for example, a chicken pack can remain 600 g even if a recipe uses 250 g.
- Do not guess that the user owns an ingredient. Add stock only when the user says they have it, including the stated remaining amount.

## Pantry staples and nutrition

`pantryStaple` and `excludeFromNutrition` are independent:

- An untracked spice such as chili flakes: `pantryStaple: true`, `excludeFromNutrition: true`.
- Measured oil, salt, or broth: `pantryStaple: true`, `excludeFromNutrition: false`.
- A normal grocery such as carrots: `pantryStaple: false`, `excludeFromNutrition: false`.

- Pantry staples never enter the grocery list, require stock, or prevent cooking.
- Measured pantry staples with nutrition values still contribute to the recipe estimate.
- For a spice with no meaningful tracked nutrition, mark it as a pantry staple and exclude it from nutrition rather than leaving an incomplete nutrition profile.

## Recipe entry checklist

1. Check existing groceries and recipes for canonical names and duplicates.
2. Convert source measurements to the project conventions.
3. Upsert only missing or intentionally updated grocery definitions.
4. Create the recipe with a clear title, category tag, ingredients, method, servings, and notes describing meaningful substitutions.
5. Add stock lots only for ingredients explicitly said to be on hand.
6. Confirm that tracked ingredients link to a grocery item and that pantry flags match the table above.
