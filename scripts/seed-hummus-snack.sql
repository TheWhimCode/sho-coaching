INSERT INTO "admin"."Recipe" ("id", "slug", "title", "summary", "servings", "prepMinutes", "cookMinutes", "tags", "notes", "referenceImage", "createdAt", "updatedAt") VALUES
('recipe-hummus-snack', 'hummus-snack', 'Hummus snack plate', 'A quick hummus, cucumber, and tortilla-chip snack plate.', 1, 5, 0, ARRAY['snack', 'quick', 'vegetarian'], '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "admin"."RecipeIngredient" ("id", "recipeId", "groceryItemId", "amount", "unit", "name", "note", "optional", "sortOrder") VALUES
('hummus-snack-hummus', 'recipe-hummus-snack', 'grocery-hummus', 'half a tub', '', 'hummus', '', false, 0),
('hummus-snack-chips', 'recipe-hummus-snack', 'grocery-tortilla-chips', '70', 'g', 'tortilla chips', '', false, 1),
('hummus-snack-cucumber', 'recipe-hummus-snack', 'grocery-cucumber', '1/3', '', 'cucumber', '', false, 2),
('hummus-snack-oil', 'recipe-hummus-snack', NULL, 'a little', '', 'olive oil', 'to drizzle', false, 3);

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder") VALUES
('hummus-snack-step-1', 'recipe-hummus-snack', 'Cut the cucumber into bite-size pieces.', 0),
('hummus-snack-step-2', 'recipe-hummus-snack', 'Drizzle olive oil over the hummus and serve with the cucumber and tortilla chips.', 1);
