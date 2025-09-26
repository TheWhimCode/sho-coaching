/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `SessionDoc` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Session_stripeSessionId_key";

-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "stripeSessionId";

-- AlterTable
ALTER TABLE "public"."SessionDoc" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SessionDoc_sessionId_key" ON "public"."SessionDoc"("sessionId");

-- CreateIndex
CREATE INDEX "SessionDoc_sessionId_idx" ON "public"."SessionDoc"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."SessionDoc" ADD CONSTRAINT "SessionDoc_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
