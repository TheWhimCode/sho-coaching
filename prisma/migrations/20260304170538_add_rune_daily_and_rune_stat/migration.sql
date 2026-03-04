-- CreateTable
CREATE TABLE "skillcheck"."RuneDaily" (
    "dayKey" TEXT NOT NULL,
    "championId" TEXT NOT NULL,
    "keystoneId" INTEGER NOT NULL,
    "sampledAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuneDaily_pkey" PRIMARY KEY ("dayKey")
);

-- CreateTable
CREATE TABLE "skillcheck"."RuneStat" (
    "id" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "championId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuneStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuneStat_dayKey_idx" ON "skillcheck"."RuneStat"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "RuneStat_dayKey_championId_key" ON "skillcheck"."RuneStat"("dayKey", "championId");
