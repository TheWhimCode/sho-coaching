/*
  Warnings:

  - You are about to drop the column `customerEmail` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `discord` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `discord` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `EmailLog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[discordId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[riotTag]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Made the column `riotTag` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."EmailLog" DROP CONSTRAINT "EmailLog_sessionId_fkey";

-- DropIndex
DROP INDEX "public"."Student_discord_key";

-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "customerEmail",
DROP COLUMN "discord",
ADD COLUMN     "discordId" TEXT,
ADD COLUMN     "discordName" TEXT,
ALTER COLUMN "riotTag" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "discord",
ADD COLUMN     "discordId" TEXT,
ADD COLUMN     "discordName" TEXT;

-- DropTable
DROP TABLE "public"."EmailLog";

-- CreateIndex
CREATE INDEX "Session_riotTag_idx" ON "public"."Session"("riotTag");

-- CreateIndex
CREATE INDEX "Session_discordId_idx" ON "public"."Session"("discordId");

-- CreateIndex
CREATE INDEX "Session_studentId_idx" ON "public"."Session"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_discordId_key" ON "public"."Student"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_riotTag_key" ON "public"."Student"("riotTag");
