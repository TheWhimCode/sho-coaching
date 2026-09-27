-- A pantry-friendly carrot and red lentil soup. Recipe weights are all in grams;
-- spices, oil, salt, and pepper remain always-available pantry staples.
INSERT INTO "admin"."GroceryItem" (
  "id", "name", "category", "gramsPerCount", "unitsPerPurchase", "weightBasis",
  "nutritionPer100g", "nutritionSource", "pantryStaple", "excludeFromNutrition", "createdAt", "updatedAt"
) VALUES
  ('grocery-soup-onion', 'onion', 'produce', 150, NULL, 'One medium onion: approximately 150 g',
    '{"calories":40,"proteinGrams":1.1,"fatGrams":0.1,"carbsGrams":9.34,"fibreGrams":1.7,"sugarGrams":4.24,"sodiumMg":4,"potassiumMg":146,"calciumMg":23,"magnesiumMg":10,"ironMg":0.21,"zincMg":0.17,"folateMcg":19}'::jsonb,
    'USDA FoodData Central: onion, raw; per 100 g', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-soup-carrots', 'carrots', 'produce', NULL, NULL, '',
    '{"calories":41,"proteinGrams":0.93,"fatGrams":0.24,"carbsGrams":9.58,"fibreGrams":2.8,"sugarGrams":4.74,"sodiumMg":69,"potassiumMg":320,"calciumMg":33,"magnesiumMg":12,"ironMg":0.3,"zincMg":0.24,"folateMcg":19}'::jsonb,
    'USDA FoodData Central: carrots, raw; per 100 g', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-soup-red-lentils', 'red lentils', 'legumes', 500, 1, 'One bag: 500 g',
    '{"calories":352,"proteinGrams":25.8,"fatGrams":1.1,"carbsGrams":60.1,"fibreGrams":10.8,"sugarGrams":2,"sodiumMg":6,"potassiumMg":677,"calciumMg":56,"magnesiumMg":122,"ironMg":6.5,"zincMg":3.3,"folateMcg":479}'::jsonb,
    'USDA FoodData Central: lentils, mature seeds, raw; per 100 g', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-soup-vegetable-broth', 'vegetable broth', 'pantry', 1000, 1, 'One carton: 1 l / approximately 1000 g',
    '{"calories":5,"proteinGrams":0.3,"fatGrams":0.1,"carbsGrams":0.8,"fibreGrams":0,"sugarGrams":0.4,"sodiumMg":300,"potassiumMg":30,"calciumMg":5,"magnesiumMg":3,"ironMg":0.1,"zincMg":0.05,"folateMcg":2}'::jsonb,
    'Generic ready-to-serve vegetable broth estimate; refine from the carton label.', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-soup-smoked-paprika', 'smoked paprika', 'spices', NULL, NULL, '', NULL,
    'Dry spice. Excluded from nutrition and from the grocery list.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-soup-black-pepper', 'black pepper', 'spices', NULL, NULL, '', NULL,
    'Dry spice. Excluded from nutrition and from the grocery list.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "admin"."Recipe" (
  "id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "methodText", "notes", "createdAt", "updatedAt"
) VALUES (
  'recipe-spiced-red-lentil-carrot-soup', 'spiced-red-lentil-carrot-soup', 'Spiced Red Lentil Carrot Soup',
  'A creamy carrot and red lentil soup with almond milk, smoked paprika, and warm spices.',
  4, 15, 30, ARRAY['soup'],
  'Heat the olive oil in a large pot over medium heat. Add the onion and cook until soft, about 5 minutes. Add the garlic, chili flakes, smoked paprika, ground turmeric, and ground cumin; stir for 30 seconds. Add the carrots, red lentils, and vegetable broth. Bring to a boil, then reduce to a gentle simmer and cook until the carrots and lentils are tender, about 20 to 25 minutes. Blend until smooth, stir in the almond milk, and warm through without boiling. Season with salt and black pepper to taste.',
  'Chili flakes replace the original chili powder; start with 1 tsp and adjust to taste. The supplied 500 g bag of red lentils is tracked as stock; the recipe uses 270 g.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "admin"."RecipeIngredient" (
  "id", "recipeId", "groceryItemId", "quantity", "weightGrams", "count", "gramsPerCount", "amount", "unit", "name", "note", "optional", "pantryStaple", "sortOrder"
)
SELECT item.id, recipe."id", grocery."id", item.quantity, item.weight_grams, item.count, item.grams_per_count,
       item.amount, item.unit, item.name, item.note, false, item.pantry_staple, item.sort_order
