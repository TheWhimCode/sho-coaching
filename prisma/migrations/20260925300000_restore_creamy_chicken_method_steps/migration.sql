UPDATE "admin"."Recipe"
SET "methodText" = '', "updatedAt" = NOW()
WHERE "id" = 'recipe-creamy-chicken-pasta';

DELETE FROM "admin"."RecipeStep"
WHERE "recipeId" = 'recipe-creamy-chicken-pasta';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder") VALUES
  ('creamy-chicken-step-1-short', 'recipe-creamy-chicken-pasta', 'Use a heavy-bottomed pot on a similar-sized burner for even cooking.', 0),
  ('creamy-chicken-step-2-short', 'recipe-creamy-chicken-pasta', 'Pat the chicken dry, then sear it over medium-high heat until browned.', 1),
  ('creamy-chicken-step-3-short', 'recipe-creamy-chicken-pasta', 'Keep the lid on while the pasta cooks. Lift it only to stir and check for sticking.', 2),
  ('creamy-chicken-step-4-short', 'recipe-creamy-chicken-pasta', 'Start with the stated amount of broth; it does not need to cover the pasta.', 3),
  ('creamy-chicken-step-5-short', 'recipe-creamy-chicken-pasta', 'After about 20 minutes, uncover briefly if the sauce is loose. If the pasta needs more time, add a small splash of hot broth or water.', 4),
  ('creamy-chicken-step-6-short', 'recipe-creamy-chicken-pasta', 'Use heavy cream for the richest, most stable sauce.', 5);
