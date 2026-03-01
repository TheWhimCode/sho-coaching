-- Step 1: Create DraftStatus enum and Draft table in skillcheck schema (same structure as public)
CREATE TYPE skillcheck."DraftStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE skillcheck."Draft" (
  "id" TEXT NOT NULL,
  "blue" JSONB NOT NULL,
  "red" JSONB NOT NULL,
  "role" TEXT NOT NULL,
  "userTeam" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "usedLast" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correctAttempts" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "dislikes" INTEGER NOT NULL DEFAULT 0,
  "status" skillcheck."DraftStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitIp" TEXT,
  CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- Step 2: Copy all rows (cast enum from public to skillcheck)
INSERT INTO skillcheck."Draft" (
  "id", "blue", "red", "role", "userTeam", "answers",
  "usedLast", "attempts", "correctAttempts", "likes", "dislikes",
  "status", "createdAt", "submitIp"
)
SELECT
  "id", "blue", "red", "role", "userTeam", "answers",
  "usedLast", "attempts", "correctAttempts", "likes", "dislikes",
  "status"::text::skillcheck."DraftStatus",
  "createdAt", "submitIp"
FROM public."Draft";
