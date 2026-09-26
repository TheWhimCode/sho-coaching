DELETE FROM "admin"."RecipeStep"
WHERE "recipeId" = 'recipe-creamy-chicken-pasta';

INSERT INTO "admin"."RecipeStep" ("id", "recipeId", "text", "sortOrder") VALUES
  ('creamy-chicken-step-1', 'recipe-creamy-chicken-pasta', 'Prepare all ingredients.', 0),
  ('creamy-chicken-step-2', 'recipe-creamy-chicken-pasta', 'Heat 1 tbsp sun-dried tomato oil in a large skillet or Dutch oven over medium-high. Pat the chicken dry and season with 1/2 tsp salt and 1/2 tsp pepper.', 1),
  ('creamy-chicken-step-3', 'recipe-creamy-chicken-pasta', 'Sear the chicken in batches if needed: 3 minutes undisturbed, then 3 minutes on the other side. Set aside.', 2),
  ('creamy-chicken-step-4', 'recipe-creamy-chicken-pasta', 'Reduce to medium. Add the remaining oil, onion, garlic, and sun-dried tomatoes; cook for 3 minutes until softened. Stir in tomato paste for 1 minute.', 3),
  ('creamy-chicken-step-5', 'recipe-creamy-chicken-pasta', 'Add broth, pasta, remaining salt and pepper, Italian seasoning, and chicken with its drippings. Bring to a boil, then cover and simmer for 10 minutes.', 4),
  ('creamy-chicken-step-6', 'recipe-creamy-chicken-pasta', 'Stir well, cover again, and cook for another 10 minutes.', 5),
  ('creamy-chicken-step-7', 'recipe-creamy-chicken-pasta', 'Check the pasta. If needed, add a splash of broth and cook until tender. Turn off the heat.', 6),
  ('creamy-chicken-step-8', 'recipe-creamy-chicken-pasta', 'Stir in the heavy cream and frozen spinach until warmed through. Finish with Parmesan.', 7);
