UPDATE "admin"."Recipe"
SET "title" = 'Cauliflower Coconut Tofu',
    "familyTitle" = CASE WHEN "familyTitle" = 'Cauliflower Coconut Tofu Curry' THEN 'Cauliflower Coconut Tofu' ELSE "familyTitle" END,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" = 'Cauliflower Coconut Tofu Curry' OR "slug" = 'cauliflower-coconut-tofu-curry';

UPDATE "admin"."GroceryItem"
SET "gramsPerCount" = 400,
    "weightBasis" = 'One head: 400 g',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'cauliflower';

UPDATE "admin"."RecipeIngredient"
SET "quantity" = 400, "weightGrams" = 400, "count" = 1
WHERE lower("name") = 'cauliflower'
  AND "recipeId" = (SELECT "id" FROM "admin"."Recipe" WHERE "slug" = 'cauliflower-coconut-tofu-curry');

-- Sugar stays in the recipe for nutrition, but it is always on hand and never shopped or deducted.
UPDATE "admin"."GroceryItem"
SET "pantryStaple" = true, "excludeFromNutrition" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'sugar';

UPDATE "admin"."RecipeIngredient"
SET "pantryStaple" = true
WHERE lower("name") = 'sugar';

DELETE FROM "admin"."ShoppingItem"
WHERE "groceryItemId" IN (SELECT "id" FROM "admin"."GroceryItem" WHERE "name" = 'sugar');

INSERT INTO "admin"."GroceryLot" (
  "id", "groceryItemId", "purchasedAmount", "remainingAmount",
  "purchasedCount", "remainingCount", "purchasedWeightGrams", "remainingWeightGrams",
  "purchasedAt", "createdAt", "updatedAt"
)
SELECT 'lot-ginger-30g', g."id", '30 g', '30 g', NULL, NULL, 30, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g WHERE g."name" = 'ginger'
UNION ALL
SELECT 'lot-coconut-milk-1-can', g."id", '1 can', '1 can', 1, 1, 400, 400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g WHERE g."name" = 'full-fat coconut milk'
UNION ALL
SELECT 'lot-tomato-sauce-2-cans', g."id", '2 cans', '2 cans', 2, 2, 800, 800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g WHERE g."name" = 'tomato sauce'
UNION ALL
SELECT 'lot-cauliflower-1-head', g."id", '1 head', '1 head', 1, 1, 400, 400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g WHERE g."name" = 'cauliflower'
UNION ALL
SELECT 'lot-rice-1000g', g."id", '1000 g', '1000 g', NULL, NULL, 1000, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g WHERE g."name" = 'rice'
UNION ALL
SELECT 'lot-tofu-1-block', g."id", '1 block', '1 block', 1, 1, 400, 400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g WHERE g."name" = 'tofu';
