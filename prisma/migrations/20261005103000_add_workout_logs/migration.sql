CREATE TABLE "admin"."WorkoutLog" (
    "id" TEXT NOT NULL,
    "workoutDate" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkoutLog_workoutDate_exercise_idx" ON "admin"."WorkoutLog"("workoutDate", "exercise");
