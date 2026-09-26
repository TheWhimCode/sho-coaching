ALTER TABLE "admin"."GroceryItem"
  ADD COLUMN "unitsPerPurchase" DECIMAL(12,3);

-- A recipe can use one 150 g yogurt cup, while shopping and stock add the
-- product's actual four-cup multipack (600 g).
UPDATE "admin"."GroceryItem"
SET
  "name" = 'Elinas Greek yogurt',
  "gramsPerCount" = 150,
  "unitsPerPurchase" = 4,
  "weightBasis" = 'One cup: 150 g; purchased as a 4 × 150 g multipack (600 g)',
  "nutritionPer100g" = '{"calories":116,"fatGrams":9.4,"saturatedFatGrams":6.3,"carbsGrams":3.9,"sugarGrams":3.9,"proteinGrams":3.3,"sodiumMg":52,"calciumMg":120}'::jsonb,
  "nutritionSource" = 'Elinas Greek yogurt natural, REWE label; per 100 g'
WHERE "id" = 'grocery-recipe-135c1ae9520713a5c3efbafc7bcec097';

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Yutto BIO Mandeldrink ungesüßt',
  "gramsPerCount" = 1000,
  "unitsPerPurchase" = 1,
  "weightBasis" = 'One carton: 1 l / 1000 g',
  "nutritionPer100g" = '{"calories":26,"fatGrams":2.4,"saturatedFatGrams":0.22,"carbsGrams":1,"sugarGrams":0.22,"proteinGrams":0.9,"fibreGrams":0.5,"sodiumMg":40}'::jsonb,
  "nutritionSource" = 'Yutto BIO Mandeldrink ungesüßt, Knuspr label; per 100 ml (treated as 100 g)'
WHERE "id" = 'grocery-recipe-d60536f7a483b2251c8c6d969bcbc792';

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Yutto Pecans',
  "gramsPerCount" = 3,
  "unitsPerPurchase" = NULL,
  "weightBasis" = 'One whole pecan kernel (two halves): 3 g; bag: 200 g',
  "nutritionPer100g" = '{"calories":760,"fatGrams":72,"saturatedFatGrams":6,"carbsGrams":14,"sugarGrams":4,"proteinGrams":9,"fibreGrams":10,"sodiumMg":8}'::jsonb,
  "nutritionSource" = 'Yutto Pecans, Knuspr label; per 100 g'
WHERE "id" = 'grocery-measure-5c919d21f2d261890004c36662da2ef1';

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Bio Inside frozen raspberries',
  "gramsPerCount" = 300,
  "unitsPerPurchase" = 1,
  "weightBasis" = 'One bag: 300 g',
  "nutritionPer100g" = '{"calories":42,"fatGrams":0.3,"saturatedFatGrams":0,"carbsGrams":4.8,"sugarGrams":4.8,"proteinGrams":1.3,"fibreGrams":4.7,"sodiumMg":4}'::jsonb,
  "nutritionSource" = 'Bio Inside Bio Himbeeren, REWE label; per 100 g'
WHERE "id" = 'grocery-recipe-ed974a42724a7427cec56ca9564d89fb';

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Alnatura Bio Mango cubes',
  "gramsPerCount" = 300,
  "unitsPerPurchase" = 1,
  "weightBasis" = 'One bag: 300 g',
  "nutritionPer100g" = '{"calories":59,"fatGrams":0.5,"saturatedFatGrams":0.1,"carbsGrams":14,"sugarGrams":12,"proteinGrams":0.5,"fibreGrams":1.3,"sodiumMg":12}'::jsonb,
  "nutritionSource" = 'Alnatura Mango gewürfelt (TK) label; per 100 g'
WHERE "id" = 'grocery-recipe-aa00faf97d042c13a59da4d27eb32358';

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Galbani Mascarpone',
  "gramsPerCount" = 250,
  "unitsPerPurchase" = 1,
  "weightBasis" = 'One tub: 250 g',
  "nutritionPer100g" = '{"calories":412,"fatGrams":41.5,"saturatedFatGrams":29,"carbsGrams":4.8,"sugarGrams":4.5,"proteinGrams":4.8,"sodiumMg":40}'::jsonb,
  "nutritionSource" = 'Galbani Mascarpone 250 g, Lactalis Germany label; per 100 g'
WHERE "id" = 'grocery-measure-684e0d41a2e4fb33e53a055d251d316c';

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Oro di Parma Passierte Tomaten',
  "gramsPerCount" = 400,
  "unitsPerPurchase" = 1,
  "weightBasis" = 'One carton: 400 g',
  "nutritionPer100g" = '{"calories":33,"fatGrams":0.5,"saturatedFatGrams":0.1,"carbsGrams":4.9,"sugarGrams":4.9,"proteinGrams":1.4,"fibreGrams":2.2,"sodiumMg":200}'::jsonb,
  "nutritionSource" = 'Oro di Parma Passierte Tomaten, REWE label; per 100 g'
WHERE "id" = 'grocery-measure-4df9943f813a7c9fbdc1535b6ec7113d';

INSERT INTO "admin"."GroceryItem" (
  "id", "name", "category", "gramsPerCount", "unitsPerPurchase", "weightBasis", "nutritionPer100g", "nutritionSource", "createdAt", "updatedAt"
) VALUES (
  'grocery-kitchin-basmati-rice', 'Kitchin Basmati Rice', 'grains', 500, 1, 'One bag: 500 g',
  '{"calories":349,"fatGrams":0.8,"saturatedFatGrams":0.2,"carbsGrams":77.7,"sugarGrams":0.2,"proteinGrams":8.2,"fibreGrams":1,"sodiumMg":0}'::jsonb,
  'Kitchin Basmati Rice package size from Knuspr; generic plain basmati rice nutrition baseline per 100 g', NOW(), NOW()
)
ON CONFLICT ("name") DO UPDATE SET
  "gramsPerCount" = EXCLUDED."gramsPerCount",
  "unitsPerPurchase" = EXCLUDED."unitsPerPurchase",
  "weightBasis" = EXCLUDED."weightBasis",
  "nutritionPer100g" = EXCLUDED."nutritionPer100g",
  "nutritionSource" = EXCLUDED."nutritionSource",
  "updatedAt" = NOW();
