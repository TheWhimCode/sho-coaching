CREATE TABLE "admin"."WhatNowQuestion" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WhatNowQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin"."WhatNowChoice" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "next" TEXT,
    "minEnergy" INTEGER,
    "maxEnergy" INTEGER,
    "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WhatNowChoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatNowChoice_questionId_sortOrder_idx" ON "admin"."WhatNowChoice"("questionId", "sortOrder");

INSERT INTO "admin"."WhatNowQuestion" ("id", "prompt", "sortOrder") VALUES
    ('feel', 'How do you feel?', 0),
    ('work-kind', 'What do you want to use it on?', 1),
    ('meh-need', 'What would help?', 2),
    ('bad-need', 'What''s the priority?', 3),
    ('miserable-need', 'What do you need?', 4);

INSERT INTO "admin"."WhatNowChoice" ("id", "questionId", "label", "next", "minEnergy", "maxEnergy", "categories", "sortOrder") VALUES
    ('feel-work', 'feel', 'I can work', 'work-kind', 6, NULL, ARRAY[]::TEXT[], 0),
    ('feel-meh', 'feel', 'Meh', 'meh-need', 3, 7, ARRAY[]::TEXT[], 1),
    ('feel-bad', 'feel', 'Pretty bad', 'bad-need', 1, 6, ARRAY[]::TEXT[], 2),
    ('feel-miserable', 'feel', 'Miserable', 'miserable-need', 1, 6, ARRAY[]::TEXT[], 3),
    ('work-create', 'work-kind', 'Make something', NULL, NULL, NULL, ARRAY['tiktok','twitter','reddit','vtubing','blender','unity']::TEXT[], 0),
    ('work-life', 'work-kind', 'Life stuff', NULL, NULL, NULL, ARRAY['selfcare','food','home']::TEXT[], 1),
    ('work-either', 'work-kind', 'Doesn''t matter', NULL, NULL, NULL, ARRAY[]::TEXT[], 2),
    ('meh-small', 'meh-need', 'A small useful thing', NULL, NULL, NULL, ARRAY[]::TEXT[], 0),
    ('meh-care', 'meh-need', 'Take care of myself', NULL, NULL, NULL, ARRAY['selfcare','food','home']::TEXT[], 1),
    ('meh-light', 'meh-need', 'Something creative, but light', NULL, NULL, 6, ARRAY['tiktok','twitter','reddit','vtubing','blender','unity']::TEXT[], 2),
    ('bad-body', 'bad-need', 'Food or body', NULL, NULL, NULL, ARRAY['food','selfcare']::TEXT[], 0),
    ('bad-home', 'bad-need', 'A tiny home thing', NULL, NULL, NULL, ARRAY['home']::TEXT[], 1),
    ('bad-easy', 'bad-need', 'Don''t make me think', NULL, NULL, 6, ARRAY['selfcare','food','home']::TEXT[], 2),
    ('miserable-eat', 'miserable-need', 'Eat', NULL, NULL, NULL, ARRAY['food']::TEXT[], 0),
    ('miserable-rest', 'miserable-need', 'Rest / stop', NULL, NULL, NULL, ARRAY['selfcare']::TEXT[], 1),
    ('miserable-tiny', 'miserable-need', 'Anything tiny', NULL, NULL, NULL, ARRAY['selfcare','food','home']::TEXT[], 2);
