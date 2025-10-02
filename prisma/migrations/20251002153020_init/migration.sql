-- CreateEnum
CREATE TYPE "public"."SlotStatus" AS ENUM ('free', 'taken', 'blocked');

-- CreateTable
CREATE TABLE "public"."Slot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "holdUntil" TIMESTAMP(3),
    "holdKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."SlotStatus" NOT NULL DEFAULT 'free',

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvailabilityRule" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "openMinute" INTEGER NOT NULL,
    "closeMinute" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvailabilityException" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openMinute" INTEGER,
    "closeMinute" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "slotId" TEXT,
    "liveMinutes" INTEGER NOT NULL,
    "followups" INTEGER NOT NULL DEFAULT 0,
    "riotTag" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentProvider" TEXT,
    "paymentRef" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "blockCsv" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledMinutes" INTEGER NOT NULL,
    "liveBlocks" INTEGER NOT NULL DEFAULT 0,
    "waiverAccepted" BOOLEAN NOT NULL DEFAULT false,
    "waiverAcceptedAt" TIMESTAMP(3),
    "waiverIp" TEXT,
    "studentId" TEXT,
    "discordId" TEXT,
    "discordName" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcessedEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "puuid" TEXT,
    "server" TEXT,
    "riotTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discordId" TEXT,
    "discordName" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetLibrary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentAsset" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RankSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" TEXT NOT NULL,
    "division" TEXT,
    "lp" INTEGER NOT NULL,

    CONSTRAINT "RankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionDoc" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "notes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "SessionDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slot_startTime_key" ON "public"."Slot"("startTime");

-- CreateIndex
CREATE INDEX "Slot_startTime_idx" ON "public"."Slot"("startTime");

-- CreateIndex
CREATE INDEX "Slot_status_startTime_holdUntil_idx" ON "public"."Slot"("status", "startTime", "holdUntil");

-- CreateIndex
CREATE INDEX "Slot_holdKey_holdUntil_idx" ON "public"."Slot"("holdKey", "holdUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRule_weekday_key" ON "public"."AvailabilityRule"("weekday");

-- CreateIndex
CREATE INDEX "AvailabilityException_date_idx" ON "public"."AvailabilityException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Session_slotId_key" ON "public"."Session"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_paymentRef_key" ON "public"."Session"("paymentRef");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "public"."Session"("createdAt");

-- CreateIndex
CREATE INDEX "Session_scheduledStart_idx" ON "public"."Session"("scheduledStart");

-- CreateIndex
CREATE INDEX "Session_riotTag_idx" ON "public"."Session"("riotTag");

-- CreateIndex
CREATE INDEX "Session_discordId_idx" ON "public"."Session"("discordId");

-- CreateIndex
CREATE INDEX "Session_studentId_idx" ON "public"."Session"("studentId");

-- CreateIndex
CREATE INDEX "ProcessedEvent_createdAt_idx" ON "public"."ProcessedEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_type_createdAt_idx" ON "public"."WebhookEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Student_name_key" ON "public"."Student"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_puuid_key" ON "public"."Student"("puuid");

-- CreateIndex
CREATE UNIQUE INDEX "Student_riotTag_key" ON "public"."Student"("riotTag");

-- CreateIndex
CREATE UNIQUE INDEX "Student_discordId_key" ON "public"."Student"("discordId");

-- CreateIndex
CREATE INDEX "Student_puuid_idx" ON "public"."Student"("puuid");

-- CreateIndex
CREATE INDEX "StudentAsset_studentId_idx" ON "public"."StudentAsset"("studentId");

-- CreateIndex
CREATE INDEX "StudentAsset_assetId_idx" ON "public"."StudentAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAsset_studentId_assetId_key" ON "public"."StudentAsset"("studentId", "assetId");

-- CreateIndex
CREATE INDEX "RankSnapshot_studentId_capturedAt_idx" ON "public"."RankSnapshot"("studentId", "capturedAt");

-- CreateIndex
CREATE INDEX "RankSnapshot_capturedAt_idx" ON "public"."RankSnapshot"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDoc_sessionId_key" ON "public"."SessionDoc"("sessionId");

-- CreateIndex
CREATE INDEX "SessionDoc_studentId_idx" ON "public"."SessionDoc"("studentId");

-- CreateIndex
CREATE INDEX "SessionDoc_sessionId_idx" ON "public"."SessionDoc"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDoc_studentId_number_key" ON "public"."SessionDoc"("studentId", "number");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentAsset" ADD CONSTRAINT "StudentAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."AssetLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentAsset" ADD CONSTRAINT "StudentAsset_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RankSnapshot" ADD CONSTRAINT "RankSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionDoc" ADD CONSTRAINT "SessionDoc_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionDoc" ADD CONSTRAINT "SessionDoc_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
