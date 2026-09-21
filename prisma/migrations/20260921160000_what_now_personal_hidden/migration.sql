ALTER TABLE "admin"."WhatNowCategory" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "admin"."WhatNowCategory" ("id", "label", "defaultEnergy", "hidden", "updatedAt")
VALUES ('personal', 'Personal', 4, true, CURRENT_TIMESTAMP);
