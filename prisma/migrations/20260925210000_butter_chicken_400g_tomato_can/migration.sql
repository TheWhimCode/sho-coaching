BEGIN;

UPDATE "admin"."GroceryItem"
SET "gramsPerCount" = 400,
    "weightBasis" = 'One standard can crushed tomatoes: 400 g',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'grocery-butter-chicken-tomatoes';

UPDATE "admin"."RecipeIngredient"
SET "quantity" = 1, "weightGrams" = 400, "count" = 1, "amount" = '1', "unit" = 'can', "note" = '400 g'
WHERE "id" = 'butter-chicken-tomatoes'
  AND "recipeId" = 'recipe-butter-chicken-curry';

COMMIT;
