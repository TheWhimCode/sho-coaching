ALTER TABLE "admin"."WhatNowTask" ADD COLUMN IF NOT EXISTS "steps" JSONB NOT NULL DEFAULT '[]';

UPDATE "admin"."WhatNowQuestion"
SET "prompt" = 'What do you want to look at?'
WHERE "id" = 'work-kind';

UPDATE "admin"."WhatNowChoice"
SET "minEnergy" = 5
WHERE "id" = 'feel-work';

UPDATE "admin"."WhatNowChoice"
SET
    "label" = 'Tell me what needs to be done',
    "categories" = ARRAY['selfcare','food','home']::TEXT[],
    "sortOrder" = 0
WHERE "id" = 'work-life';

UPDATE "admin"."WhatNowChoice"
SET
    "label" = 'Make a TikTok',
    "categories" = ARRAY['tiktok']::TEXT[],
    "sortOrder" = 1
WHERE "id" = 'work-create';

UPDATE "admin"."WhatNowChoice"
SET
    "label" = 'Work on your model',
    "categories" = ARRAY['blender','vtubing','unity']::TEXT[],
    "sortOrder" = 2
WHERE "id" = 'work-either';
