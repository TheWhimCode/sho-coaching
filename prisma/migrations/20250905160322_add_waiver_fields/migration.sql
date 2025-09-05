/*
  Warnings:

  - You are about to drop the column `inGame` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "inGame",
ADD COLUMN     "liveBlocks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "waiverAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "waiverAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "waiverIp" TEXT;
