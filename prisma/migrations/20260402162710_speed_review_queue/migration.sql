-- CreateEnum
CREATE TYPE "public"."SpeedReviewStatus" AS ENUM ('Pending', 'Done');

-- CreateTable
CREATE TABLE "public"."SpeedReviewQueue" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "discordName" TEXT,
    "riotTag" TEXT NOT NULL,
    "puuid" TEXT,
    "role" TEXT NOT NULL,
    "queueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousReviews" INTEGER NOT NULL DEFAULT 0,
    "paidPriority" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" "public"."SpeedReviewStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeedReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpeedReviewConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nextSessionAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeedReviewConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeedReviewQueue_discordId_key" ON "public"."SpeedReviewQueue"("discordId");

-- CreateIndex
CREATE INDEX "SpeedReviewQueue_reviewStatus_paidPriority_idx" ON "public"."SpeedReviewQueue"("reviewStatus", "paidPriority");

-- CreateIndex
CREATE INDEX "SpeedReviewQueue_queueDate_idx" ON "public"."SpeedReviewQueue"("queueDate");

-- CreateIndex
CREATE INDEX "SpeedReviewQueue_discordId_idx" ON "public"."SpeedReviewQueue"("discordId");
