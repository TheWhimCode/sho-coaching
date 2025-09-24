-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PRIVATE', 'STUDENT');

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discord" TEXT,
    "puuid" TEXT,
    "server" TEXT,
    "summonerId" TEXT,
    "riotTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "visibility" "public"."Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT,
    "size" INTEGER,
    "visibility" "public"."Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RankSnapshot" (
    "id" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" TEXT NOT NULL,
    "division" TEXT,
    "lp" INTEGER NOT NULL,

    CONSTRAINT "RankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_name_key" ON "public"."Student"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_discord_key" ON "public"."Student"("discord");

-- CreateIndex
CREATE UNIQUE INDEX "Student_puuid_key" ON "public"."Student"("puuid");

-- CreateIndex
CREATE INDEX "Student_puuid_idx" ON "public"."Student"("puuid");

-- CreateIndex
CREATE INDEX "Asset_studentId_idx" ON "public"."Asset"("studentId");

-- CreateIndex
CREATE INDEX "RankSnapshot_puuid_capturedAt_idx" ON "public"."RankSnapshot"("puuid", "capturedAt");

-- CreateIndex
CREATE INDEX "RankSnapshot_capturedAt_idx" ON "public"."RankSnapshot"("capturedAt");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
