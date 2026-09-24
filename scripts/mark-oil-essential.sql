UPDATE "admin"."RecipeIngredient"
SET "amount" = '', "unit" = '', "note" = CASE WHEN "name" = 'olive oil' THEN 'essential; add to taste' ELSE "note" END
WHERE "recipeId" IN (SELECT "id" FROM "admin"."Recipe" WHERE "slug" IN ('mascarpone-pasta', 'hummus-snack'))
  AND "name" = 'olive oil';
