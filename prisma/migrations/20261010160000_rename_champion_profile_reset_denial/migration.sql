-- Schema only: preserve the existing reset-denier flags while using a clear field name.
ALTER TABLE "public"."ChampionProfile"
RENAME COLUMN "niceReset" TO "deniesResets";
