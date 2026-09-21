CREATE TABLE "admin"."WhatNowTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "energy" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatNowTask_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhatNowTask_energy_check" CHECK ("energy" >= 1 AND "energy" <= 10)
);

CREATE INDEX "WhatNowTask_energy_idx" ON "admin"."WhatNowTask"("energy");
CREATE INDEX "WhatNowTask_category_subcategory_idx" ON "admin"."WhatNowTask"("category", "subcategory");
