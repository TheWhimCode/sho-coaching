-- CreateTable
CREATE TABLE "skillcheck"."LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "displayName" TEXT,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_clientId_key" ON "skillcheck"."LeaderboardEntry"("clientId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_streakDays_idx" ON "skillcheck"."LeaderboardEntry"("streakDays" DESC);
