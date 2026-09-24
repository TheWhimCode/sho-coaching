BEGIN;
ALTER TABLE "admin"."Recipe" ALTER COLUMN "servings" DROP NOT NULL;
-- NULL means a complete item/drink, not a portioned recipe.
UPDATE "admin"."RecipeNutrition" n SET
 "basis" = 'Estimated per whole smoothie', "updatedAt" = CURRENT_TIMESTAMP
FROM "admin"."Recipe" r WHERE r."id" = n."recipeId" AND r."slug" IN ('big-smoothie', 'small-smoothie');
UPDATE "admin"."Recipe" SET "servings" = NULL, "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN ('big-smoothie', 'small-smoothie');
COMMIT;
