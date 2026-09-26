UPDATE "admin"."RecipeIngredient"
SET "quantity" = 400, "weightGrams" = 400, "amount" = '400', "unit" = 'g'
WHERE "id" = 'creamy-chicken-breast'
  AND "recipeId" = 'recipe-creamy-chicken-pasta';

UPDATE "admin"."RecipeIngredient"
SET "quantity" = 200, "weightGrams" = 200, "amount" = '200', "unit" = 'g'
WHERE "id" = 'creamy-chicken-pasta'
  AND "recipeId" = 'recipe-creamy-chicken-pasta';
