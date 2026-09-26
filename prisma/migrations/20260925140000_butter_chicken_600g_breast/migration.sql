UPDATE "admin"."RecipeIngredient"
SET "quantity" = 600, "weightGrams" = 600, "amount" = '600'
WHERE "id" = 'butter-chicken-breast'
  AND "recipeId" = 'recipe-butter-chicken-curry';
