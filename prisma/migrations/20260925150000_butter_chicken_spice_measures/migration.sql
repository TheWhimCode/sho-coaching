-- Keep the gram weights for grocery and nutrition calculations, while showing
-- the recipe's practical spoon measures for cooking.
UPDATE "admin"."RecipeIngredient" SET "amount" = '1', "unit" = 'tbsp'
WHERE "id" = 'butter-chicken-garam-masala-marinade';
UPDATE "admin"."RecipeIngredient" SET "amount" = '1/2', "unit" = 'tsp'
WHERE "id" = 'butter-chicken-pepper';
UPDATE "admin"."RecipeIngredient" SET "amount" = '2', "unit" = 'tsp'
WHERE "id" = 'butter-chicken-paprika';
UPDATE "admin"."RecipeIngredient" SET "amount" = '2', "unit" = 'tsp'
WHERE "id" = 'butter-chicken-cumin';
UPDATE "admin"."RecipeIngredient" SET "amount" = '1', "unit" = 'tbsp'
WHERE "id" = 'butter-chicken-garam-masala-curry';
UPDATE "admin"."RecipeIngredient" SET "amount" = '1 1/2', "unit" = 'tsp'
WHERE "id" = 'butter-chicken-turmeric';
