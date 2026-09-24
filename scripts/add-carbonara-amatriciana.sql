BEGIN;

WITH added AS (
  INSERT INTO "admin"."Recipe"
    ("id", "slug", "title", "summary", "servings", "tags", "notes", "updatedAt")
  VALUES
    ('recipe-carbonara', 'carbonara', 'Carbonara',
     'Spaghetti with egg yolks, pecorino, guanciale, and pepper.',
     2, ARRAY['dinner', 'pasta'], 'Preparation and cooking times have not been specified.', CURRENT_TIMESTAMP),
    ('recipe-amatriciana', 'amatriciana', 'Amatriciana',
     'Guanciale, puréed tomato, chili pepper, white wine, and pecorino.',
     2, ARRAY['dinner', 'pasta'], 'Ingredients as supplied; pasta quantity and preparation and cooking times have not been specified.', CURRENT_TIMESTAMP)
  ON CONFLICT ("slug") DO NOTHING
  RETURNING "id"
)
INSERT INTO "admin"."RecipeIngredient"
  ("id", "recipeId", "amount", "unit", "name", "quantity", "sortOrder")
SELECT ingredient.id, ingredient.recipe_id, ingredient.amount, ingredient.unit,
       ingredient.name, ingredient.quantity, ingredient.sort_order
FROM (VALUES
  ('carbonara-spaghetti', 'recipe-carbonara', '200', 'g', 'spaghetti', 200::DECIMAL, 0),
  ('carbonara-yolks', 'recipe-carbonara', '4', '', 'egg yolks', 4::DECIMAL, 1),
  ('carbonara-pecorino', 'recipe-carbonara', '100', 'g', 'pecorino', 100::DECIMAL, 2),
  ('carbonara-guanciale', 'recipe-carbonara', '80', 'g', 'guanciale', 80::DECIMAL, 3),
  ('carbonara-pepper', 'recipe-carbonara', '', '', 'pepper', NULL::DECIMAL, 4),
  ('amatriciana-chili', 'recipe-amatriciana', '1', '', 'chili pepper', 1::DECIMAL, 0),
  ('amatriciana-wine', 'recipe-amatriciana', '150', 'ml', 'white wine', 150::DECIMAL, 1),
  ('amatriciana-tomato', 'recipe-amatriciana', '1', 'can', 'puréed tomato', 1::DECIMAL, 2),
  ('amatriciana-guanciale', 'recipe-amatriciana', '80', 'g', 'guanciale', 80::DECIMAL, 3),
  ('amatriciana-pecorino', 'recipe-amatriciana', '150', 'g', 'pecorino', 150::DECIMAL, 4)
) AS ingredient(id, recipe_id, amount, unit, name, quantity, sort_order)
JOIN added ON added."id" = ingredient.recipe_id;

COMMIT;
