DROP INDEX "admin"."GroceryItem_name_defaultUnit_key";
ALTER TABLE "admin"."GroceryItem" DROP COLUMN "defaultUnit";
CREATE UNIQUE INDEX "GroceryItem_name_key" ON "admin"."GroceryItem"("name");

ALTER TABLE "admin"."GroceryLot" ALTER COLUMN "purchasedAmount" TYPE TEXT USING "purchasedAmount"::TEXT;
ALTER TABLE "admin"."GroceryLot" ALTER COLUMN "remainingAmount" TYPE TEXT USING "remainingAmount"::TEXT;
ALTER TABLE "admin"."GroceryLot" DROP COLUMN "unit";
ALTER TABLE "admin"."GroceryLot" ADD COLUMN "purchasedWeightGrams" DECIMAL(12,3);
ALTER TABLE "admin"."GroceryLot" ADD COLUMN "remainingWeightGrams" DECIMAL(12,3);
