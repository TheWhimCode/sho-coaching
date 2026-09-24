BEGIN;
CREATE TABLE "admin"."RecipeCook" (
 "id" TEXT PRIMARY KEY, "recipeId" TEXT NOT NULL REFERENCES "admin"."Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "servings" DOUBLE PRECISION NOT NULL CHECK ("servings" > 0), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "admin"."GroceryTransaction" ADD COLUMN "recipeCookId" TEXT REFERENCES "admin"."RecipeCook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin"."RecipeIngredient"
  ADD COLUMN "weightGrams" DECIMAL(12,3),
  ADD COLUMN "count" DECIMAL(12,6),
  ADD COLUMN "gramsPerCount" DECIMAL(12,3);
ALTER TABLE "admin"."GroceryItem"
  ADD COLUMN "gramsPerCount" DECIMAL(12,3),
  ADD COLUMN "weightBasis" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "nutritionPer100g" JSONB,
  ADD COLUMN "nutritionSource" TEXT NOT NULL DEFAULT '';
ALTER TABLE "admin"."GroceryLot"
  ADD COLUMN "purchasedCount" DECIMAL(12,6),
  ADD COLUMN "remainingCount" DECIMAL(12,6);

-- Preserve the original display strings. Only unambiguous quantities are migrated.
UPDATE "admin"."RecipeIngredient" SET "weightGrams" = "amount"::numeric
WHERE "unit" = 'g' AND "amount" ~ '^[0-9]+(\.[0-9]+)?$';
UPDATE "admin"."RecipeIngredient" SET "count" = "amount"::numeric
WHERE "unit" IN ('', 'cloves', 'can') AND "amount" ~ '^[0-9]+(\.[0-9]+)?$';
UPDATE "admin"."RecipeIngredient" SET "count" = 0.5 WHERE "amount" = 'half a tub';
UPDATE "admin"."RecipeIngredient" SET "count" = 1.0/3 WHERE "amount" = '1/3' AND "unit" = '';
UPDATE "admin"."RecipeIngredient" SET "count" = 1.5 WHERE "amount" = '1 1/2' AND "unit" = '';
UPDATE "admin"."GroceryLot" SET "purchasedCount" = split_part("purchasedAmount", ' ', 1)::numeric
WHERE "purchasedAmount" ~ '^[0-9]+(\.[0-9]+)?( (cucumber|bag|tub))?$';
UPDATE "admin"."GroceryLot" SET "remainingCount" = split_part("remainingAmount", ' ', 1)::numeric
WHERE "remainingAmount" ~ '^[0-9]+(\.[0-9]+)?( (cucumber|bag|tub))?$';

-- Product definitions are not stock: this creates no purchased inventory.
INSERT INTO "admin"."GroceryItem" ("id", "name", "category", "gramsPerCount", "weightBasis", "createdAt", "updatedAt")
VALUES ('grocery-garlic', 'garlic', 'produce', 3, 'Estimated edible clove: 3 g (Canadian Nutrient File, food 2394)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET "gramsPerCount" = COALESCE("admin"."GroceryItem"."gramsPerCount", 3);
UPDATE "admin"."RecipeIngredient" r SET "groceryItemId" = g."id"
FROM "admin"."GroceryItem" g WHERE lower(r."name") = lower(g."name") AND r."groceryItemId" IS NULL;
UPDATE "admin"."GroceryItem" SET "gramsPerCount" = 250, "weightBasis" = 'One purchased tub: 250 g' WHERE "id" = 'grocery-hummus';
UPDATE "admin"."GroceryItem" SET "gramsPerCount" = 200, "weightBasis" = 'One purchased bag: 200 g' WHERE "id" = 'grocery-tortilla-chips';

-- Estimated edible weights for existing count-based recipes. No inventory added.
INSERT INTO "admin"."GroceryItem" ("id", "name", "category", "gramsPerCount", "weightBasis", "createdAt", "updatedAt")
SELECT 'grocery-measure-' || md5(v.name), v.name, '', v.grams, v.basis, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('banana', 118, 'Estimated medium peeled banana: 118 g'),
  ('bananas', 118, 'Estimated medium peeled banana: 118 g'),
  ('egg yolks', 17, 'Estimated large egg yolk: 17 g'),
  ('pecan nuts', 3, 'Estimated whole pecan kernel (two halves): 3 g'),
  ('chili pepper', 20, 'Estimated edible chili: 20 g'),
  ('puréed tomato', 400, 'Assumed can net weight: 400 g'),
  ('mascarpone', 250, 'One tub: 250 g'),
  ('spinach', 50, 'One standard packet: 50 g (user-defined)'),
  ('cucumber', 300, 'Estimated whole cucumber: 300 g; replace with measured weight when known')
) v(name, grams, basis)
ON CONFLICT ("name") DO UPDATE SET
  "gramsPerCount" = COALESCE("admin"."GroceryItem"."gramsPerCount", EXCLUDED."gramsPerCount"),
  "weightBasis" = CASE WHEN "admin"."GroceryItem"."gramsPerCount" IS NULL THEN EXCLUDED."weightBasis" ELSE "admin"."GroceryItem"."weightBasis" END;
UPDATE "admin"."RecipeIngredient" r SET "groceryItemId" = g."id"
FROM "admin"."GroceryItem" g WHERE lower(r."name") = lower(g."name") AND r."groceryItemId" IS NULL;
-- Replace the old cup display with the user's chosen 125 g / half of a 250 g tub.
UPDATE "admin"."RecipeIngredient" SET "weightGrams" = 125, "count" = 0.5, "amount" = '125', "unit" = 'g'
WHERE "name" = 'mascarpone' AND "amount" = '1/2' AND "unit" = 'cup';
-- Approximate these existing water-based liquids as 1 g/ml; retain the assumption.
UPDATE "admin"."RecipeIngredient" SET "weightGrams" = "amount"::numeric, "unit" = 'g',
  "note" = concat_ws('; ', NULLIF("note", ''), 'Weight estimated from original ' || "amount" || ' ml at 1 g/ml')
WHERE "name" IN ('white wine', 'almond milk') AND "unit" = 'ml' AND "amount" ~ '^[0-9]+(\.[0-9]+)?$';
UPDATE "admin"."GroceryLot" l SET
 "purchasedWeightGrams" = COALESCE(l."purchasedWeightGrams", l."purchasedCount" * g."gramsPerCount"),
 "remainingWeightGrams" = COALESCE(l."remainingWeightGrams", l."remainingCount" * g."gramsPerCount")
FROM "admin"."GroceryItem" g WHERE l."groceryItemId" = g."id" AND g."gramsPerCount" IS NOT NULL;

-- Every ingredient can reference a product definition, even when not yet in stock.
INSERT INTO "admin"."GroceryItem" ("id", "name", "category", "createdAt", "updatedAt")
SELECT 'grocery-recipe-' || md5("name"), "name", '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "admin"."RecipeIngredient" GROUP BY "name"
ON CONFLICT ("name") DO NOTHING;
UPDATE "admin"."RecipeIngredient" r SET "groceryItemId" = g."id"
FROM "admin"."GroceryItem" g WHERE r."name" = g."name" AND r."groceryItemId" IS NULL;
-- 180 g additional dry pasta, using the same Barilla estimate as the saved recipe.
UPDATE "admin"."RecipeNutrition" n SET
 "calories" = n."calories" + 646.2 / r."servings",
 "proteinGrams" = n."proteinGrams" + 23.04 / r."servings",
 "carbsGrams" = n."carbsGrams" + 127.62 / r."servings",
 "fatGrams" = n."fatGrams" + 3.6 / r."servings",
 "fibreGrams" = n."fibreGrams" + 5.4 / r."servings",
 "saturatedFatGrams" = n."saturatedFatGrams" + 0.9 / r."servings",
 "sugarGrams" = n."sugarGrams" + 6.3 / r."servings",
 "basis" = replace(n."basis", '20 g dry pasta', '200 g dry pasta'), "updatedAt" = CURRENT_TIMESTAMP
FROM "admin"."Recipe" r WHERE n."recipeId" = r."id" AND r."slug" = 'amatriciana' AND r."servings" > 0;
UPDATE "admin"."RecipeIngredient" SET "amount" = '200', "quantity" = 200, "weightGrams" = 200
WHERE "id" = 'amatriciana-pasta';
UPDATE "admin"."Recipe" r SET "calories" = ROUND(n."calories")::integer,
 "proteinGrams" = n."proteinGrams", "carbsGrams" = n."carbsGrams", "fatGrams" = n."fatGrams", "updatedAt" = CURRENT_TIMESTAMP
FROM "admin"."RecipeNutrition" n WHERE n."recipeId" = r."id" AND r."slug" = 'amatriciana';

ALTER TABLE "admin"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_positive_measurements"
 CHECK (("weightGrams" IS NULL OR "weightGrams" >= 0) AND ("count" IS NULL OR "count" >= 0) AND ("gramsPerCount" IS NULL OR "gramsPerCount" > 0));
ALTER TABLE "admin"."GroceryItem" ADD CONSTRAINT "GroceryItem_positive_conversion" CHECK ("gramsPerCount" IS NULL OR "gramsPerCount" > 0);
ALTER TABLE "admin"."GroceryLot" ADD CONSTRAINT "GroceryLot_positive_counts" CHECK (("purchasedCount" IS NULL OR "purchasedCount" >= 0) AND ("remainingCount" IS NULL OR "remainingCount" >= 0));
COMMIT;
