UPDATE "admin"."Recipe" SET "calories" = 693, "proteinGrams" = 14.1, "carbsGrams" = 59.7, "fatGrams" = 42.4, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = 'hummus-snack';

INSERT INTO "admin"."RecipeNutrition" ("id", "recipeId", "calories", "proteinGrams", "carbsGrams", "fatGrams", "fibreGrams", "saturatedFatGrams", "sugarGrams", "sodiumMg", "basis", "updatedAt")
SELECT 'nutrition-hummus-snack', "id", 693, 14.1, 59.7, 42.4, 7.5, 5.0, 2.7, 1048, 'estimated per serving; based on Yutto cheese chips and Deli Dip hummus', CURRENT_TIMESTAMP
FROM "admin"."Recipe" WHERE "slug" = 'hummus-snack'
ON CONFLICT ("recipeId") DO UPDATE SET "calories" = EXCLUDED."calories", "proteinGrams" = EXCLUDED."proteinGrams", "carbsGrams" = EXCLUDED."carbsGrams", "fatGrams" = EXCLUDED."fatGrams", "fibreGrams" = EXCLUDED."fibreGrams", "saturatedFatGrams" = EXCLUDED."saturatedFatGrams", "sugarGrams" = EXCLUDED."sugarGrams", "sodiumMg" = EXCLUDED."sodiumMg", "basis" = EXCLUDED."basis", "updatedAt" = CURRENT_TIMESTAMP;
