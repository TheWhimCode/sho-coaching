-- Create functional unique index for one snapshot per student per day (UTC)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_student_day"
ON "RankSnapshot" ("studentId", (date_trunc('day', "capturedAt")));
