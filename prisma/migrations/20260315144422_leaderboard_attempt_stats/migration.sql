-- AlterTable
ALTER TABLE "skillcheck"."LeaderboardEntry" ADD COLUMN     "cooldownsAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cooldownsCorrectAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "draftAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "draftCorrectAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "itemsAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "itemsCorrectAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runesAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runesCorrectAttempts" INTEGER NOT NULL DEFAULT 0;
