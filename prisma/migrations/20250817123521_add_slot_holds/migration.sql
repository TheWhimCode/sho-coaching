-- AlterTable
ALTER TABLE "Slot" ADD COLUMN "holdKey" TEXT;
ALTER TABLE "Slot" ADD COLUMN "holdUntil" DATETIME;

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "slotId" TEXT NOT NULL,
    "liveMinutes" INTEGER NOT NULL,
    "inGame" BOOLEAN NOT NULL DEFAULT false,
    "followups" INTEGER NOT NULL DEFAULT 0,
    "discord" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeSessionId" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "blockCsv" TEXT,
    CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "discord", "followups", "id", "inGame", "liveMinutes", "notes", "sessionType", "slotId", "status") SELECT "createdAt", "discord", "followups", "id", "inGame", "liveMinutes", "notes", "sessionType", "slotId", "status" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");
CREATE UNIQUE INDEX "Booking_stripeSessionId_key" ON "Booking"("stripeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
