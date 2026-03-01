-- CreateTable
CREATE TABLE "skillcheck"."ItemStat" (
    "id" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemStat_dayKey_idx" ON "skillcheck"."ItemStat"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "ItemStat_dayKey_itemId_key" ON "skillcheck"."ItemStat"("dayKey", "itemId");
