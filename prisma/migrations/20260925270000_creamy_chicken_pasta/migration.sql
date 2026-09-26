BEGIN;

INSERT INTO "admin"."GroceryItem" ("id", "name", "category", "nutritionPer100g", "nutritionSource", "createdAt", "updatedAt") VALUES
  ('grocery-sun-dried-tomatoes', 'sun-dried tomatoes', 'pantry',
   '{"calories":213,"proteinGrams":5.06,"fatGrams":14.08,"saturatedFatGrams":1.893,"carbsGrams":23.33,"fibreGrams":5.8,"sodiumMg":266,"potassiumMg":1565,"calciumMg":47,"magnesiumMg":81,"ironMg":2.68,"zincMg":0.78,"folateMcg":23}'::jsonb,
   'USDA FoodData Central: tomatoes, sun-dried, packed in oil, drained; per 100 g', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-tomato-paste', 'tomato paste', 'pantry', NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-chicken-broth', 'chicken broth', 'pantry', NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

UPDATE "admin"."GroceryItem"
SET "nutritionPer100g" = '{"calories":120,"proteinGrams":22.5,"fatGrams":2.62,"saturatedFatGrams":0.563,"carbsGrams":0,"fibreGrams":0,"sugarGrams":0,"sodiumMg":45,"potassiumMg":334,"calciumMg":5,"magnesiumMg":28,"ironMg":0.37,"zincMg":0.68,"folateMcg":9}'::jsonb,
    "nutritionSource" = 'USDA FoodData Central: chicken breast, skinless, boneless, raw; per 100 g',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'chicken breast' AND "nutritionPer100g" IS NULL;

UPDATE "admin"."GroceryItem"
SET "nutritionPer100g" = '{"calories":40,"proteinGrams":1.1,"fatGrams":0.1,"saturatedFatGrams":0.042,"carbsGrams":9.34,"fibreGrams":1.7,"sugarGrams":4.24,"sodiumMg":4,"potassiumMg":146,"calciumMg":23,"magnesiumMg":10,"ironMg":0.21,"zincMg":0.17,"folateMcg":19}'::jsonb,
    "nutritionSource" = 'USDA FoodData Central: onions, raw; per 100 g',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'yellow onion' AND "nutritionPer100g" IS NULL;

UPDATE "admin"."GroceryItem"
SET "nutritionPer100g" = '{"calories":421,"proteinGrams":29.6,"fatGrams":28,"saturatedFatGrams":15.5,"carbsGrams":12.4,"sugarGrams":0.07,"sodiumMg":1750,"potassiumMg":184,"calciumMg":884,"magnesiumMg":34.9,"ironMg":0.45,"zincMg":4.33,"folateMcg":6}'::jsonb,
    "nutritionSource" = 'USDA FoodData Central: parmesan, grated; per 100 g',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Parmesan cheese' AND "nutritionPer100g" IS NULL;

INSERT INTO "admin"."Recipe" ("id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "notes", "createdAt", "updatedAt") VALUES
  ('recipe-creamy-chicken-pasta', 'creamy-chicken-pasta', 'Creamy chicken pasta',
   'Chicken and pasta in a sun-dried tomato cream sauce.', 4, 10, 25, ARRAY['pasta'], '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1 tsp salt = 6 g, the USDA teaspoon weight for fine table salt.
INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-oil', r."id", g."id", 30, 30, NULL, '2', 'tbsp', 'sun-dried tomato oil', '', false, true, 0
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'olive oil';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-breast', r."id", g."id", 453, 453, NULL, '453', 'g', 'chicken breast', '', false, false, 1
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'chicken breast';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-salt', r."id", g."id", 6, 6, NULL, '1', 'tsp', 'salt', '', false, true, 2
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'Bad Reichenhaller AlpenJodSalz';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-pepper', r."id", NULL, NULL, NULL, NULL, '1', 'tsp', 'black pepper', '', false, true, 3
FROM "admin"."Recipe" r WHERE r."slug" = 'creamy-chicken-pasta';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-onion', r."id", g."id", 75, 75, 0.5, '1/2', '', 'yellow onion', '', false, false, 4
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'yellow onion';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-garlic', r."id", g."id", 12, 12, 4, '4', 'cloves', 'garlic', '', false, false, 5
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'garlic';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-sundried', r."id", g."id", 90, 90, NULL, '90', 'g', 'sun-dried tomatoes', '', false, false, 6
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'sun-dried tomatoes';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-paste', r."id", g."id", 32, 32, NULL, '2', 'tbsp', 'tomato paste', '', false, false, 7
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'tomato paste';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-broth', r."id", g."id", 591, 591, NULL, '2 1/2', 'cups', 'chicken broth', '', false, false, 8
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'chicken broth';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-pasta', r."id", g."id", 227, 227, NULL, '227', 'g', 'pasta', '', false, false, 9
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'pasta';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-italian', r."id", NULL, NULL, NULL, NULL, '1 1/2', 'tsp', 'Italian seasoning', '', false, true, 10
FROM "admin"."Recipe" r WHERE r."slug" = 'creamy-chicken-pasta';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-cream', r."id", g."id", 119, 119, NULL, '1/2', 'cup', 'heavy cream', '', false, false, 11
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'heavy cream';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-spinach', r."id", g."id", 80, 80, NULL, '80', 'g', 'spinach', '', false, false, 12
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'spinach';

INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'creamy-chicken-parmesan', r."id", g."id", 40, 40, NULL, '40', 'g', 'Parmesan cheese', '', false, false, 13
FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g
WHERE r."slug" = 'creamy-chicken-pasta' AND g."name" = 'Parmesan cheese';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder") VALUES
  ('creamy-chicken-step-1', 'recipe-creamy-chicken-pasta', 'Brown the chicken in the sun-dried tomato oil with the salt and pepper. Set it aside.', 0),
  ('creamy-chicken-step-2', 'recipe-creamy-chicken-pasta', 'Cook the onion and garlic, then the sun-dried tomatoes and tomato paste.', 1),
  ('creamy-chicken-step-3', 'recipe-creamy-chicken-pasta', 'Add the broth, pasta, and Italian seasoning. Simmer until the pasta is done.', 2),
  ('creamy-chicken-step-4', 'recipe-creamy-chicken-pasta', 'Stir in the cream, spinach, Parmesan, and chicken.', 3);

COMMIT;
