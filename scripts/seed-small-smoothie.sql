INSERT INTO "admin"."Recipe" (
  "id", "slug", "title", "familyKey", "familyTitle", "variantLabel", "summary",
  "servings", "prepMinutes", "cookMinutes", "tags", "notes", "referenceImage",
  "calories", "proteinGrams", "carbsGrams", "fatGrams", "createdAt", "updatedAt"
) VALUES (
  'recipe-small-smoothie', 'small-smoothie', 'Small smoothie', 'smoothie', 'Smoothie', 'Small',
  'A smaller Greek-yogurt fruit smoothie with pecans and cacao nibs.',
  NULL, 5, 0, ARRAY['breakfast', 'smoothie'],
  'Nutrition assumes plain 2% Greek yogurt and unsweetened almond milk.',
  '', 544, 37.4, 58, 21.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
WHERE "recipeId" = (SELECT "id" FROM "admin"."Recipe" WHERE "slug" = 'small-smoothie');

INSERT INTO "admin"."RecipeIngredient" (
  "id", "recipeId", "amount", "unit", "name", "note", "optional", "sortOrder"
)
SELECT ingredient."id", recipe."id", ingredient."amount", ingredient."unit", ingredient."name", ingredient."note", false, ingredient."sortOrder"
FROM "admin"."Recipe" AS recipe
CROSS JOIN (VALUES
  ('small-smoothie-yogurt', '300', 'g', 'Greek yogurt', 'plain 2%', 0),
  ('small-smoothie-banana', '1', '', 'banana', '', 1),
  ('small-smoothie-mango', '60', 'g', 'mango', '', 2),
  ('small-smoothie-raspberries', '40', 'g', 'raspberries', '', 3),
  ('small-smoothie-pecans', '6', '', 'pecan nuts', '', 4),
  ('small-smoothie-cacao', '2', 'g', 'cacao nibs', '', 5),
  ('small-smoothie-almond-milk', '60', 'ml', 'almond milk', 'unsweetened', 6)
) AS ingredient("id", "amount", "unit", "name", "note", "sortOrder")
WHERE recipe."slug" = 'small-smoothie';

DELETE FROM "admin"."RecipeStep"
WHERE "recipeId" = (SELECT "id" FROM "admin"."Recipe" WHERE "slug" = 'small-smoothie');

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder")
SELECT 'small-smoothie-step-1', "id", 'Add everything to a blender and blend until smooth.', 0
FROM "admin"."Recipe"
WHERE "slug" = 'small-smoothie';

INSERT INTO "admin"."RecipeNutrition" (
  "id", "recipeId", "calories", "proteinGrams", "carbsGrams", "fatGrams",
  "fibreGrams", "saturatedFatGrams", "sugarGrams", "sodiumMg", "potassiumMg",
  "calciumMg", "magnesiumMg", "ironMg", "zincMg", "vitaminDMcg",
  "vitaminB12McG", "folateMcg", "omega3AlAGrams", "basis", "updatedAt"
)
SELECT
  'nutrition-small-smoothie', "id", 544, 37.4, 58, 21.2,
  9.1, 5.8, 37, 173, 1153,
  480, 111, 1.8, 2.7, 0.7,
  2, 77, 0.2,
  'estimated per serving; assumes 300 g plain 2% Greek yogurt and the listed ingredients',
  CURRENT_TIMESTAMP
FROM "admin"."Recipe"
WHERE "slug" = 'small-smoothie'
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
