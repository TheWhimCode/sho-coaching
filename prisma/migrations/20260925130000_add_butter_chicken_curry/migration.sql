BEGIN;

INSERT INTO "admin"."GroceryItem" ("id", "name", "category", "createdAt", "updatedAt") VALUES
  ('grocery-butter-chicken-breast', 'chicken breast', 'refrigerated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-garam-masala', 'garam masala', 'spices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-vegetable-oil', 'vegetable oil', 'pantry', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-yellow-onion', 'yellow onion', 'produce', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-ginger', 'ginger', 'produce', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-paprika', 'paprika', 'spices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-cumin', 'ground cumin', 'spices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-turmeric', 'turmeric powder', 'spices', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-tomatoes', 'crushed tomatoes', 'pantry', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-water', 'water', 'pantry', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-heavy-cream', 'heavy cream', 'refrigerated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-butter-chicken-unsalted-butter', 'unsalted butter', 'refrigerated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "admin"."Recipe" ("id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "notes", "createdAt", "updatedAt") VALUES
  ('recipe-butter-chicken-curry', 'butter-chicken-curry', 'Butter Chicken Curry', 'Butter chicken curry with Greek yogurt and chicken breast.', 4, 20, 25, ARRAY['dinner', 'curry'], '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-yogurt', r."id", g."id", 150, 150, '150', 'g', 'Greek yogurt', '', false, 0 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'Greek yogurt';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-garam-masala-marinade', r."id", g."id", 15, 15, '15', 'g', 'garam masala', 'for marinade', false, 1 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'garam masala';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-breast', r."id", g."id", 680, 680, '680', 'g', 'chicken breast', 'cut into pieces', false, 2 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'chicken breast';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-oil', r."id", g."id", 60, 60, '60', 'g', 'vegetable oil', '', false, 3 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'vegetable oil';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-onion', r."id", g."id", 150, 150, '150', 'g', 'yellow onion', 'diced', false, 4 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'yellow onion';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-ginger', r."id", g."id", 15, 15, '15', 'g', 'ginger', 'finely diced', false, 5 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'ginger';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-garlic', r."id", g."id", 18, 18, '18', 'g', 'garlic', 'sliced', false, 6 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'garlic';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-pepper', r."id", g."id", 1, 1, '1', 'g', 'black pepper', '', false, 7 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'black pepper';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-paprika', r."id", g."id", 8, 8, '8', 'g', 'paprika', '', false, 8 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'paprika';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-cumin', r."id", g."id", 9, 9, '9', 'g', 'ground cumin', '', false, 9 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'ground cumin';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-garam-masala-curry', r."id", g."id", 14, 14, '14', 'g', 'garam masala', 'for curry', false, 10 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'garam masala';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-turmeric', r."id", g."id", 6, 6, '6', 'g', 'turmeric powder', '', true, 11 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'turmeric powder';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-tomatoes', r."id", g."id", 397, 397, '397', 'g', 'crushed tomatoes', '', false, 12 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'crushed tomatoes';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-water', r."id", g."id", 160, 160, '160', 'g', 'water', '', false, 13 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'water';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-cream', r."id", g."id", 240, 240, '240', 'g', 'heavy cream', '', false, 14 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'heavy cream';
INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "amount", "unit", "name", "note", "optional", "sortOrder")
SELECT 'butter-chicken-butter', r."id", g."id", 28, 28, '28', 'g', 'unsalted butter', '', false, 15 FROM "admin"."Recipe" r CROSS JOIN "admin"."GroceryItem" g WHERE r."slug" = 'butter-chicken-curry' AND g."name" = 'unsalted butter';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder") VALUES
  ('butter-chicken-step-1', 'recipe-butter-chicken-curry', 'Mix the yogurt, 15 g garam masala, and chicken. Marinate for 20 minutes.', 0),
  ('butter-chicken-step-2', 'recipe-butter-chicken-curry', 'Brown the chicken in half the oil and set aside.', 1),
  ('butter-chicken-step-3', 'recipe-butter-chicken-curry', 'Cook the onion, ginger, and garlic in the remaining oil. Stir in the spices.', 2),
  ('butter-chicken-step-4', 'recipe-butter-chicken-curry', 'Add tomatoes, water, cream, butter, and chicken. Simmer until cooked through.', 3);

COMMIT;
