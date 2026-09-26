INSERT INTO "admin"."Recipe" (
  "id", "slug", "title", "familyKey", "familyTitle", "variantLabel", "summary",
  "servings", "prepMinutes", "cookMinutes", "tags", "notes", "referenceImage",
  "calories", "proteinGrams", "carbsGrams", "fatGrams", "createdAt", "updatedAt"
) VALUES (
  'recipe-big-smoothie', 'big-smoothie', 'Big smoothie', 'smoothie', 'Smoothie', 'Big',
  'A large Greek-yogurt fruit smoothie with pecans and cacao nibs.',
  NULL, 5, 0, ARRAY['breakfast', 'smoothie'], 
  'Fruit handfuls are standardized to 80 g mango and 60 g raspberries. Nutrition assumes plain 2% Greek yogurt and unsweetened almond milk.',
  '', 766, 52, 82.3, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "familyKey" = EXCLUDED."familyKey",
  "familyTitle" = EXCLUDED."familyTitle",
  "variantLabel" = EXCLUDED."variantLabel",
  "summary" = EXCLUDED."summary",
  "servings" = EXCLUDED."servings",
  "prepMinutes" = EXCLUDED."prepMinutes",
  "cookMinutes" = EXCLUDED."cookMinutes",
  "tags" = EXCLUDED."tags",
  "notes" = EXCLUDED."notes",
  "calories" = EXCLUDED."calories",
  "proteinGrams" = EXCLUDED."proteinGrams",
  "carbsGrams" = EXCLUDED."carbsGrams",
  "fatGrams" = EXCLUDED."fatGrams",
  "updatedAt" = CURRENT_TIMESTAMP;

DELETE FROM "admin"."RecipeIngredient"
WHERE "recipeId" = (SELECT "id" FROM "admin"."Recipe" WHERE "slug" = 'big-smoothie');

INSERT INTO "admin"."RecipeIngredient" (
  "id", "recipeId", "amount", "unit", "name", "note", "optional", "sortOrder"
)
SELECT ingredient."id", recipe."id", ingredient."amount", ingredient."unit", ingredient."name", ingredient."note", false, ingredient."sortOrder"
FROM "admin"."Recipe" AS recipe
CROSS JOIN (VALUES
  ('big-smoothie-yogurt', '450', 'g', 'Greek yogurt', 'plain 2%', 0),
  ('big-smoothie-banana', '1 1/2', '', 'bananas', '', 1),
  ('big-smoothie-mango', '80', 'g', 'mango', 'about one handful', 2),
  ('big-smoothie-raspberries', '60', 'g', 'raspberries', 'about one handful', 3),
  ('big-smoothie-pecans', '8', '', 'pecan nuts', 'about 24 g', 4),
  ('big-smoothie-cacao', '3', 'g', 'cacao nibs', 'about 15–20 nibs', 5),
  ('big-smoothie-almond-milk', '100', 'ml', 'almond milk', 'unsweetened', 6)
) AS ingredient("id", "amount", "unit", "name", "note", "sortOrder")
WHERE recipe."slug" = 'big-smoothie';

DELETE FROM "admin"."RecipeStep"
WHERE "recipeId" = (SELECT "id" FROM "admin"."Recipe" WHERE "slug" = 'big-smoothie');

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder")
SELECT 'big-smoothie-step-1', "id", 'Add everything to a blender and blend until smooth.', 0
FROM "admin"."Recipe"
WHERE "slug" = 'big-smoothie';

INSERT INTO "admin"."RecipeNutrition" (
  "id", "recipeId", "calories", "proteinGrams", "carbsGrams", "fatGrams",
  "fibreGrams", "saturatedFatGrams", "sugarGrams", "sodiumMg", "potassiumMg",
  "calciumMg", "magnesiumMg", "ironMg", "zincMg", "vitaminDMcg",
  "vitaminB12McG", "folateMcg", "omega3AlAGrams", "basis", "updatedAt"
)
SELECT
  'nutrition-big-smoothie', "id", 766, 52, 82.3, 30,
  13, 8.1, 52.3, 242, 1627,
  670, 157, 2.5, 3.7, 1,
  2.7, 109, 0.3,
  'estimated per serving; assumes 450 g plain 2% Greek yogurt, unsweetened fortified almond milk, 80 g mango, 60 g raspberries, 24 g pecans, and 3 g cacao nibs',
  CURRENT_TIMESTAMP
FROM "admin"."Recipe"
WHERE "slug" = 'big-smoothie'
ON CONFLICT ("recipeId") DO UPDATE SET
  "calories" = EXCLUDED."calories",
  "proteinGrams" = EXCLUDED."proteinGrams",
  "carbsGrams" = EXCLUDED."carbsGrams",
  "fatGrams" = EXCLUDED."fatGrams",
  "fibreGrams" = EXCLUDED."fibreGrams",
  "saturatedFatGrams" = EXCLUDED."saturatedFatGrams",
  "sugarGrams" = EXCLUDED."sugarGrams",
  "sodiumMg" = EXCLUDED."sodiumMg",
  "potassiumMg" = EXCLUDED."potassiumMg",
  "calciumMg" = EXCLUDED."calciumMg",
  "magnesiumMg" = EXCLUDED."magnesiumMg",
  "ironMg" = EXCLUDED."ironMg",
  "zincMg" = EXCLUDED."zincMg",
  "vitaminDMcg" = EXCLUDED."vitaminDMcg",
  "vitaminB12McG" = EXCLUDED."vitaminB12McG",
  "folateMcg" = EXCLUDED."folateMcg",
  "omega3AlAGrams" = EXCLUDED."omega3AlAGrams",
  "basis" = EXCLUDED."basis",
  "updatedAt" = CURRENT_TIMESTAMP;
