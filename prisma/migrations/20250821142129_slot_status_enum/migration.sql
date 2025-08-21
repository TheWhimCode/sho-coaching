/*
  Warnings:

  - The `status` column on the `Slot` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."SlotStatus" AS ENUM ('free', 'taken', 'blocked');

-- AlterTable
ALTER TABLE "public"."Slot" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SlotStatus" NOT NULL DEFAULT 'free';
