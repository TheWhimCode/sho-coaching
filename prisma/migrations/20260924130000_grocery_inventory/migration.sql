ALTER TABLE "admin"."RecipeIngredient" ADD COLUMN "groceryItemId" TEXT;
ALTER TABLE "admin"."RecipeIngredient" ADD COLUMN "quantity" DECIMAL(12,3);

CREATE TABLE "admin"."GroceryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."GroceryLot" (
    "id" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "purchasedAmount" DECIMAL(12,3) NOT NULL,
    "remainingAmount" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "usualShelfLifeDays" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroceryLot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."MealPlan" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "plannedFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "cookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."GroceryReservation" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "groceryLotId" TEXT NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroceryReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."GroceryTransaction" (
    "id" TEXT NOT NULL,
    "groceryLotId" TEXT NOT NULL,
    "mealPlanId" TEXT,
    "amountDelta" DECIMAL(12,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroceryTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroceryItem_name_defaultUnit_key" ON "admin"."GroceryItem"("name", "defaultUnit");
CREATE INDEX "RecipeIngredient_groceryItemId_idx" ON "admin"."RecipeIngredient"("groceryItemId");
CREATE INDEX "GroceryLot_groceryItemId_expiresAt_idx" ON "admin"."GroceryLot"("groceryItemId", "expiresAt");
CREATE INDEX "MealPlan_plannedFor_status_idx" ON "admin"."MealPlan"("plannedFor", "status");
CREATE UNIQUE INDEX "GroceryReservation_mealPlanId_groceryLotId_key" ON "admin"."GroceryReservation"("mealPlanId", "groceryLotId");
CREATE INDEX "GroceryReservation_groceryLotId_idx" ON "admin"."GroceryReservation"("groceryLotId");
CREATE INDEX "GroceryTransaction_groceryLotId_createdAt_idx" ON "admin"."GroceryTransaction"("groceryLotId", "createdAt");
CREATE INDEX "GroceryTransaction_mealPlanId_idx" ON "admin"."GroceryTransaction"("mealPlanId");

ALTER TABLE "admin"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "admin"."GroceryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin"."GroceryLot" ADD CONSTRAINT "GroceryLot_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "admin"."GroceryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin"."MealPlan" ADD CONSTRAINT "MealPlan_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "admin"."Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin"."GroceryReservation" ADD CONSTRAINT "GroceryReservation_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "admin"."MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin"."GroceryReservation" ADD CONSTRAINT "GroceryReservation_groceryLotId_fkey" FOREIGN KEY ("groceryLotId") REFERENCES "admin"."GroceryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin"."GroceryTransaction" ADD CONSTRAINT "GroceryTransaction_groceryLotId_fkey" FOREIGN KEY ("groceryLotId") REFERENCES "admin"."GroceryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin"."GroceryTransaction" ADD CONSTRAINT "GroceryTransaction_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "admin"."MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
