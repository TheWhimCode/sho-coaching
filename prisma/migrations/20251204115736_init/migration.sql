-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('free', 'taken', 'blocked');

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "holdUntil" TIMESTAMP(3),
    "holdKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'free',

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "openMinute" INTEGER NOT NULL,
    "closeMinute" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openMinute" INTEGER,
    "closeMinute" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
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
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "followupSent" BOOLEAN NOT NULL DEFAULT false,
    "couponCode" TEXT,
    "couponDiscount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingConfirmationDM" (
    "discordId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingConfirmationDM_pkey" PRIMARY KEY ("discordId")
);

-- CreateTable
CREATE TABLE "SessionAsset" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
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
CREATE TABLE "AssetLibrary" (
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
CREATE TABLE "StudentAsset" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" TEXT NOT NULL,
    "division" TEXT,
    "lp" INTEGER NOT NULL,

    CONSTRAINT "RankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionDoc" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "notes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "SessionDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slot_startTime_key" ON "Slot"("startTime");

-- CreateIndex
CREATE INDEX "Slot_startTime_idx" ON "Slot"("startTime");

-- CreateIndex
CREATE INDEX "Slot_status_startTime_holdUntil_idx" ON "Slot"("status", "startTime", "holdUntil");

-- CreateIndex
CREATE INDEX "Slot_holdKey_holdUntil_idx" ON "Slot"("holdKey", "holdUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRule_weekday_key" ON "AvailabilityRule"("weekday");

-- CreateIndex
CREATE INDEX "AvailabilityException_date_idx" ON "AvailabilityException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Session_slotId_key" ON "Session"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_paymentRef_key" ON "Session"("paymentRef");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "Session_scheduledStart_idx" ON "Session"("scheduledStart");

-- CreateIndex
CREATE INDEX "Session_riotTag_idx" ON "Session"("riotTag");

-- CreateIndex
CREATE INDEX "Session_discordId_idx" ON "Session"("discordId");

-- CreateIndex
CREATE INDEX "Session_studentId_idx" ON "Session"("studentId");

-- CreateIndex
CREATE INDEX "PendingConfirmationDM_createdAt_idx" ON "PendingConfirmationDM"("createdAt");

-- CreateIndex
CREATE INDEX "SessionAsset_sessionId_idx" ON "SessionAsset"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAsset_assetId_idx" ON "SessionAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAsset_sessionId_assetId_key" ON "SessionAsset"("sessionId", "assetId");

-- CreateIndex
CREATE INDEX "ProcessedEvent_createdAt_idx" ON "ProcessedEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_type_createdAt_idx" ON "WebhookEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Student_name_key" ON "Student"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_puuid_key" ON "Student"("puuid");

-- CreateIndex
CREATE UNIQUE INDEX "Student_riotTag_key" ON "Student"("riotTag");

-- CreateIndex
CREATE UNIQUE INDEX "Student_discordId_key" ON "Student"("discordId");

-- CreateIndex
CREATE INDEX "Student_puuid_idx" ON "Student"("puuid");

-- CreateIndex
CREATE INDEX "StudentAsset_studentId_idx" ON "StudentAsset"("studentId");

-- CreateIndex
CREATE INDEX "StudentAsset_assetId_idx" ON "StudentAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAsset_studentId_assetId_key" ON "StudentAsset"("studentId", "assetId");

-- CreateIndex
CREATE INDEX "RankSnapshot_studentId_capturedAt_idx" ON "RankSnapshot"("studentId", "capturedAt");

-- CreateIndex
CREATE INDEX "RankSnapshot_capturedAt_idx" ON "RankSnapshot"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDoc_sessionId_key" ON "SessionDoc"("sessionId");

-- CreateIndex
CREATE INDEX "SessionDoc_studentId_idx" ON "SessionDoc"("studentId");

-- CreateIndex
CREATE INDEX "SessionDoc_sessionId_idx" ON "SessionDoc"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDoc_studentId_number_key" ON "SessionDoc"("studentId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_studentId_idx" ON "Coupon"("studentId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAsset" ADD CONSTRAINT "SessionAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAsset" ADD CONSTRAINT "SessionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AssetLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAsset" ADD CONSTRAINT "StudentAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AssetLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAsset" ADD CONSTRAINT "StudentAsset_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankSnapshot" ADD CONSTRAINT "RankSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionDoc" ADD CONSTRAINT "SessionDoc_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionDoc" ADD CONSTRAINT "SessionDoc_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
