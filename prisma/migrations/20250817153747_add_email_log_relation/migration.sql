/*
  Warnings:

  - A unique constraint covering the columns `[paymentRef]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Booking_createdAt_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "paymentProvider" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paymentRef_key" ON "Booking"("paymentRef");

-- CreateIndex
CREATE INDEX "EmailLog_bookingId_idx" ON "EmailLog"("bookingId");
