UPDATE "admin"."Recipe"
SET
  "title" = 'Creamy Chicken',
  "notes" = 'Use a heavy-bottomed pot on a similar-sized burner. Pat the chicken dry and brown it over medium-high heat. Keep the lid on while the pasta simmers, lifting it only to stir and check for sticking. Do not add extra broth at the start. After about 20 minutes, simmer uncovered if the sauce is loose; add a small splash of hot broth or water if the pasta needs more time. Heavy cream gives the richest, most stable sauce.',
  "updatedAt" = NOW()
WHERE "id" = 'recipe-creamy-chicken-pasta';
