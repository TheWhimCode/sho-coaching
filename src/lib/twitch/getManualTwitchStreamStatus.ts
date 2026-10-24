import "server-only";

import status from "@/data/guide/twitch-status.json";
import type { TwitchStreamStatus } from "./types";

export async function getManualTwitchStreamStatus(): Promise<TwitchStreamStatus> {
  return status;
}
