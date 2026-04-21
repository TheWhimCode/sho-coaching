-- Add 24h reminder sent flag for speed review event notifications.
ALTER TABLE "public"."SpeedReviewConfig"
ADD COLUMN "reminder24hSent" BOOLEAN NOT NULL DEFAULT false;
