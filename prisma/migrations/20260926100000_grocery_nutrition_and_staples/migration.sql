-- Recipe totals come from grocery profiles. Saved recipe nutrition is leftover
-- from the first estimates and is removed. Dry spices stay out of the grocery
-- list and out of nutrition. Oil and salt stay out of the list, but their
-- measured weights still count.

ALTER TABLE "admin"."GroceryItem" ADD COLUMN "pantryStaple" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "admin"."GroceryItem" ADD COLUMN "excludeFromNutrition" BOOLEAN NOT NULL DEFAULT false;

UPDATE "admin"."GroceryItem"
SET "pantryStaple" = true,
    "excludeFromNutrition" = true,
    "nutritionPer100g" = NULL,
    "nutritionSource" = 'Dry spice. Excluded from nutrition and from the grocery list.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") IN (
  'chili flakes', 'dried curry leaves', 'garam masala', 'ground cinnamon', 'ground cumin',
  'ground nutmeg', 'nutmeg', 'paprika', 'ground turmeric', 'turmeric powder', 'black pepper', 'pepper'
);

UPDATE "admin"."RecipeIngredient"
SET "groceryItemId" = NULL, "pantryStaple" = true
WHERE lower("name") IN (
  'chili flakes', 'dried curry leaves', 'garam masala', 'ground cinnamon', 'ground cumin',
  'ground nutmeg', 'nutmeg', 'paprika', 'ground turmeric', 'turmeric powder',
  'black pepper', 'pepper', 'italian seasoning'
);

UPDATE "admin"."GroceryItem"
SET "pantryStaple" = true, "excludeFromNutrition" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("name") IN ('olive oil', 'vegetable oil', 'sunflower oil', 'sun-dried tomato oil')
   OR "name" IN ('Bad Reichenhaller AlpenJodSalz', 'salt');

-- One salt definition. Recipe lines keep their gram weights and point at the iodised salt.
UPDATE "admin"."RecipeIngredient" AS ingredient
SET "groceryItemId" = salt."id", "pantryStaple" = true
FROM "admin"."GroceryItem" AS salt
WHERE salt."name" = 'Bad Reichenhaller AlpenJodSalz'
  AND lower(ingredient."name") = 'salt';

UPDATE "admin"."GroceryItem" AS generic
SET "nutritionPer100g" = branded."nutritionPer100g",
    "nutritionSource" = branded."nutritionSource",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" AS branded
WHERE generic."name" = 'salt'
  AND branded."name" = 'Bad Reichenhaller AlpenJodSalz'
  AND generic."nutritionPer100g" IS NULL;

-- 1 tbsp oil = 15 g. Unmeasured oils get a small cooking amount.
UPDATE "admin"."RecipeIngredient" AS ingredient
SET "amount" = '1', "unit" = 'tbsp', "quantity" = 15, "weightGrams" = 15, "pantryStaple" = true
FROM "admin"."Recipe" AS recipe
WHERE ingredient."recipeId" = recipe."id"
  AND recipe."slug" = 'mascarpone-pasta'
  AND lower(ingredient."name") = 'olive oil'
  AND (ingredient."weightGrams" IS NULL OR ingredient."weightGrams" = 0);

UPDATE "admin"."RecipeIngredient" AS ingredient
SET "amount" = '1', "unit" = 'tsp', "quantity" = 5, "weightGrams" = 5, "pantryStaple" = true
FROM "admin"."Recipe" AS recipe
WHERE ingredient."recipeId" = recipe."id"
  AND recipe."slug" IN ('hummus-snack', 'addon-panfried-shrimp')
  AND lower(ingredient."name") = 'olive oil'
  AND (ingredient."weightGrams" IS NULL OR ingredient."weightGrams" = 0);

-- Sun-dried tomato oil is the olive oil already in the kitchen, measured as 2 tbsp.
UPDATE "admin"."RecipeIngredient" AS ingredient
SET "groceryItemId" = oil."id",
    "amount" = '2', "unit" = 'tbsp', "quantity" = 30, "weightGrams" = 30,
    "pantryStaple" = true
