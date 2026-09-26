BEGIN;

UPDATE "admin"."GroceryItem"
SET
  "name" = 'Bad Reichenhaller AlpenJodSalz',
  "gramsPerCount" = 500,
  "weightBasis" = 'One Bad Reichenhaller AlpenJodSalz package: 500 g',
  "nutritionPer100g" = jsonb_set(COALESCE("nutritionPer100g", '{}'::jsonb), '{iodineMcg}', '2000'::jsonb),
  "nutritionSource" = 'Bad Reichenhaller AlpenJodSalz nutrition declaration: 100 g salt; iodine 2,000 µg per 100 g.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'salt';

COMMIT;
