import type { SessionConfig } from "@/engine/session/model/session";

export const INGAME_MIN = 45;

export function totalLiveMinutes(session: SessionConfig) {
  return session.liveMin + session.liveBlocks * INGAME_MIN;
}

export function toCalendarQuery(session: SessionConfig) {
  return {
    liveMinutes: totalLiveMinutes(session),
    followups: session.followups,
    liveBlocks: session.liveBlocks,
  };
}
