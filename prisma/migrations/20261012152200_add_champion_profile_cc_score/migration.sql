-- Schema only. Ratings will be supplied separately through the data layer.
ALTER TABLE "public"."ChampionProfile"
  ADD COLUMN "ccScore" INTEGER,
  ADD CONSTRAINT "ChampionProfile_ccScore_range"
    CHECK ("ccScore" BETWEEN 1 AND 5);
