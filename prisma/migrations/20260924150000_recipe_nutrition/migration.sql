CREATE TABLE "admin"."RecipeNutrition" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "proteinGrams" DOUBLE PRECISION,
    "carbsGrams" DOUBLE PRECISION,
    "fatGrams" DOUBLE PRECISION,
    "fibreGrams" DOUBLE PRECISION,
    "saturatedFatGrams" DOUBLE PRECISION,
    "sugarGrams" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "potassiumMg" DOUBLE PRECISION,
    "calciumMg" DOUBLE PRECISION,
    "magnesiumMg" DOUBLE PRECISION,
    "ironMg" DOUBLE PRECISION,
    "zincMg" DOUBLE PRECISION,
    "vitaminDMcg" DOUBLE PRECISION,
    "vitaminB12McG" DOUBLE PRECISION,
    "folateMcg" DOUBLE PRECISION,
    "iodineMcg" DOUBLE PRECISION,
    "omega3AlAGrams" DOUBLE PRECISION,
    "omega3EpaDhaMg" DOUBLE PRECISION,
    "basis" TEXT NOT NULL DEFAULT 'per serving',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecipeNutrition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."DailyNutritionTarget" (
    "id" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "proteinGrams" DOUBLE PRECISION,
    "carbsGrams" DOUBLE PRECISION,
    "fatGrams" DOUBLE PRECISION,
    "fibreGrams" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "potassiumMg" DOUBLE PRECISION,
    "calciumMg" DOUBLE PRECISION,
    "magnesiumMg" DOUBLE PRECISION,
    "ironMg" DOUBLE PRECISION,
    "zincMg" DOUBLE PRECISION,
    "vitaminDMcg" DOUBLE PRECISION,
    "vitaminB12McG" DOUBLE PRECISION,
    "folateMcg" DOUBLE PRECISION,
    "iodineMcg" DOUBLE PRECISION,
    "omega3AlAGrams" DOUBLE PRECISION,
    "omega3EpaDhaMg" DOUBLE PRECISION,
    "trainingDay" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyNutritionTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecipeNutrition_recipeId_key" ON "admin"."RecipeNutrition"("recipeId");
CREATE UNIQUE INDEX "DailyNutritionTarget_trainingDay_key" ON "admin"."DailyNutritionTarget"("trainingDay");
ALTER TABLE "admin"."RecipeNutrition" ADD CONSTRAINT "RecipeNutrition_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "admin"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
