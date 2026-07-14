import { NextResponse } from "next/server";
import { TWITCH_STATUS_CACHE_SECONDS } from "@/lib/twitch/cache";
import { fetchTwitchStreamStatus } from "@/lib/twitch/fetchTwitchStreamStatus";

export const revalidate = 600;

export async function GET() {
  const status = await fetchTwitchStreamStatus();

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": `public, max-age=${TWITCH_STATUS_CACHE_SECONDS}, s-maxage=${TWITCH_STATUS_CACHE_SECONDS}, stale-while-revalidate=1800`,
    },
  });
}
