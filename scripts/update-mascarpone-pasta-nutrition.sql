UPDATE "admin"."Recipe"
SET
  "calories" = 1310,
  "proteinGrams" = 34,
  "carbsGrams" = 158,
  "fatGrams" = 66,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'mascarpone-pasta';

INSERT INTO "admin"."RecipeNutrition" (
  "id",
  "recipeId",
  "calories",
  "proteinGrams",
  "carbsGrams",
  "fatGrams",
  "fibreGrams",
  "saturatedFatGrams",
  "sugarGrams",
  "potassiumMg",
  "calciumMg",
  "magnesiumMg",
  "ironMg",
  "zincMg",
  "vitaminB12McG",
  "folateMcg",
  "basis",
  "updatedAt"
)
SELECT
  'nutrition-mascarpone-pasta',
  "id",
  1310,
  34,
  158,
  66,
  7.5,
  30,
  7,
  850,
  220,
  155,
  5.5,
  3.5,
  0.5,
  200,
  'estimated per serving; excludes optional Parmesan and sunflower seeds; sodium and iodine excluded because salt quantity and type are unspecified',
  CURRENT_TIMESTAMP
FROM "admin"."Recipe"
WHERE "slug" = 'mascarpone-pasta'
ON CONFLICT ("recipeId") DO UPDATE SET
  "calories" = EXCLUDED."calories",
  "proteinGrams" = EXCLUDED."proteinGrams",
  "carbsGrams" = EXCLUDED."carbsGrams",
  "fatGrams" = EXCLUDED."fatGrams",
  "fibreGrams" = EXCLUDED."fibreGrams",
  "saturatedFatGrams" = EXCLUDED."saturatedFatGrams",
  "sugarGrams" = EXCLUDED."sugarGrams",
  "potassiumMg" = EXCLUDED."potassiumMg",
  "calciumMg" = EXCLUDED."calciumMg",
  "magnesiumMg" = EXCLUDED."magnesiumMg",
  "ironMg" = EXCLUDED."ironMg",
  "zincMg" = EXCLUDED."zincMg",
  "vitaminB12McG" = EXCLUDED."vitaminB12McG",
  "folateMcg" = EXCLUDED."folateMcg",
  "basis" = EXCLUDED."basis",
  "updatedAt" = CURRENT_TIMESTAMP;
