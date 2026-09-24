ALTER TABLE "admin"."MealPlan" RENAME COLUMN "plannedFor" TO "plannedDate";
ALTER TABLE "admin"."MealPlan" ALTER COLUMN "plannedDate" TYPE TEXT USING to_char("plannedDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD');

DROP INDEX "admin"."MealPlan_plannedFor_status_idx";
DROP INDEX "admin"."MealPlan_plannedFor_mealSlot_key";

CREATE INDEX "MealPlan_plannedDate_status_idx" ON "admin"."MealPlan"("plannedDate", "status");
CREATE UNIQUE INDEX "MealPlan_plannedDate_mealSlot_key" ON "admin"."MealPlan"("plannedDate", "mealSlot");
