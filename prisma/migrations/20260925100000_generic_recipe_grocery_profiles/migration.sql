-- Generic ingredient baselines for recipe ingredients whose nutrition does not
-- materially depend on a purchased brand. Values are per 100 g edible portion.
-- Product-specific foods deliberately remain unset for label-based entry later.
BEGIN;

UPDATE "admin"."GroceryItem" SET "nutritionPer100g" = profile.data, "nutritionSource" = 'USDA FoodData Central; per 100 g generic ingredient baseline', "updatedAt" = CURRENT_TIMESTAMP
FROM (VALUES
  ('banana', '{"calories":89,"proteinGrams":1.09,"carbsGrams":22.84,"fatGrams":0.33,"fibreGrams":2.6,"saturatedFatGrams":0.11,"sugarGrams":12.23,"sodiumMg":1,"potassiumMg":358,"calciumMg":5,"magnesiumMg":27,"ironMg":0.26,"zincMg":0.15,"folateMcg":20}'::jsonb),
  ('black pepper', '{"calories":251,"proteinGrams":10.39,"carbsGrams":63.95,"fatGrams":3.26,"fibreGrams":25.3,"saturatedFatGrams":1.39,"sugarGrams":0.64,"sodiumMg":20,"potassiumMg":1329,"calciumMg":443,"magnesiumMg":171,"ironMg":9.71,"zincMg":1.19,"folateMcg":17}'::jsonb),
  ('pepper', '{"calories":251,"proteinGrams":10.39,"carbsGrams":63.95,"fatGrams":3.26,"fibreGrams":25.3,"saturatedFatGrams":1.39,"sugarGrams":0.64,"sodiumMg":20,"potassiumMg":1329,"calciumMg":443,"magnesiumMg":171,"ironMg":9.71,"zincMg":1.19,"folateMcg":17}'::jsonb),
  ('chili pepper', '{"calories":40,"proteinGrams":1.87,"carbsGrams":8.81,"fatGrams":0.44,"fibreGrams":1.5,"saturatedFatGrams":0.04,"sugarGrams":5.3,"sodiumMg":7,"potassiumMg":322,"calciumMg":14,"magnesiumMg":23,"ironMg":1.03,"zincMg":0.26,"folateMcg":23}'::jsonb),
  ('egg yolks', '{"calories":322,"proteinGrams":15.86,"carbsGrams":3.59,"fatGrams":26.54,"fibreGrams":0,"saturatedFatGrams":9.55,"sugarGrams":0.56,"sodiumMg":48,"potassiumMg":109,"calciumMg":129,"magnesiumMg":5,"ironMg":2.73,"zincMg":2.3,"vitaminDMcg":5.4,"vitaminB12McG":1.95,"folateMcg":146}'::jsonb),
  ('lemon', '{"calories":29,"proteinGrams":1.1,"carbsGrams":9.32,"fatGrams":0.3,"fibreGrams":2.8,"saturatedFatGrams":0.04,"sugarGrams":2.5,"sodiumMg":2,"potassiumMg":138,"calciumMg":26,"magnesiumMg":8,"ironMg":0.6,"zincMg":0.06,"folateMcg":11}'::jsonb),
  ('mango', '{"calories":60,"proteinGrams":0.82,"carbsGrams":14.98,"fatGrams":0.38,"fibreGrams":1.6,"saturatedFatGrams":0.09,"sugarGrams":13.66,"sodiumMg":1,"potassiumMg":168,"calciumMg":11,"magnesiumMg":10,"ironMg":0.16,"zincMg":0.09,"folateMcg":43}'::jsonb),
  ('nutmeg', '{"calories":525,"proteinGrams":5.84,"carbsGrams":49.29,"fatGrams":36.31,"fibreGrams":20.8,"saturatedFatGrams":25.94,"sugarGrams":2.99,"sodiumMg":16,"potassiumMg":350,"calciumMg":184,"magnesiumMg":183,"ironMg":3.04,"zincMg":2.15,"folateMcg":76}'::jsonb),
  ('olive oil', '{"calories":884,"proteinGrams":0,"carbsGrams":0,"fatGrams":100,"fibreGrams":0,"saturatedFatGrams":13.8,"sugarGrams":0,"sodiumMg":2,"potassiumMg":1,"calciumMg":1,"magnesiumMg":0,"ironMg":0.56,"zincMg":0,"omega3AlAGrams":0.76}'::jsonb),
  ('pecan nuts', '{"calories":691,"proteinGrams":9.17,"carbsGrams":13.86,"fatGrams":71.97,"fibreGrams":9.6,"saturatedFatGrams":6.18,"sugarGrams":3.97,"sodiumMg":0,"potassiumMg":410,"calciumMg":70,"magnesiumMg":121,"ironMg":2.53,"zincMg":4.53,"folateMcg":22,"omega3AlAGrams":0.99}'::jsonb),
  ('raspberries', '{"calories":52,"proteinGrams":1.2,"carbsGrams":11.94,"fatGrams":0.65,"fibreGrams":6.5,"saturatedFatGrams":0.02,"sugarGrams":4.42,"sodiumMg":1,"potassiumMg":151,"calciumMg":25,"magnesiumMg":22,"ironMg":0.69,"zincMg":0.42,"folateMcg":21}'::jsonb),
  ('roasted sunflower seeds', '{"calories":582,"proteinGrams":19.33,"carbsGrams":24.07,"fatGrams":49.8,"fibreGrams":11.1,"saturatedFatGrams":5.2,"sugarGrams":2.62,"sodiumMg":3,"potassiumMg":645,"calciumMg":70,"magnesiumMg":129,"ironMg":5.25,"zincMg":5,"folateMcg":227}'::jsonb),
  ('salt', '{"calories":0,"proteinGrams":0,"carbsGrams":0,"fatGrams":0,"fibreGrams":0,"saturatedFatGrams":0,"sugarGrams":0,"sodiumMg":38758,"potassiumMg":0,"calciumMg":0,"magnesiumMg":0,"ironMg":0,"zincMg":0,"folateMcg":0}'::jsonb),
  ('shrimp', '{"calories":85,"proteinGrams":20.1,"carbsGrams":0,"fatGrams":0.51,"fibreGrams":0,"saturatedFatGrams":0.1,"sugarGrams":0,"sodiumMg":119,"potassiumMg":264,"calciumMg":64,"magnesiumMg":35,"ironMg":0.52,"zincMg":1.64,"vitaminB12McG":1.11,"folateMcg":19,"omega3EpaDhaMg":300}'::jsonb)
) AS profile(name, data)
WHERE lower("admin"."GroceryItem"."name") = profile.name;

