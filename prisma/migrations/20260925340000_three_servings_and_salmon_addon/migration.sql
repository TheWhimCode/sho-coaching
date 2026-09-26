BEGIN;

-- Only the serving count changes; preserve every other recipe field.
UPDATE "admin"."Recipe" SET "servings" = 3
WHERE "slug" = 'creamy-chicken-pasta';

-- USDA FoodData Central SR Legacy, FDC 175167. Raw weight, per 100 g.
-- EPA + DHA = (0.862 + 1.104) g. Unknown iodine is intentionally omitted.
INSERT INTO "admin"."GroceryItem"
  ("id", "name", "category", "nutritionPer100g", "nutritionSource", "createdAt", "updatedAt")
VALUES
  ('grocery-salmon', 'salmon', 'seafood',
   '{"calories":208,"proteinGrams":20.42,"carbsGrams":0,"fatGrams":13.42,"fibreGrams":0,"saturatedFatGrams":3.05,"sugarGrams":0,"sodiumMg":59,"potassiumMg":363,"calciumMg":9,"magnesiumMg":27,"ironMg":0.34,"zincMg":0.36,"vitaminDMcg":11,"vitaminB12McG":3.23,"folateMcg":26,"omega3AlAGrams":0.148,"omega3EpaDhaMg":1966}'::jsonb,
   'USDA FoodData Central: Atlantic salmon, farmed, raw; per 100 g before cooking; excludes added oil. https://fdc.nal.usda.gov/food-details/175167/nutrients',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
  "nutritionPer100g" = EXCLUDED."nutritionPer100g",
  "nutritionSource" = EXCLUDED."nutritionSource",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "admin"."Recipe"
  ("id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "notes", "createdAt", "updatedAt")
VALUES
  ('recipe-panfried-salmon', 'addon-panfried-salmon', 'Pan-fried Salmon',
   'One fixed 200 g addition to a meal, independent of the main meal’s servings.',
   NULL, 2, 10, ARRAY['add-on'],
   'Weigh 200 g before cooking. Nutrition uses generic farmed Atlantic salmon and excludes added oil or seasoning.',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "sortOrder")
SELECT 'panfried-salmon-ingredient', 'recipe-panfried-salmon', "id", 200, 200, '200', 'g', 'salmon', 0
FROM "admin"."GroceryItem" WHERE "name" = 'salmon';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder")
VALUES ('panfried-salmon-step', 'recipe-panfried-salmon',
  'Pat the salmon dry. Heat a non-stick pan over medium heat. Place the salmon skin-side down, if skin-on, and cook until mostly opaque. Turn and finish cooking until cooked through. Serve as one add-on to the meal.', 0);

COMMIT;
