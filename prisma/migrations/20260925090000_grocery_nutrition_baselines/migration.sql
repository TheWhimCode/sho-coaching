-- Generic per-100 g nutrition profiles. These are baselines for unbranded whole foods;
-- packaged foods should be replaced with the purchased product's nutrition label.
-- Values are intentionally limited to nutrients surfaced in the Health planner and that
-- make a material contribution at normal recipe portions.
BEGIN;

UPDATE "admin"."GroceryItem"
SET
  "nutritionPer100g" = '{
    "calories": 23, "proteinGrams": 2.86, "carbsGrams": 3.63, "fatGrams": 0.39,
    "fibreGrams": 2.2, "saturatedFatGrams": 0.06, "sugarGrams": 0.42,
    "sodiumMg": 79, "potassiumMg": 558, "calciumMg": 99, "magnesiumMg": 79,
    "ironMg": 2.71, "zincMg": 0.53, "folateMcg": 194
  }'::jsonb,
  "nutritionSource" = 'USDA FoodData Central: spinach, raw; per 100 g (generic baseline)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") = 'spinach';

UPDATE "admin"."GroceryItem"
SET
  "nutritionPer100g" = '{
    "calories": 371, "proteinGrams": 13.04, "carbsGrams": 74.67, "fatGrams": 1.51,
    "fibreGrams": 3.2, "saturatedFatGrams": 0.28, "sugarGrams": 2.67,
    "sodiumMg": 6, "potassiumMg": 223, "calciumMg": 21, "magnesiumMg": 53,
    "ironMg": 3.19, "zincMg": 1.41, "folateMcg": 183
  }'::jsonb,
  "nutritionSource" = 'USDA FoodData Central: spaghetti, dry, enriched; per 100 g (generic baseline; replace with package label)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") IN ('spaghetti', 'pasta');

UPDATE "admin"."GroceryItem"
SET
  "nutritionPer100g" = '{
    "calories": 149, "proteinGrams": 6.36, "carbsGrams": 33.06, "fatGrams": 0.5,
    "fibreGrams": 2.1, "saturatedFatGrams": 0.09, "sugarGrams": 1,
    "sodiumMg": 17, "potassiumMg": 401, "calciumMg": 181, "magnesiumMg": 25,
    "ironMg": 1.7, "zincMg": 1.16, "folateMcg": 3
  }'::jsonb,
  "nutritionSource" = 'USDA FoodData Central: garlic, raw; per 100 g (generic baseline)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") = 'garlic';

UPDATE "admin"."GroceryItem"
SET
  "nutritionPer100g" = '{
    "calories": 15, "proteinGrams": 0.65, "carbsGrams": 3.63, "fatGrams": 0.11,
    "fibreGrams": 0.5, "saturatedFatGrams": 0.04, "sugarGrams": 1.67,
    "sodiumMg": 2, "potassiumMg": 147, "calciumMg": 16, "magnesiumMg": 13,
    "ironMg": 0.28, "zincMg": 0.2, "folateMcg": 7
  }'::jsonb,
  "nutritionSource" = 'USDA FoodData Central: cucumber, with peel, raw; per 100 g (generic baseline)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") = 'cucumber';

COMMIT;
