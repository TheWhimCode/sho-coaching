-- Product brands supply the nutrition and pack data, but grocery labels stay
-- generic so recipes remain readable and reusable.
UPDATE "admin"."GroceryItem" SET "name" = 'Greek yogurt', "updatedAt" = NOW()
WHERE "id" = 'grocery-recipe-135c1ae9520713a5c3efbafc7bcec097';

UPDATE "admin"."GroceryItem" SET "name" = 'almond milk', "updatedAt" = NOW()
WHERE "id" = 'grocery-recipe-d60536f7a483b2251c8c6d969bcbc792';

UPDATE "admin"."GroceryItem" SET "name" = 'pecan nuts', "updatedAt" = NOW()
WHERE "id" = 'grocery-measure-5c919d21f2d261890004c36662da2ef1';

UPDATE "admin"."GroceryItem" SET "name" = 'raspberries', "updatedAt" = NOW()
WHERE "id" = 'grocery-recipe-ed974a42724a7427cec56ca9564d89fb';

UPDATE "admin"."GroceryItem" SET "name" = 'mango', "updatedAt" = NOW()
WHERE "id" = 'grocery-recipe-aa00faf97d042c13a59da4d27eb32358';

UPDATE "admin"."GroceryItem" SET "name" = 'mascarpone', "updatedAt" = NOW()
WHERE "id" = 'grocery-measure-684e0d41a2e4fb33e53a055d251d316c';

UPDATE "admin"."GroceryItem" SET "name" = 'puréed tomato', "updatedAt" = NOW()
WHERE "id" = 'grocery-measure-4df9943f813a7c9fbdc1535b6ec7113d';

UPDATE "admin"."GroceryItem" SET "name" = 'basmati rice', "updatedAt" = NOW()
WHERE "id" = 'grocery-kitchin-basmati-rice';
