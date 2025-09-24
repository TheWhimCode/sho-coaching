-- CreateTable
CREATE TABLE "public"."SessionDoc" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "notes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionDoc_studentId_idx" ON "public"."SessionDoc"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDoc_studentId_number_key" ON "public"."SessionDoc"("studentId", "number");

-- AddForeignKey
ALTER TABLE "public"."SessionDoc" ADD CONSTRAINT "SessionDoc_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
