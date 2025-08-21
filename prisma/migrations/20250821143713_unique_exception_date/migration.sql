/*
  Warnings:

  - A unique constraint covering the columns `[date]` on the table `AvailabilityException` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityException_date_key" ON "public"."AvailabilityException"("date");
