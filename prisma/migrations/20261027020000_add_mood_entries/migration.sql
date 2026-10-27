CREATE TABLE "admin"."MoodEntry" (
    "id" TEXT NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "mood" INTEGER,
    "energy" INTEGER,
    "stress" INTEGER,
    "motivation" INTEGER,
    "mentalClarity" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MoodEntry_mood_check" CHECK ("mood" BETWEEN 1 AND 5),
    CONSTRAINT "MoodEntry_energy_check" CHECK ("energy" BETWEEN 1 AND 5),
    CONSTRAINT "MoodEntry_stress_check" CHECK ("stress" BETWEEN 1 AND 5),
    CONSTRAINT "MoodEntry_motivation_check" CHECK ("motivation" BETWEEN 1 AND 5),
    CONSTRAINT "MoodEntry_mentalClarity_check" CHECK ("mentalClarity" BETWEEN 1 AND 5),
    CONSTRAINT "MoodEntry_rating_required_check" CHECK (
        "mood" IS NOT NULL OR "energy" IS NOT NULL OR "stress" IS NOT NULL
        OR "motivation" IS NOT NULL OR "mentalClarity" IS NOT NULL
    )
);

CREATE INDEX "MoodEntry_recordedAt_idx" ON "admin"."MoodEntry"("recordedAt");
