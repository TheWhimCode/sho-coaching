-- Durability is now durabilityScore 1–5. Squishy/Bruiser/Tanky is unused.
ALTER TABLE "public"."ChampionProfile" DROP COLUMN "durability";
DROP TYPE "public"."ChampionDurability";