FROM "admin"."Recipe" AS recipe, "admin"."GroceryItem" AS oil
WHERE ingredient."recipeId" = recipe."id"
  AND oil."name" = 'olive oil'
  AND lower(ingredient."name") LIKE '%oil%'
  AND ingredient."groceryItemId" IS NULL;

-- Mascarpone pasta had unmeasured salt. 1/2 tsp = 3 g of fine table salt.
UPDATE "admin"."RecipeIngredient"
SET "amount" = '1/2', "unit" = 'tsp', "quantity" = 3, "weightGrams" = 3, "pantryStaple" = true
WHERE lower("name") = 'salt'
  AND ("weightGrams" IS NULL OR "weightGrams" = 0);

-- Sugar is a tracked grocery, not a spice or cooking staple.
UPDATE "admin"."RecipeIngredient"
SET "pantryStaple" = false
WHERE lower("name") = 'sugar';

-- Cooked white rice. The curry weighs 640 g after cooking, so this profile is cooked rice.
UPDATE "admin"."GroceryItem"
SET "nutritionPer100g" = profile.data,
    "nutritionSource" = profile.source,
    "weightBasis" = CASE WHEN "admin"."GroceryItem"."name" = 'rice' AND "admin"."GroceryItem"."weightBasis" = '' THEN 'Nutrition is for cooked white rice, matching recipe weights given after cooking.' ELSE "admin"."GroceryItem"."weightBasis" END,
    "updatedAt" = CURRENT_TIMESTAMP
