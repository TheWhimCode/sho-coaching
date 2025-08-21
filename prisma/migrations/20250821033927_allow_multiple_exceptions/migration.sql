/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AvailabilityException` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `AvailabilityException` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."AvailabilityException_date_key";

-- AlterTable
ALTER TABLE "public"."AvailabilityException" DROP COLUMN "createdAt",
DROP COLUMN "reason";
