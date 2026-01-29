-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "skillcheck";

-- CreateTable
CREATE TABLE IF NOT EXISTS "skillcheck"."CooldownStat" (
  "id" TEXT NOT NULL,
  "championId" TEXT NOT NULL,
  "spellKey" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correctAttempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CooldownStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex / Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "CooldownStat_championId_spellKey_rank_key"
ON "skillcheck"."CooldownStat"("championId", "spellKey", "rank");

CREATE INDEX IF NOT EXISTS "CooldownStat_championId_idx"
ON "skillcheck"."CooldownStat"("championId");