FROM "admin"."Recipe" recipe
JOIN (VALUES
  ('soup-onion', 'onion', 150::numeric, 150::numeric, 1::numeric, 150::numeric, '1', 'medium', 'onion', 'finely chopped', false, 0),
  ('soup-carrots', 'carrots', 500::numeric, 500::numeric, NULL::numeric, NULL::numeric, '500', 'g', 'carrots', 'peeled and chopped', false, 1),
  ('soup-garlic', 'garlic', 45::numeric, 45::numeric, 15::numeric, 3::numeric, '15', 'cloves', 'garlic', 'minced', false, 2),
  ('soup-olive-oil', 'olive oil', 15::numeric, 15::numeric, NULL::numeric, NULL::numeric, '1', 'tbsp', 'olive oil', '', true, 3),
  ('soup-chili-flakes', 'chili flakes', NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, '1', 'tsp', 'chili flakes', 'adjust to taste', true, 4),
  ('soup-smoked-paprika', 'smoked paprika', NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, '1/2', 'tsp', 'smoked paprika', '', true, 5),
  ('soup-turmeric', 'ground turmeric', NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, '1/2', 'tsp', 'ground turmeric', '', true, 6),
  ('soup-cumin', 'ground cumin', NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, '1/2', 'tsp', 'ground cumin', '', true, 7),
  ('soup-pepper', 'black pepper', NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, '1/2', 'tsp', 'black pepper', '', true, 8),
  ('soup-lentils', 'red lentils', 270::numeric, 270::numeric, NULL::numeric, NULL::numeric, '270', 'g', 'red lentils', 'rinsed', false, 9),
  ('soup-broth', 'vegetable broth', 1100::numeric, 1100::numeric, NULL::numeric, NULL::numeric, '1100', 'g', 'vegetable broth', '', false, 10),
  ('soup-almond-milk', 'almond milk', 240::numeric, 240::numeric, NULL::numeric, NULL::numeric, '240', 'g', 'almond milk', 'unsweetened', false, 11),
  ('soup-salt', 'salt', NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, '', '', 'salt', 'to taste', true, 12)
) AS item(id, grocery_name, quantity, weight_grams, count, grams_per_count, amount, unit, name, note, pantry_staple, sort_order)
  ON true
JOIN "admin"."GroceryItem" grocery ON grocery."name" = item.grocery_name
WHERE recipe."slug" = 'spiced-red-lentil-carrot-soup'
ON CONFLICT ("id") DO NOTHING;

-- Stock explicitly supplied for this recipe: one bag of lentils and 15 cloves of garlic.
INSERT INTO "admin"."GroceryLot" (
  "id", "groceryItemId", "purchasedAmount", "remainingAmount", "purchasedCount", "remainingCount",
  "purchasedWeightGrams", "remainingWeightGrams", "purchasedAt", "createdAt", "updatedAt"
)
SELECT 'lot-soup-red-lentils-500g', grocery."id", '500 g', '500 g', 1, 1, 500, 500,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" grocery WHERE grocery."name" = 'red lentils'
UNION ALL
SELECT 'lot-soup-garlic-15-cloves', grocery."id", '15 cloves', '15 cloves', 15, 15, 45, 45,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."GroceryItem" grocery WHERE grocery."name" = 'garlic'
ON CONFLICT ("id") DO NOTHING;
