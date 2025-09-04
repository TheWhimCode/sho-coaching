-- CreateIndex
CREATE INDEX "AvailabilityException_date_idx" ON "public"."AvailabilityException"("date");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "public"."Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_scheduledStart_idx" ON "public"."Booking"("scheduledStart");

-- CreateIndex
CREATE INDEX "ProcessedEvent_createdAt_idx" ON "public"."ProcessedEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Slot_status_startTime_holdUntil_idx" ON "public"."Slot"("status", "startTime", "holdUntil");

-- CreateIndex
CREATE INDEX "Slot_holdKey_holdUntil_idx" ON "public"."Slot"("holdKey", "holdUntil");

-- CreateIndex
CREATE INDEX "WebhookEvent_type_createdAt_idx" ON "public"."WebhookEvent"("type", "createdAt");

-- Sanity CHECKs
ALTER TABLE "public"."AvailabilityRule"
  ADD CONSTRAINT "weekday_range" CHECK ("weekday" BETWEEN 0 AND 6),
  ADD CONSTRAINT "rule_minutes_bounds" CHECK (
    "openMinute" BETWEEN 0 AND 1439 AND
    "closeMinute" BETWEEN 1 AND 1440 AND
    "openMinute" < "closeMinute"
  );

ALTER TABLE "public"."AvailabilityException"
  ADD CONSTRAINT "exception_minutes_valid" CHECK (
    ("blocked" = true AND "openMinute" IS NULL AND "closeMinute" IS NULL)
    OR
    ("blocked" = false AND
      "openMinute" IS NOT NULL AND "closeMinute" IS NOT NULL AND
      "openMinute" BETWEEN 0 AND 1439 AND
      "closeMinute" BETWEEN 1 AND 1440 AND
      "openMinute" < "closeMinute")
  );

ALTER TABLE "public"."Booking"
  ADD CONSTRAINT "live_minutes_range" CHECK ("liveMinutes" BETWEEN 30 AND 240),
  ADD CONSTRAINT "followups_nonneg"   CHECK ("followups" >= 0),
  ADD CONSTRAINT "currency_3_lower"   CHECK (char_length("currency") = 3 AND "currency" = lower("currency")),
  ADD CONSTRAINT "scheduled_minutes_pos" CHECK ("scheduledMinutes" > 0);

-- Optional (run once if you want UTC tz columns):
-- ALTER TABLE "public"."Slot"    ALTER COLUMN "startTime"      TYPE timestamptz(3) USING "startTime" AT TIME ZONE 'UTC';
-- ALTER TABLE "public"."Booking" ALTER COLUMN "scheduledStart" TYPE timestamptz(3) USING "scheduledStart" AT TIME ZONE 'UTC';
