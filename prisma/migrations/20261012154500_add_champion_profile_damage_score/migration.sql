-- Schema only. Ratings will be supplied separately through the data layer.
ALTER TABLE "public"."ChampionProfile"
  ADD COLUMN "damageScore" INTEGER,
  ADD CONSTRAINT "ChampionProfile_damageScore_range"
    CHECK ("damageScore" BETWEEN 1 AND 5);
