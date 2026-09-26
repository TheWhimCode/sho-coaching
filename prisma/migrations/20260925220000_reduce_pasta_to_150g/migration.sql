UPDATE "admin"."RecipeIngredient"
SET "quantity" = 150, "weightGrams" = 150, "amount" = '150'
WHERE lower("name") = 'pasta'
  AND "weightGrams" = 200;
