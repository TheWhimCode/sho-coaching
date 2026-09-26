BEGIN;

INSERT INTO "admin"."GroceryItem" (
  "id", "name", "category", "gramsPerCount", "weightBasis", "nutritionPer100g", "nutritionSource", "createdAt", "updatedAt"
) VALUES (
  'grocery-rummo-pesto-rosso', 'Rummo Pesto Rosso', 'pantry', 190,
  'One Rummo Pesto Rosso glass jar: 190 g',
  '{"calories":312,"proteinGrams":4.9,"carbsGrams":12.3,"fatGrams":26.6,"fibreGrams":2,"saturatedFatGrams":4,"sugarGrams":9.4,"sodiumMg":520}'::jsonb,
  'Rummo Pesto Rosso nutrition declaration; per 100 g. Salt 1.3 g converted to sodium: 520 mg.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- One unopened jar is the baseline pantry amount.
INSERT INTO "admin"."GroceryLot" (
  "id", "groceryItemId", "purchasedAmount", "remainingAmount", "purchasedCount", "remainingCount",
  "purchasedWeightGrams", "remainingWeightGrams", "purchasedAt", "createdAt", "updatedAt"
)
SELECT 'lot-rummo-pesto-rosso-1', g."id", '1 jar', '1 jar', 1, 1, 190, 190, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g
WHERE g."name" = 'Rummo Pesto Rosso';

INSERT INTO "admin"."Recipe" (
  "id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "notes", "createdAt", "updatedAt"
) VALUES (
  'recipe-rummo-pesto-pasta', 'rummo-pesto-pasta', 'Pasta Pesto Rosso',
  'Pasta with half a jar of Rummo tomato pesto.', 2, 2, 12, ARRAY['dinner', 'pasta', 'quick', 'vegetarian'],
  'Nutrition is calculated from 200 g dry pasta and 95 g Rummo Pesto Rosso.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "admin"."RecipeIngredient" (
  "id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder"
)
SELECT 'rummo-pesto-pasta-pasta', r."id", g."id", 200, 200, '200', 'g', 'pasta', 'dry', false, 0
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'rummo-pesto-pasta' AND lower(g."name") = 'pasta';

INSERT INTO "admin"."RecipeIngredient" (
  "id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "sortOrder"
)
SELECT 'rummo-pesto-pasta-pesto', r."id", g."id", 0.5, 95, 0.5, '1/2', 'jar', 'Rummo Pesto Rosso', 'Half a 190 g jar', false, 1
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'rummo-pesto-pasta' AND g."name" = 'Rummo Pesto Rosso';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder")
SELECT 'rummo-pesto-pasta-step-1', "id", 'Cook the pasta in salted water until al dente; reserve a little pasta water.', 0
FROM "admin"."Recipe" WHERE "slug" = 'rummo-pesto-pasta';
INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder")
SELECT 'rummo-pesto-pasta-step-2', "id", 'Toss the drained pasta with half the jar of pesto, loosening with reserved pasta water as needed.', 1
FROM "admin"."Recipe" WHERE "slug" = 'rummo-pesto-pasta';

COMMIT;
