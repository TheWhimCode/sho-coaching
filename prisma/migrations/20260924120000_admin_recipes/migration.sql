CREATE TABLE "admin"."Recipe" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "servings" INTEGER NOT NULL DEFAULT 2,
    "prepMinutes" INTEGER NOT NULL DEFAULT 0,
    "cookMinutes" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "referenceImage" TEXT NOT NULL DEFAULT '',
    "calories" INTEGER,
    "proteinGrams" DOUBLE PRECISION,
    "carbsGrams" DOUBLE PRECISION,
    "fatGrams" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "amount" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."RecipeStep" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Recipe_title_idx" ON "admin"."Recipe"("title");
CREATE UNIQUE INDEX "Recipe_slug_key" ON "admin"."Recipe"("slug");
CREATE INDEX "RecipeIngredient_recipeId_sortOrder_idx" ON "admin"."RecipeIngredient"("recipeId", "sortOrder");
CREATE INDEX "RecipeStep_recipeId_sortOrder_idx" ON "admin"."RecipeStep"("recipeId", "sortOrder");

ALTER TABLE "admin"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "admin"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin"."RecipeStep" ADD CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "admin"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