-- Complete existing profiles with known-zero/immaterial Health fields. A missing
-- field means unknown; these explicit zeros let recipe totals be calculated once
-- every ingredient profile is present without displaying tiny nutrient amounts.
UPDATE "admin"."GroceryItem"
SET "nutritionPer100g" = jsonb_build_object(
  'vitaminDMcg', 0, 'vitaminB12McG', 0, 'iodineMcg', 0,
  'omega3AlAGrams', 0, 'omega3EpaDhaMg', 0
) || "nutritionPer100g", "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") IN ('spinach', 'spaghetti', 'pasta', 'garlic', 'cucumber')
  AND "nutritionPer100g" IS NOT NULL;

-- The catalogue itself is the grocery list. Add explicit zero-stock lots only
-- where none exist, so these definitions are visible without claiming stock.
INSERT INTO "admin"."GroceryLot" (
  "id", "groceryItemId", "purchasedAmount", "remainingAmount", "purchasedCount", "remainingCount", "purchasedWeightGrams", "remainingWeightGrams", "purchasedAt", "createdAt", "updatedAt"
)
SELECT 'zero-stock-' || md5(g."id"), g."id", '0', '0', 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" g
WHERE lower(g."name") IN ('banana', 'black pepper', 'pepper', 'chili pepper', 'egg yolks', 'lemon', 'mango', 'nutmeg', 'olive oil', 'pecan nuts', 'raspberries', 'roasted sunflower seeds', 'salt', 'shrimp')
  AND NOT EXISTS (SELECT 1 FROM "admin"."GroceryLot" l WHERE l."groceryItemId" = g."id");

COMMIT;
