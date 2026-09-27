# Agent guide

Read this before changing anything. It applies to every AI tool working in this repo (Cursor, Codex, Claude, others). The rules in `.cursor/rules/*.mdc` are part of this guide; if your tool does not load them automatically, read them yourself when touching recipes or groceries.

## Data is not schema

- **Prisma migrations are for schema changes only** (tables, columns, indexes, constraints).
- **Never create a migration to add or edit content**: recipes, ingredients, groceries, stock lots, meal plans, outside meals, nutrition values, tags, categories.
- Content goes through the app's data layer:
  - Recipes, groceries, stock: `POST /api/admin/recipes` — see `docs/ADD_RECIPE.md` and `docs/RECIPE_CONTENT_API.md`.
  - Meal plan slots: `/api/admin/meal-plan` (or `planMeal` / `unplanMeal` in `src/lib/meal-plan.ts`).
  - Cooking a recipe into fridge portions: `/api/admin/recipes/cook` (`cookRecipe` in `src/lib/cook-recipe.ts`).
  - One-off restaurant meals: `/api/admin/outside-meals` — see `docs/OUTSIDE_MEALS.md`.
  - If no route fits, a short Prisma script run once and deleted is acceptable. A migration is not.

### Legacy content migrations

The migrations dated **2026-09-24 to 2026-09-26** under `prisma/migrations/` that insert or edit recipes and groceries (for example `add_butter_chicken_curry`, `creamy_chicken_pasta`, `add_cauliflower_coconut_tofu_curry`, `three_servings_and_salmon_addon`, `grocery_nutrition_baselines`) are **legacy**. They were written before this rule existed. Do not add more like them, do not edit them, and do not treat them as the pattern to copy.

## Database

- There is one shared Postgres database (Neon). It holds real data; there is no separate dev database. Treat every write as live.
- After pulling: `npx prisma migrate deploy` then `npx prisma generate`. On Windows, stop the Next.js dev server first or `generate` fails with `EPERM` on the query engine file.
- Schema migrations are hand-written SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`, additive where possible. Say that you are adding one before you do it. See `docs/PRISMA_MIGRATIONS.md`.
- Ask before anything destructive: dropping or truncating tables, deleting rows in bulk, rewriting migration history.

## Recipes, groceries, planning

- Follow `.cursor/rules/recipe-pantry-staples.mdc` and `.cursor/rules/recipe-content.mdc` for measurements, pantry staples, grocery naming and nutrition.
- Availability for the health planner is: free cooked portions in the fridge + servings raw stock can still make − servings already planned this week (`recipeAvailability` in `src/lib/meal-plan.ts`). Cooking deducts groceries once and covers planned slots first. Do not bypass this by editing `MealPlan` or `RecipeCook` rows directly.

## Verifying work

- `npx tsc --noEmit -p tsconfig.json` must pass. `npx eslint` is currently broken by a `minimatch` override; do not spend time on it unless asked.
- Repo test scripts live in `scripts/test-*.ts` and run with `npx tsx`. Temporary verification scripts must be deleted before you finish.
