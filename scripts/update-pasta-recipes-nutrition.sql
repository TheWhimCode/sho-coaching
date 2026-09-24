BEGIN;

UPDATE "admin"."Recipe"
SET "prepMinutes" = 5, "cookMinutes" = 20, "notes" = '', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN ('carbonara', 'amatriciana');

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "amount", "unit", "name", "quantity", "sortOrder")
SELECT 'amatriciana-pasta', "id", '20', 'g', 'pasta', 20, 5
FROM "admin"."Recipe" WHERE "slug" = 'amatriciana'
ON CONFLICT ("id") DO UPDATE SET "amount" = '20', "unit" = 'g', "quantity" = 20;

-- Approximate ingredient totals divided by the stored serving count.
-- Dry pasta: Barilla 359 kcal, 12.8 g protein, 70.9 g carbs, 2 g fat /100g.
-- Pecorino: CAO Romano 384 kcal, 24 g protein, 32 g fat /100g.
-- Guanciale: Valtiberino 647 kcal, 10 g protein, 0.2 g carbs, 69 g fat /100g.
-- Other ingredients use generic estimates. No additional salt or oil assumed.
INSERT INTO "admin"."RecipeNutrition"
  ("id", "recipeId", "calories", "proteinGrams", "carbsGrams", "fatGrams",
   "fibreGrams", "saturatedFatGrams", "sugarGrams", "basis", "updatedAt")
SELECT 'nutrition-' || r."slug", r."id",
  n.kcal / r."servings", n.protein / r."servings", n.carbs / r."servings",
  n.fat / r."servings", n.fibre / r."servings", n.saturated / r."servings",
  n.sugar / r."servings", n.basis, CURRENT_TIMESTAMP
FROM "admin"."Recipe" r
JOIN (VALUES
  ('carbonara', 1840.0, 68.0, 145.0, 109.0, 6.0, 48.0, 7.5,
   'Approximate per serving (2 servings): 200 g dry spaghetti, 4 large yolks (about 68 g), 100 g pecorino, 80 g guanciale. Assumes all rendered fat is eaten; excludes added salt. Generic/product reference values, not your exact brands.'),
  ('amatriciana', 1420.0, 53.0, 39.0, 104.0, 7.0, 50.0, 16.0,
   'Approximate per serving (2 servings): 20 g dry pasta in the full recipe, 1 can tomato assumed 400 g, 1 chili assumed 20 g, 150 ml white wine, 80 g guanciale, 150 g pecorino. Includes the full wine energy before cooking; actual calories may be lower after alcohol evaporation. Excludes added salt.')
) AS n(slug, kcal, protein, carbs, fat, fibre, saturated, sugar, basis) ON n.slug = r."slug"
WHERE r."servings" > 0
ON CONFLICT ("recipeId") DO UPDATE SET
  "calories" = EXCLUDED."calories", "proteinGrams" = EXCLUDED."proteinGrams",
  "carbsGrams" = EXCLUDED."carbsGrams", "fatGrams" = EXCLUDED."fatGrams",
  "fibreGrams" = EXCLUDED."fibreGrams", "saturatedFatGrams" = EXCLUDED."saturatedFatGrams",
  "sugarGrams" = EXCLUDED."sugarGrams", "basis" = EXCLUDED."basis", "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "admin"."Recipe" r SET
  "calories" = ROUND(n."calories")::INTEGER, "proteinGrams" = n."proteinGrams",
  "carbsGrams" = n."carbsGrams", "fatGrams" = n."fatGrams", "updatedAt" = CURRENT_TIMESTAMP
FROM "admin"."RecipeNutrition" n WHERE n."recipeId" = r."id" AND r."slug" IN ('carbonara', 'amatriciana');

COMMIT;
