-- Schema only. Ratings will be supplied separately through the data layer.
ALTER TABLE "public"."ChampionProfile"
  ADD COLUMN "durabilityScore" INTEGER,
  ADD COLUMN "shieldScore" INTEGER,
  ADD COLUMN "shieldTiming" TEXT,
  ADD COLUMN "canBuildSteelcaps" BOOLEAN,
  ADD CONSTRAINT "ChampionProfile_durabilityScore_range"
    CHECK ("durabilityScore" BETWEEN 1 AND 5),
  ADD CONSTRAINT "ChampionProfile_shieldScore_range"
    CHECK ("shieldScore" BETWEEN 0 AND 5),
  ADD CONSTRAINT "ChampionProfile_shieldTiming_value"
    CHECK ("shieldTiming" = 'Late');
