CREATE TABLE "admin"."WhatNowCategory" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "defaultEnergy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatNowCategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhatNowCategory_defaultEnergy_check" CHECK ("defaultEnergy" >= 1 AND "defaultEnergy" <= 10)
);

INSERT INTO "admin"."WhatNowCategory" ("id", "label", "defaultEnergy", "updatedAt") VALUES
    ('selfcare', 'Self care', 3, CURRENT_TIMESTAMP),
    ('food', 'Food', 4, CURRENT_TIMESTAMP),
    ('home', 'Home', 5, CURRENT_TIMESTAMP),
    ('twitter', 'X / Twitter', 5, CURRENT_TIMESTAMP),
    ('reddit', 'Reddit', 5, CURRENT_TIMESTAMP),
    ('tiktok', 'TikTok', 7, CURRENT_TIMESTAMP),
    ('vtubing', 'VTubing', 8, CURRENT_TIMESTAMP),
    ('blender', 'Blender', 8, CURRENT_TIMESTAMP),
    ('unity', 'Unity', 8, CURRENT_TIMESTAMP);

ALTER TABLE "admin"."SocialIdea" ADD COLUMN "energy" INTEGER;
ALTER TABLE "admin"."SocialIdea" ADD CONSTRAINT "SocialIdea_energy_check" CHECK ("energy" IS NULL OR ("energy" >= 1 AND "energy" <= 10));

ALTER TABLE "admin"."WhatNowTask" DROP CONSTRAINT "WhatNowTask_energy_check";
ALTER TABLE "admin"."WhatNowTask" ALTER COLUMN "energy" DROP NOT NULL;
ALTER TABLE "admin"."WhatNowTask" ADD CONSTRAINT "WhatNowTask_energy_check" CHECK ("energy" IS NULL OR ("energy" >= 1 AND "energy" <= 10));
