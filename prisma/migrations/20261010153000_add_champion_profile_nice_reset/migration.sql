-- Schema only: champion profile content is maintained through the app data layer.
ALTER TABLE "public"."ChampionProfile"
ADD COLUMN IF NOT EXISTS "niceReset" BOOLEAN NOT NULL DEFAULT false;
