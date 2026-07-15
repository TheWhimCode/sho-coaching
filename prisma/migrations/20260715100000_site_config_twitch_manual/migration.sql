-- Manual Twitch live toggle for the guide page (no Twitch API polling).
CREATE TABLE "public"."SiteConfig" (
    "id" TEXT NOT NULL,
    "twitchLiveManual" BOOLEAN NOT NULL DEFAULT false,
    "twitchStreamTitle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "public"."SiteConfig" ("id", "twitchLiveManual", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP);
