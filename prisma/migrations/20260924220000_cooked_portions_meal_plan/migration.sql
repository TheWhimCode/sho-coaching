-- Cooked batches keep a fridge count; meal plan slots can consume those portions or claim raw groceries.
ALTER TABLE "admin"."RecipeCook" ADD COLUMN "remainingServings" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX "RecipeCook_recipeId_idx" ON "admin"."RecipeCook"("recipeId");

ALTER TABLE "admin"."MealPlan" ADD COLUMN "addonRecipeId" TEXT;
ALTER TABLE "admin"."MealPlan" ADD COLUMN "cookedServings" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "admin"."MealPlan" ADD COLUMN "recipeCookId" TEXT;
ALTER TABLE "admin"."MealPlan" ADD CONSTRAINT "MealPlan_recipeCookId_fkey" FOREIGN KEY ("recipeCookId") REFERENCES "admin"."RecipeCook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "MealPlan_recipeId_plannedDate_idx" ON "admin"."MealPlan"("recipeId", "plannedDate");
CREATE INDEX "MealPlan_recipeCookId_idx" ON "admin"."MealPlan"("recipeCookId");
