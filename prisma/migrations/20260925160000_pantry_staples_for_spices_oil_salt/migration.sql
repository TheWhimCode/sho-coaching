BEGIN;

ALTER TABLE "admin"."RecipeIngredient" ADD COLUMN "pantryStaple" BOOLEAN NOT NULL DEFAULT false;

-- Dry spices remain visible in recipes but are never pantry-stock requirements
-- or nutrition inputs. Their original practical measures stay on the recipe.
UPDATE "admin"."RecipeIngredient"
SET "groceryItemId" = NULL, "pantryStaple" = true
WHERE lower("name") IN ('black pepper', 'pepper', 'garam masala', 'paprika', 'ground cumin', 'turmeric powder');

UPDATE "admin"."RecipeIngredient"
SET "amount" = 'to taste', "unit" = '', "weightGrams" = NULL, "quantity" = NULL
WHERE "id" = 'butter-chicken-pepper';

-- Oil and salt stay linked so their nutrients can be counted, but do not need
-- to be bought or deducted as stock. Water is likewise always available.
UPDATE "admin"."RecipeIngredient"
SET "pantryStaple" = true
WHERE lower("name") IN ('olive oil', 'vegetable oil', 'salt', 'water');

DELETE FROM "admin"."GroceryItem"
WHERE lower("name") IN ('black pepper', 'pepper', 'garam masala', 'paprika', 'ground cumin', 'turmeric powder')
  AND NOT EXISTS (SELECT 1 FROM "admin"."RecipeIngredient" r WHERE r."groceryItemId" = "admin"."GroceryItem"."id");

COMMIT;
