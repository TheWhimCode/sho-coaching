ALTER TABLE "admin"."Recipe"
  ADD COLUMN "methodText" TEXT NOT NULL DEFAULT '';

-- This recipe uses one plain method text instead of a numbered method.
UPDATE "admin"."Recipe"
SET
  "methodText" = 'Use a heavy-bottomed pot on a similar-sized burner. Keep the lid on while the pasta cooks, lifting it only to stir and check for sticking. Start with the stated amount of broth; the pasta does not need to be covered. After about 20 minutes, simmer uncovered briefly if the sauce is loose, or add a small splash of hot broth or water if the pasta needs more time. Heavy cream gives the richest, most stable sauce.',
  "notes" = '',
  "updatedAt" = NOW()
WHERE "id" = 'recipe-creamy-chicken-pasta';

DELETE FROM "admin"."RecipeStep"
WHERE "recipeId" = 'recipe-creamy-chicken-pasta';
