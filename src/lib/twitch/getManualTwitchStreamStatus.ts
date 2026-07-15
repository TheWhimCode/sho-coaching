import "server-only";

import { prisma } from "@/lib/prisma";
import type { TwitchStreamStatus } from "./types";

export async function getManualTwitchStreamStatus(): Promise<TwitchStreamStatus> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { id: "default" },
      select: { twitchLiveManual: true, twitchStreamTitle: true },
    });

    if (!row?.twitchLiveManual) {
      return { isLive: false };
    }

    return {
      isLive: true,
      title: row.twitchStreamTitle?.trim() || undefined,
    };
  } catch {
    return { isLive: false };
  }
}
