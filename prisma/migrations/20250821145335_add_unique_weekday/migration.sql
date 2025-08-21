/*
  Warnings:

  - A unique constraint covering the columns `[weekday]` on the table `AvailabilityRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRule_weekday_key" ON "public"."AvailabilityRule"("weekday");
