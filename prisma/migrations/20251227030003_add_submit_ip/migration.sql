/*
  Warnings:

  - Made the column `createdAt` on table `PendingConfirmationDM` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `SessionAsset` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Draft" ADD COLUMN     "submitIp" TEXT;

-- AlterTable
ALTER TABLE "PendingConfirmationDM" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SessionAsset" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PendingConfirmationDM_createdAt_idx" ON "PendingConfirmationDM"("createdAt");

-- CreateIndex
CREATE INDEX "SessionAsset_sessionId_idx" ON "SessionAsset"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAsset_assetId_idx" ON "SessionAsset"("assetId");

-- AddForeignKey
ALTER TABLE "SessionAsset" ADD CONSTRAINT "SessionAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAsset" ADD CONSTRAINT "SessionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AssetLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
