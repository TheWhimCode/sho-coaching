BEGIN;

-- Water is used only as needed to rinse the tomato can, so it does not belong
-- in the measured ingredient list.
DELETE FROM "admin"."RecipeIngredient"
WHERE "id" = 'butter-chicken-water'
  AND "recipeId" = 'recipe-butter-chicken-curry';

DELETE FROM "admin"."GroceryItem"
WHERE "id" = 'grocery-butter-chicken-water'
  AND NOT EXISTS (SELECT 1 FROM "admin"."RecipeIngredient" r WHERE r."groceryItemId" = 'grocery-butter-chicken-water');

DELETE FROM "admin"."RecipeStep"
WHERE "recipeId" = 'recipe-butter-chicken-curry';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder") VALUES
  ('butter-chicken-step-1', 'recipe-butter-chicken-curry', 'Heat 2 tbsp oil over medium-high heat. Sear the marinated chicken in batches until browned, then set aside.', 0),
  ('butter-chicken-step-2', 'recipe-butter-chicken-curry', 'Add the remaining 2 tbsp oil. Cook the onion, ginger, garlic, and pepper for about 3 minutes, scraping up the browned bits; add a splash of water if needed.', 1),
  ('butter-chicken-step-3', 'recipe-butter-chicken-curry', 'Stir in the paprika, cumin, garam masala, and optional turmeric. Toast for 1 minute.', 2),
  ('butter-chicken-step-4', 'recipe-butter-chicken-curry', 'Add the crushed tomatoes. Rinse the empty can with water and add it to the pan. Simmer for 5–8 minutes until thickened.', 3),
  ('butter-chicken-step-5', 'recipe-butter-chicken-curry', 'Blend the sauce if you want it smooth.', 4),
  ('butter-chicken-step-6', 'recipe-butter-chicken-curry', 'Return the chicken and simmer for 3–5 minutes until cooked through.', 5),
  ('butter-chicken-step-7', 'recipe-butter-chicken-curry', 'Stir in the cream and simmer for 3–4 minutes.', 6),
  ('butter-chicken-step-8', 'recipe-butter-chicken-curry', 'Take off the heat and stir in the butter until melted. Serve with rice.', 7);

COMMIT;
