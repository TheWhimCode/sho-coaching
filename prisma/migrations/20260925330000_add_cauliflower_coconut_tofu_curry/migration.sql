-- Grocery items are intentionally generic. A tofu block is counted as one
-- purchasable unit while retaining its 400 g equivalent for stock calculations.
INSERT INTO "admin"."GroceryItem"
  ("id", "name", "category", "gramsPerCount", "unitsPerPurchase", "weightBasis", "createdAt", "updatedAt")
VALUES
  ('grocery-curry-sunflower-oil', 'sunflower oil', 'pantry', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-ground-cumin', 'ground cumin', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-chili-flakes', 'chili flakes', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-turmeric', 'ground turmeric', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-paprika', 'paprika', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-cinnamon', 'ground cinnamon', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-nutmeg', 'ground nutmeg', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-curry-leaves', 'dried curry leaves', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-coconut-milk', 'full-fat coconut milk', 'pantry', 400, 1, 'One can: 400 ml / approximately 400 g', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-tomato-sauce', 'tomato sauce', 'pantry', 400, 1, 'One carton: 400 g', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-sugar', 'sugar', 'pantry', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-cauliflower', 'cauliflower', 'produce', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-salt', 'salt', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-tofu', 'tofu', 'refrigerated', 400, 1, 'One tofu block: 400 g', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-garam-masala', 'garam masala', 'spices', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-curry-rice', 'rice', 'grains', NULL, NULL, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "admin"."Recipe"
  ("id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "methodText", "notes", "createdAt", "updatedAt")
VALUES
  ('recipe-cauliflower-coconut-tofu-curry', 'cauliflower-coconut-tofu-curry', 'Cauliflower Coconut Tofu Curry',
   'A creamy cauliflower and tofu curry with coconut milk, tomato sauce, and spinach.', 4, 15, 30, ARRAY['curry'],
   'Heat the sunflower oil in a large pan over medium heat. Add the garlic and ginger; cook until fragrant. Stir in the ground cumin, chili flakes, turmeric, paprika, cinnamon, nutmeg, and optional curry leaves for 30 seconds. Add the coconut milk, tomato sauce, sugar, cauliflower, salt, and black pepper. Simmer, partially covered, until the cauliflower is tender, about 15 to 20 minutes. Add the tofu and garam masala and simmer until heated through. Fold in the spinach until wilted. Taste, adjust the salt and chili flakes, and finish with optional lemon juice. Serve with four cups of cooked rice.',
   'Ground cumin uses the standard substitution of 3/4 tsp for each 1 tsp cumin seeds, so 2 tsp seeds becomes 1 1/2 tsp ground cumin. Chili flakes replace the 1 to 3 serrano peppers at 1/2 to 1 1/2 tsp; begin at the low end and adjust to taste.',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Oils, salt, pepper, and dried spices are pantry staples and therefore do not block cooking availability.
INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "gramsPerCount", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder")
SELECT 'cauli-tofu-oil', r."id", g."id", 30, 30, NULL::numeric, NULL::numeric, '2', 'tbsp', 'sunflower oil', '', false, true, 0 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'sunflower oil' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-cumin', r."id", g."id", NULL, NULL, NULL, NULL, '1 1/2', 'tsp', 'ground cumin', 'replaces 2 tsp cumin seeds', false, true, 1 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'ground cumin' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-garlic', r."id", g."id", 18, 18, NULL, NULL, '6', 'cloves', 'garlic', 'minced', false, false, 2 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'garlic' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-ginger', r."id", g."id", 25, 25, NULL, NULL, '2', 'inch piece', 'ginger', 'minced or grated', false, false, 3 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'ginger' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-chili', r."id", g."id", NULL, NULL, NULL, NULL, '1/2 to 1 1/2', 'tsp', 'chili flakes', 'replaces 1 to 3 serrano peppers; adjust to taste', false, true, 4 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'chili flakes' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-turmeric', r."id", g."id", NULL, NULL, NULL, NULL, '1', 'tsp', 'ground turmeric', '', false, true, 5 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'ground turmeric' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-paprika', r."id", g."id", NULL, NULL, NULL, NULL, '1', 'tsp', 'paprika', 'sweet or hot', false, true, 6 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'paprika' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-cinnamon', r."id", g."id", NULL, NULL, NULL, NULL, '1/4', 'tsp', 'ground cinnamon', '', false, true, 7 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'ground cinnamon' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-nutmeg', r."id", g."id", NULL, NULL, NULL, NULL, '1/4', 'tsp', 'ground nutmeg', 'freshly grated or ground', false, true, 8 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'ground nutmeg' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-curry-leaves', r."id", g."id", NULL, NULL, NULL, NULL, '5 to 20', '', 'dried curry leaves', '', true, true, 9 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'dried curry leaves' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-coconut', r."id", g."id", 400, 400, NULL, NULL, '1', 'can (400 ml)', 'full-fat coconut milk', '', false, false, 10 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'full-fat coconut milk' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-tomato', r."id", g."id", 200, 200, NULL, NULL, '200', 'g', 'tomato sauce', '', false, false, 11 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'tomato sauce' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-sugar', r."id", g."id", 12.5, 12.5, NULL, NULL, '1', 'tbsp', 'sugar', '', false, true, 12 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'sugar' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-cauliflower', r."id", g."id", 475, 475, NULL, NULL, '1', 'small head', 'cauliflower', 'cut into small florets', false, false, 13 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'cauliflower' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-salt', r."id", g."id", 21, 21, NULL, NULL, '3 1/2', 'tsp', 'salt', '', false, true, 14 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'salt' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-pepper', r."id", NULL, NULL, NULL, NULL, NULL, '', '', 'black pepper', 'to taste', false, true, 15 FROM "admin"."Recipe" r WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-tofu', r."id", g."id", 400, 400, NULL, NULL, '1', 'tofu', 'tofu', '400 g block, previously frozen and defrosted', false, false, 16 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'tofu' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-garam', r."id", g."id", NULL, NULL, NULL, NULL, '2', 'tsp', 'garam masala', '', false, true, 17 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'garam masala' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-spinach', r."id", g."id", 50, 50, NULL, NULL, '50', 'g', 'spinach', 'chopped', false, false, 18 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'spinach' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-lemon', r."id", g."id", NULL, NULL, NULL, NULL, '1/2 to 1', 'tbsp', 'lemon juice', 'freshly squeezed', true, false, 19 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'lemon' WHERE r."slug" = 'cauliflower-coconut-tofu-curry'
UNION ALL SELECT 'cauli-tofu-rice', r."id", g."id", 640, 640, NULL, NULL, '4', 'cups', 'cooked rice', 'white or brown', false, false, 20 FROM "admin"."Recipe" r JOIN "admin"."GroceryItem" g ON g."name" = 'rice' WHERE r."slug" = 'cauliflower-coconut-tofu-curry';
