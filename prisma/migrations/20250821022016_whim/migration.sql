-- CreateTable
CREATE TABLE "public"."Slot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "isTaken" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'free',
    "holdUntil" TIMESTAMP(3),
    "holdKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "slotId" TEXT,
    "liveMinutes" INTEGER NOT NULL,
    "inGame" BOOLEAN NOT NULL DEFAULT false,
    "followups" INTEGER NOT NULL DEFAULT 0,
    "discord" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeSessionId" TEXT,
    "paymentProvider" TEXT,
    "paymentRef" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "blockCsv" TEXT,
    "customerEmail" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledMinutes" INTEGER NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcessedEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slot_startTime_key" ON "public"."Slot"("startTime");

-- CreateIndex
CREATE INDEX "Slot_startTime_idx" ON "public"."Slot"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityException_date_key" ON "public"."AvailabilityException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotId_key" ON "public"."Booking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeSessionId_key" ON "public"."Booking"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paymentRef_key" ON "public"."Booking"("paymentRef");

-- CreateIndex
CREATE INDEX "EmailLog_bookingId_idx" ON "public"."EmailLog"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_bookingId_kind_key" ON "public"."EmailLog"("bookingId", "kind");

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
