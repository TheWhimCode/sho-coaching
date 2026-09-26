BEGIN;

-- Both products were verified to use the same package size and nutrition profile.
-- Preserve the stock history by moving all lots before removing the duplicate.
UPDATE "admin"."RecipeIngredient"
SET "groceryItemId" = (SELECT "id" FROM "admin"."GroceryItem" WHERE "name" = 'pasta'),
    "name" = 'pasta'
WHERE lower("name") = 'spaghetti';

UPDATE "admin"."GroceryLot"
SET "groceryItemId" = (SELECT "id" FROM "admin"."GroceryItem" WHERE "name" = 'pasta')
WHERE "groceryItemId" = (SELECT "id" FROM "admin"."GroceryItem" WHERE "name" = 'spaghetti');

UPDATE "admin"."Recipe"
SET "summary" = regexp_replace("summary", 'spaghetti', 'pasta', 'gi'),
    "notes" = regexp_replace("notes", 'spaghetti', 'pasta', 'gi'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "summary" ILIKE '%spaghetti%' OR "notes" ILIKE '%spaghetti%';

UPDATE "admin"."RecipeStep"
SET "text" = regexp_replace("text", 'spaghetti', 'pasta', 'gi')
WHERE "text" ILIKE '%spaghetti%';

UPDATE "admin"."GroceryItem"
SET "nutritionSource" = replace("nutritionSource", 'spaghetti', 'pasta'), "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'pasta';

DELETE FROM "admin"."GroceryItem" WHERE "name" = 'spaghetti';

COMMIT;
