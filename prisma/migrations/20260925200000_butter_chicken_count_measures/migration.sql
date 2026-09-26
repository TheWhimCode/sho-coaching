BEGIN;

UPDATE "admin"."GroceryItem"
SET "gramsPerCount" = 150,
    "weightBasis" = 'One medium yellow onion: 150 g (recipe convention)',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'grocery-butter-chicken-yellow-onion';

UPDATE "admin"."RecipeIngredient"
SET "count" = 6, "amount" = '6', "unit" = 'cloves'
WHERE "id" = 'butter-chicken-garlic'
  AND "recipeId" = 'recipe-butter-chicken-curry';

UPDATE "admin"."RecipeIngredient"
SET "count" = 1, "amount" = '1', "unit" = ''
WHERE "id" = 'butter-chicken-onion'
  AND "recipeId" = 'recipe-butter-chicken-curry';

COMMIT;
