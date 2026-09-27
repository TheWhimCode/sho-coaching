-- These recipe inputs are assumed to be available in the kitchen. They retain
-- their measured weights and nutrition profiles, but do not create shopping requirements.
UPDATE "admin"."GroceryItem"
SET
  "pantryStaple" = true,
  "excludeFromNutrition" = false,
  "nutritionPer100g" = CASE "name"
    WHEN 'smoked paprika' THEN '{"calories":282,"proteinGrams":14.1,"fatGrams":13,"carbsGrams":54,"fibreGrams":34.9,"sodiumMg":68,"potassiumMg":2280,"calciumMg":229,"magnesiumMg":178,"ironMg":21.1,"zincMg":4.3,"folateMcg":49}'::jsonb
    WHEN 'black pepper' THEN '{"calories":251,"proteinGrams":10.4,"fatGrams":3.3,"carbsGrams":64,"fibreGrams":25.3,"sodiumMg":20,"potassiumMg":1329,"calciumMg":443,"magnesiumMg":171,"ironMg":9.7,"zincMg":1.2,"folateMcg":17}'::jsonb
    ELSE "nutritionPer100g"
  END,
  "nutritionSource" = CASE "name"
    WHEN 'smoked paprika' THEN 'USDA FoodData Central: paprika; per 100 g. Used as a smoked-paprika estimate.'
    WHEN 'black pepper' THEN 'USDA FoodData Central: black pepper; per 100 g'
    ELSE "nutritionSource"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('vegetable broth', 'smoked paprika', 'black pepper');

UPDATE "admin"."RecipeIngredient"
SET
  "pantryStaple" = true,
  "quantity" = CASE "name"
    WHEN 'smoked paprika' THEN 1.15
    WHEN 'black pepper' THEN 1.15
    ELSE "quantity"
  END,
  "weightGrams" = CASE "name"
    WHEN 'smoked paprika' THEN 1.15
    WHEN 'black pepper' THEN 1.15
    ELSE "weightGrams"
  END
WHERE "recipeId" = (SELECT "id" FROM "admin"."Recipe" WHERE "slug" = 'spiced-red-lentil-carrot-soup')
  AND "name" IN ('vegetable broth', 'smoked paprika', 'black pepper');
