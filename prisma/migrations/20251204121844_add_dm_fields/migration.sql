-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "bookingOwnerSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmationSent" BOOLEAN NOT NULL DEFAULT false;