FROM (VALUES
  ('butter', '{"calories":717,"proteinGrams":0.85,"fatGrams":81.11,"saturatedFatGrams":51.37,"carbsGrams":0.06,"fibreGrams":0,"sugarGrams":0.06,"sodiumMg":11,"potassiumMg":24,"calciumMg":24,"magnesiumMg":2,"ironMg":0.02,"zincMg":0.09,"folateMcg":3}'::jsonb,
    'USDA FoodData Central: butter, unsalted; per 100 g'),
  ('cacao nibs', '{"calories":571,"proteinGrams":12,"fatGrams":46,"saturatedFatGrams":27,"carbsGrams":30,"fibreGrams":23,"sugarGrams":1,"sodiumMg":20,"potassiumMg":750,"calciumMg":80,"magnesiumMg":270,"ironMg":8,"zincMg":4,"folateMcg":30}'::jsonb,
    'Generic cacao nib estimate per 100 g; refine from the package label.'),
  ('cauliflower', '{"calories":25,"proteinGrams":1.92,"fatGrams":0.28,"saturatedFatGrams":0.13,"carbsGrams":4.97,"fibreGrams":2,"sugarGrams":1.91,"sodiumMg":30,"potassiumMg":299,"calciumMg":22,"magnesiumMg":15,"ironMg":0.42,"zincMg":0.27,"folateMcg":57}'::jsonb,
    'USDA FoodData Central: cauliflower, raw; per 100 g'),
  ('chicken broth', '{"calories":6,"proteinGrams":0.62,"fatGrams":0.21,"saturatedFatGrams":0.05,"carbsGrams":0.42,"fibreGrams":0,"sugarGrams":0.3,"sodiumMg":343,"potassiumMg":38,"calciumMg":4,"magnesiumMg":3,"ironMg":0.2,"zincMg":0.1,"folateMcg":2}'::jsonb,
    'USDA FoodData Central: chicken broth, canned, ready to serve; per 100 g'),
  ('crushed tomatoes', '{"calories":32,"proteinGrams":1.64,"fatGrams":0.28,"saturatedFatGrams":0.04,"carbsGrams":7.29,"fibreGrams":1.9,"sugarGrams":4.8,"sodiumMg":186,"potassiumMg":293,"calciumMg":28,"magnesiumMg":16,"ironMg":0.95,"zincMg":0.2,"folateMcg":9}'::jsonb,
    'USDA FoodData Central: crushed tomatoes, canned; per 100 g'),
  ('full-fat coconut milk', '{"calories":197,"proteinGrams":2.02,"fatGrams":21.33,"saturatedFatGrams":18.92,"carbsGrams":2.81,"fibreGrams":0,"sugarGrams":1.7,"sodiumMg":13,"potassiumMg":220,"calciumMg":18,"magnesiumMg":46,"ironMg":3.3,"zincMg":0.56,"folateMcg":16}'::jsonb,
    'USDA FoodData Central: coconut milk, canned; per 100 g'),
  ('ginger', '{"calories":80,"proteinGrams":1.82,"fatGrams":0.75,"saturatedFatGrams":0.2,"carbsGrams":17.77,"fibreGrams":2,"sugarGrams":1.7,"sodiumMg":13,"potassiumMg":415,"calciumMg":16,"magnesiumMg":43,"ironMg":0.6,"zincMg":0.34,"folateMcg":11}'::jsonb,
    'USDA FoodData Central: ginger, raw; per 100 g'),
  ('guanciale', '{"calories":520,"proteinGrams":14,"fatGrams":51,"saturatedFatGrams":18,"carbsGrams":0.5,"fibreGrams":0,"sugarGrams":0,"sodiumMg":1600,"potassiumMg":200,"calciumMg":12,"magnesiumMg":15,"ironMg":0.6,"zincMg":1.5,"folateMcg":2}'::jsonb,
    'Generic cured pork jowl estimate per 100 g; refine from the package label.'),
  ('heavy cream', '{"calories":340,"proteinGrams":2.05,"fatGrams":36.08,"saturatedFatGrams":23.03,"carbsGrams":2.84,"fibreGrams":0,"sugarGrams":2.92,"sodiumMg":38,"potassiumMg":95,"calciumMg":66,"magnesiumMg":7,"ironMg":0.04,"zincMg":0.23,"folateMcg":4}'::jsonb,
    'USDA FoodData Central: heavy whipping cream; per 100 g'),
  ('hummus', '{"calories":177,"proteinGrams":7.9,"fatGrams":9.6,"saturatedFatGrams":1.4,"carbsGrams":14.3,"fibreGrams":6,"sugarGrams":0.3,"sodiumMg":379,"potassiumMg":228,"calciumMg":38,"magnesiumMg":71,"ironMg":2.4,"zincMg":1.4,"folateMcg":36}'::jsonb,
    'USDA FoodData Central: hummus, commercial; per 100 g'),
  ('pecorino', '{"calories":387,"proteinGrams":31.8,"fatGrams":26.94,"saturatedFatGrams":17.12,"carbsGrams":3.63,"fibreGrams":0,"sugarGrams":0.73,"sodiumMg":1433,"potassiumMg":86,"calciumMg":1064,"magnesiumMg":41,"ironMg":0.77,"zincMg":2.58,"folateMcg":7}'::jsonb,
    'USDA FoodData Central: pecorino romano style hard cheese; per 100 g'),
  ('rice', '{"calories":130,"proteinGrams":2.69,"fatGrams":0.28,"saturatedFatGrams":0.08,"carbsGrams":28.17,"fibreGrams":0.4,"sugarGrams":0.05,"sodiumMg":1,"potassiumMg":35,"calciumMg":10,"magnesiumMg":12,"ironMg":0.2,"zincMg":0.49,"folateMcg":3}'::jsonb,
    'USDA FoodData Central: white rice, cooked; per 100 g'),
  ('sugar', '{"calories":387,"proteinGrams":0,"fatGrams":0,"saturatedFatGrams":0,"carbsGrams":99.98,"fibreGrams":0,"sugarGrams":99.8,"sodiumMg":1,"potassiumMg":2,"calciumMg":1,"magnesiumMg":0,"ironMg":0.05,"zincMg":0.01,"folateMcg":0}'::jsonb,
    'USDA FoodData Central: granulated sugar; per 100 g'),
  ('sunflower oil', '{"calories":884,"proteinGrams":0,"fatGrams":100,"saturatedFatGrams":10.3,"carbsGrams":0,"fibreGrams":0,"sugarGrams":0,"sodiumMg":0,"potassiumMg":0,"calciumMg":0,"magnesiumMg":0,"ironMg":0,"zincMg":0,"folateMcg":0}'::jsonb,
    'USDA FoodData Central: sunflower oil; per 100 g'),
  ('tofu', '{"calories":144,"proteinGrams":17.3,"fatGrams":8.72,"saturatedFatGrams":1.26,"carbsGrams":2.78,"fibreGrams":2.3,"sugarGrams":0.5,"sodiumMg":14,"potassiumMg":237,"calciumMg":683,"magnesiumMg":58,"ironMg":2.66,"zincMg":1.57,"folateMcg":29}'::jsonb,
    'USDA FoodData Central: extra-firm tofu, calcium-set; per 100 g'),
  ('tomato paste', '{"calories":82,"proteinGrams":4.32,"fatGrams":0.47,"saturatedFatGrams":0.1,"carbsGrams":18.91,"fibreGrams":4.1,"sugarGrams":12.18,"sodiumMg":59,"potassiumMg":1014,"calciumMg":36,"magnesiumMg":42,"ironMg":2.98,"zincMg":0.63,"folateMcg":12}'::jsonb,
    'USDA FoodData Central: tomato paste, canned, without salt added; per 100 g'),
  ('tomato sauce', '{"calories":29,"proteinGrams":1.32,"fatGrams":0.17,"saturatedFatGrams":0.02,"carbsGrams":5.31,"fibreGrams":1.4,"sugarGrams":3.56,"sodiumMg":250,"potassiumMg":297,"calciumMg":13,"magnesiumMg":15,"ironMg":0.86,"zincMg":0.18,"folateMcg":9}'::jsonb,
    'USDA FoodData Central: tomato sauce, canned; per 100 g. Sodium is a typical salted sauce, not a specific brand.'),
  ('tortilla chips', '{"calories":489,"proteinGrams":7,"fatGrams":24,"saturatedFatGrams":3.1,"carbsGrams":62,"fibreGrams":5,"sugarGrams":1,"sodiumMg":430,"potassiumMg":180,"calciumMg":140,"magnesiumMg":80,"ironMg":1.4,"zincMg":1.3,"folateMcg":15}'::jsonb,
    'USDA FoodData Central: plain tortilla chips; per 100 g. Refine from the package label.'),
  ('vegetable oil', '{"calories":884,"proteinGrams":0,"fatGrams":100,"saturatedFatGrams":14.4,"carbsGrams":0,"fibreGrams":0,"sugarGrams":0,"sodiumMg":0,"potassiumMg":0,"calciumMg":0,"magnesiumMg":0,"ironMg":0,"zincMg":0,"folateMcg":0}'::jsonb,
    'USDA FoodData Central: vegetable oil; per 100 g'),
  ('white wine', '{"calories":82,"proteinGrams":0.07,"fatGrams":0,"saturatedFatGrams":0,"carbsGrams":2.6,"fibreGrams":0,"sugarGrams":0.96,"sodiumMg":5,"potassiumMg":71,"calciumMg":9,"magnesiumMg":10,"ironMg":0.27,"zincMg":0.12,"folateMcg":1}'::jsonb,
    'USDA FoodData Central: white table wine; per 100 g')
) AS profile(name, data, source)
WHERE lower("admin"."GroceryItem"."name") = profile.name
  AND "admin"."GroceryItem"."nutritionPer100g" IS NULL;

UPDATE "admin"."Recipe"
SET "calories" = NULL, "proteinGrams" = NULL, "carbsGrams" = NULL, "fatGrams" = NULL, "updatedAt" = CURRENT_TIMESTAMP
WHERE "calories" IS NOT NULL OR "proteinGrams" IS NOT NULL OR "carbsGrams" IS NOT NULL OR "fatGrams" IS NOT NULL;

DELETE FROM "admin"."RecipeNutrition";
