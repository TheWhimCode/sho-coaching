-- Schema only. Ratings will be supplied separately through the data layer.
ALTER TABLE "public"."ChampionProfile"
  ADD COLUMN "mercuryTreadsScore" INTEGER,
  ADD CONSTRAINT "ChampionProfile_mercuryTreadsScore_range"
    CHECK ("mercuryTreadsScore" BETWEEN 1 AND 3);
