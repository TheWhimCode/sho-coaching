BEGIN;

UPDATE "admin"."GroceryItem"
SET "name" = 'butter', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'grocery-butter-chicken-unsalted-butter'
  AND "name" = 'unsalted butter';

UPDATE "admin"."RecipeIngredient"
SET "name" = 'butter'
WHERE "id" = 'butter-chicken-butter'
  AND "recipeId" = 'recipe-butter-chicken-curry';

COMMIT;
