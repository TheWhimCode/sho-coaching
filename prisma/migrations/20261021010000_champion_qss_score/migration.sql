ALTER TABLE "public"."ChampionProfile"
ADD COLUMN "qssScore" INTEGER,
ADD CONSTRAINT "ChampionProfile_qssScore_check"
CHECK ("qssScore" IS NULL OR "qssScore" BETWEEN 1 AND 3);
