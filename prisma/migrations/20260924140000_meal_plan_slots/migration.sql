ALTER TABLE "admin"."MealPlan" ADD COLUMN "mealSlot" TEXT NOT NULL DEFAULT 'dinner';
ALTER TABLE "admin"."MealPlan" ADD COLUMN "servings" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "MealPlan_plannedFor_mealSlot_key" ON "admin"."MealPlan"("plannedFor", "mealSlot");
